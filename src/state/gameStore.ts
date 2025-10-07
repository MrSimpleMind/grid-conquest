import { create } from "zustand";
import { generateMap } from "../game/mapGenerator";
import { runAiTurn } from "../game/ai";
import { getAvailableBlueprints } from "../game/units";
import { calculateStats, determineMajorityOwner, getCell } from "../game/utils";
import { performMove } from "../game/performMove";
import {
  Battalion,
  Cell,
  GameSnapshot,
  GameStats,
  GameStatus,
  LastAction,
  Owner,
  Player,
} from "../types";

const DEFAULT_GRID_SIZE = 8;
const INITIAL_RESOURCES: Record<Player, number> = { player: 1, ai: 1 };

interface GameStoreState extends GameSnapshot {
  stats: GameStats;
  selectedCellId: string | null;
  selectedBattalionId: string | null;
  isHydrated: boolean;
  actions: {
    selectCell: (id: string) => void;
    moveTo: (id: string) => void;
    endTurn: () => void;
    newGame: (size?: number) => void;
    setGridSize: (size: number) => void;
    hydrate: (snapshot?: GameSnapshot) => void;
    clearSelection: () => void;
    produceAt: (cellId: string, promptUnit: (options: Battalion[]) => Battalion | null) => void;
  };
}

function normalizeCell(cell: Partial<Cell>): Cell {
  return {
    id: cell.id ?? "0-0",
    x: cell.x ?? 0,
    y: cell.y ?? 0,
    type: cell.type ?? "neutral",
    owner: cell.owner ?? null,
    specialization: cell.type === "base" ? cell.specialization ?? null : null,
    battalions: (cell.battalions ?? []).map((unit) => ({
      ...unit,
      movementLeft: unit.movementLeft ?? unit.maxMovement ?? 0,
    })),
    resourceClaimedBy: { ...(cell.resourceClaimedBy ?? {}) },
  };
}

function normalizeCells(cells: Partial<Cell>[]): Cell[] {
  return cells.map((cell) => normalizeCell(cell));
}

function resetMovement(cells: Cell[], owner: Player) {
  cells.forEach((cell) => {
    cell.battalions
      .filter((unit) => unit.owner === owner)
      .forEach((unit) => {
        unit.movementLeft = unit.maxMovement;
      });
  });
}

function createSnapshot(size: number): GameSnapshot {
  const cells = normalizeCells(generateMap({ size }));
  resetMovement(cells, "player");
  resetMovement(cells, "ai");
  return {
    gridSize: size,
    cells,
    currentTurn: "player",
    turnNumber: 1,
    majorityOwner: null,
    majorityStreak: 0,
    status: "playing",
    lastAction: undefined,
    resources: { ...INITIAL_RESOURCES },
  };
}

function checkBaseVictory(stats: GameStats): GameStatus | null {
  if (stats.bases.player === 0) {
    return "aiVictory";
  }
  if (stats.bases.ai === 0) {
    return "playerVictory";
  }
  return null;
}

function updateMajority(
  stats: GameStats,
  majorityOwner: Owner,
  majorityStreak: number,
  status: GameStatus
): { status: GameStatus; majorityOwner: Owner; majorityStreak: number } {
  if (status !== "playing") {
    return { status, majorityOwner, majorityStreak };
  }

  const contender = determineMajorityOwner(stats);
  if (!contender) {
    return { status, majorityOwner: null, majorityStreak: 0 };
  }

  if (majorityOwner === contender) {
    majorityStreak += 1;
  } else {
    majorityOwner = contender;
    majorityStreak = 1;
  }

  if (majorityStreak >= 10) {
    return {
      status: contender === "player" ? "playerMajority" : "aiMajority",
      majorityOwner: contender,
      majorityStreak,
    };
  }

  return { status, majorityOwner, majorityStreak };
}

function getControlledSpecializations(cells: Cell[], owner: Player) {
  const controlled = new Set<"barracks" | "forge" | "sanctuary">();
  cells.forEach((cell) => {
    if (cell.owner === owner && cell.type === "base" && cell.specialization) {
      controlled.add(cell.specialization);
    }
  });
  return controlled;
}

function listPlayerBattalions(cell: Cell, owner: Player): Battalion[] {
  return cell.battalions.filter((unit) => unit.owner === owner);
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...(() => {
    const snapshot = createSnapshot(DEFAULT_GRID_SIZE);
    const stats = calculateStats(snapshot.cells);
    return {
      ...snapshot,
      stats,
      selectedCellId: null,
      selectedBattalionId: null,
      isHydrated: false,
    };
  })(),
  actions: {
    hydrate: (snapshot?: GameSnapshot) => {
      if (!snapshot || !Array.isArray(snapshot.cells?.[0]?.battalions)) {
        const fresh = createSnapshot(DEFAULT_GRID_SIZE);
        const stats = calculateStats(fresh.cells);
        set({ ...fresh, stats, selectedCellId: null, selectedBattalionId: null, isHydrated: true });
        return;
      }
      const cells = normalizeCells(snapshot.cells);
      const stats = calculateStats(cells);
      const resources = snapshot.resources ?? { ...INITIAL_RESOURCES };
      set({
        ...snapshot,
        cells,
        stats,
        resources,
        selectedCellId: null,
        selectedBattalionId: null,
        isHydrated: true,
      });
    },
    selectCell: (id: string) => {
      const state = get();
      if (state.status !== "playing" || state.currentTurn !== "player") {
        return;
      }
      const cell = getCell(state.cells, id);
      if (!cell || cell.owner !== "player") {
        set({ selectedCellId: null, selectedBattalionId: null });
        return;
      }
      const battalion = listPlayerBattalions(cell, "player")[0] ?? null;
      const newSelectedId = state.selectedCellId === id ? null : id;
      set({
        selectedCellId: newSelectedId,
        selectedBattalionId: newSelectedId ? battalion?.id ?? null : null,
      });
    },
    clearSelection: () => set({ selectedCellId: null, selectedBattalionId: null }),
    moveTo: (id: string) => {
      const state = get();
      if (
        !state.selectedCellId ||
        !state.selectedBattalionId ||
        state.status !== "playing" ||
        state.currentTurn !== "player"
      ) {
        return;
      }

      const outcome = performMove(
        state.cells,
        state.selectedCellId,
        id,
        "player",
        state.selectedBattalionId
      );

      if (outcome.cells === state.cells) {
        return;
      }

      let resources = { ...state.resources };
      if (outcome.lastAction?.resourceReward) {
        resources = {
          ...resources,
          player: resources.player + outcome.lastAction.resourceReward,
        };
      }

      const stats = calculateStats(outcome.cells);
      const baseVictory = checkBaseVictory(stats);

      if (baseVictory) {
        set({
          cells: outcome.cells,
          stats,
          lastAction: outcome.lastAction,
          status: baseVictory,
          majorityOwner: null,
          majorityStreak: 0,
          resources,
          selectedCellId: null,
          selectedBattalionId: null,
        });
        return;
      }

      set({
        cells: outcome.cells,
        stats,
        lastAction: outcome.lastAction,
        resources,
        selectedCellId: null,
        selectedBattalionId: null,
      });
    },
    endTurn: () => {
      const state = get();
      if (state.status !== "playing" || state.currentTurn !== "player") {
        return;
      }

      const clearedSelection = { selectedCellId: null, selectedBattalionId: null };
      let cells = normalizeCells(state.cells);
      let resources = { ...state.resources };
      let stats = calculateStats(cells);
      let status: GameStatus = state.status;
      let majorityOwner = state.majorityOwner;
      let majorityStreak = state.majorityStreak;
      let lastAction: LastAction | undefined = state.lastAction;

      const playerVictory = checkBaseVictory(stats);
      if (playerVictory) {
        set({
          cells,
          stats,
          status: playerVictory,
          majorityOwner: null,
          majorityStreak: 0,
          ...clearedSelection,
        });
        return;
      }

      resetMovement(cells, "ai");
      const aiResult = runAiTurn(cells, resources);
      cells = aiResult.cells;
      resources = aiResult.resources;
      if (aiResult.lastAction) {
        lastAction = aiResult.lastAction;
      }
      stats = calculateStats(cells);

      const postAiVictory = checkBaseVictory(stats);
      if (postAiVictory) {
        set({
          cells,
          stats,
          status: postAiVictory,
          majorityOwner: null,
          majorityStreak: 0,
          lastAction,
          ...clearedSelection,
          currentTurn: "ai",
          resources,
        });
        return;
      }

      const majorityProgress = updateMajority(stats, majorityOwner, majorityStreak, status);
      status = majorityProgress.status;
      majorityOwner = majorityProgress.majorityOwner;
      majorityStreak = majorityProgress.majorityStreak;

      resetMovement(cells, "player");

      set({
        cells,
        stats,
        resources,
        currentTurn: "player",
        turnNumber: state.turnNumber + 1,
        status,
        majorityOwner,
        majorityStreak,
        lastAction,
        ...clearedSelection,
      });
    },
    newGame: (size?: number) => {
      const gridSize = size ?? get().gridSize;
      const snapshot = createSnapshot(gridSize);
      const stats = calculateStats(snapshot.cells);
      set({
        ...snapshot,
        stats,
        selectedCellId: null,
        selectedBattalionId: null,
      });
    },
    setGridSize: (size: number) => {
      const state = get();
      if (state.gridSize === size) {
        return;
      }
      const snapshot = createSnapshot(size);
      const stats = calculateStats(snapshot.cells);
      set({
        ...snapshot,
        stats,
        selectedCellId: null,
        selectedBattalionId: null,
      });
    },
    produceAt: (cellId: string, promptUnit: (options: Battalion[]) => Battalion | null) => {
      const state = get();
      if (state.status !== "playing" || state.currentTurn !== "player") {
        return;
      }
      const cell = getCell(state.cells, cellId);
      if (!cell || cell.owner !== "player" || cell.type !== "base") {
        return;
      }

      const specializations = getControlledSpecializations(state.cells, "player");
      const blueprints = getAvailableBlueprints(specializations);
      const prospectiveUnits = blueprints.map((blueprint) => ({
        id: `${blueprint.type}-preview`,
        owner: "player" as Player,
        type: blueprint.type,
        soldiers: blueprint.soldiers,
        attack: blueprint.attack,
        defense: blueprint.defense,
        maxMovement: blueprint.movement,
        movementLeft: blueprint.movement,
      }));

      const choice = promptUnit(prospectiveUnits);
      if (!choice) {
        return;
      }

      const blueprint = blueprints.find((bp) => bp.type === choice.type);
      if (!blueprint) {
        return;
      }

      if (state.resources.player < blueprint.cost) {
        return;
      }

      const newUnit: Battalion = {
        id: `${choice.type}-${Date.now()}`,
        owner: "player",
        type: choice.type,
        soldiers: blueprint.soldiers,
        attack: blueprint.attack,
        defense: blueprint.defense,
        maxMovement: blueprint.movement,
        movementLeft: blueprint.movement,
      };

      const updatedCells = state.cells.map((candidate) =>
        candidate.id === cell.id
          ? { ...candidate, battalions: [...candidate.battalions, newUnit] }
          : candidate
      );

      const stats = calculateStats(updatedCells);

      set({
        cells: updatedCells,
        stats,
        resources: {
          ...state.resources,
          player: state.resources.player - blueprint.cost,
        },
      });
    },
  },
}));

export type GameStore = ReturnType<typeof useGameStore>;

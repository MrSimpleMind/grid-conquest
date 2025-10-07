import { create } from "zustand";
import { generateMap } from "../game/mapGenerator";
import { runAiTurn } from "../game/ai";
import { calculateStats, determineMajorityOwner, getCell } from "../game/utils";
import { performMove } from "../game/performMove";
import {
  Cell,
  GameSnapshot,
  GameStats,
  GameStatus,
  LastAction,
  Owner,
  Player,
} from "../types";

const DEFAULT_GRID_SIZE = 8;

interface GameStoreState extends GameSnapshot {
  stats: GameStats;
  selectedCellId: string | null;
  isHydrated: boolean;
  actions: {
    selectCell: (id: string) => void;
    moveTo: (id: string) => void;
    endTurn: () => void;
    newGame: (size?: number) => void;
    setGridSize: (size: number) => void;
    hydrate: (snapshot?: GameSnapshot) => void;
    clearSelection: () => void;
  };
}

function sanitizeCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({
    ...cell,
    specialization: cell.type === "base" ? cell.specialization ?? null : null,
    specialUnits: {
      elite: cell.specialUnits?.elite ?? 0,
      guardian: cell.specialUnits?.guardian ?? 0,
    },
  }));
}

function cloneCell(cell: Cell): Cell {
  return { ...cell, specialUnits: { ...cell.specialUnits } };
}

function createSnapshot(size: number): GameSnapshot {
  const cells = sanitizeCells(generateMap({ size }));
  return {
    gridSize: size,
    cells: produceUnitsForPlayer(cells, "player"),
    currentTurn: "player",
    turnNumber: 1,
    majorityOwner: null,
    majorityStreak: 0,
    status: "playing",
    lastAction: undefined,
  };
}

function produceUnitsForPlayer(cells: Cell[], player: Player): Cell[] {
  const sanitized = sanitizeCells(cells);
  const updated = sanitized.map((cell) => cloneCell(cell));
  const resources = updated.filter(
    (cell) => cell.owner === player && cell.type === "resource"
  ).length;
  const baseProduction = 2 + resources;

  updated.forEach((cell) => {
    if (cell.owner !== player || cell.type !== "base") {
      return;
    }

    let production = baseProduction;
    let eliteProduced = 0;
    let guardianProduced = 0;

    switch (cell.specialization) {
      case "barracks":
        production += 2;
        break;
      case "forge":
        production += 1;
        eliteProduced = Math.max(1, Math.floor(baseProduction / 2));
        break;
      case "sanctuary":
        production += 1;
        guardianProduced = Math.max(1, Math.floor(baseProduction / 2));
        break;
      default:
        break;
    }

    cell.units += production;
    if (eliteProduced > 0) {
      cell.specialUnits.elite += eliteProduced;
    }
    if (guardianProduced > 0) {
      cell.specialUnits.guardian += guardianProduced;
    }

    if (cell.specialUnits.elite > cell.units) {
      cell.specialUnits.elite = cell.units;
    }
    const remaining = Math.max(cell.units - cell.specialUnits.elite, 0);
    if (cell.specialUnits.guardian > remaining) {
      cell.specialUnits.guardian = remaining;
    }
  });

  return updated;
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

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...(() => {
    const snapshot = createSnapshot(DEFAULT_GRID_SIZE);
    const stats = calculateStats(snapshot.cells);
    return {
      ...snapshot,
      stats,
      selectedCellId: null,
      isHydrated: false,
    };
  })(),
  actions: {
    hydrate: (snapshot?: GameSnapshot) => {
      if (!snapshot) {
        set({ isHydrated: true });
        return;
      }
      const cells = sanitizeCells(snapshot.cells);
      const stats = calculateStats(cells);
      set({
        ...snapshot,
        cells,
        stats,
        selectedCellId: null,
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
        return;
      }
      set({ selectedCellId: state.selectedCellId === id ? null : id });
    },
    clearSelection: () => set({ selectedCellId: null }),
    moveTo: (id: string) => {
      const state = get();
      if (!state.selectedCellId || state.status !== "playing" || state.currentTurn !== "player") {
        return;
      }
      const { cells, lastAction } = performMove(state.cells, state.selectedCellId, id, "player");
      if (cells === state.cells) {
        return;
      }
      const stats = calculateStats(cells);
      const baseVictory = checkBaseVictory(stats);
      if (baseVictory) {
        set({
          cells,
          stats,
          lastAction,
          status: baseVictory,
          majorityOwner: null,
          majorityStreak: 0,
        });
        return;
      }
      set({ cells, stats, lastAction });
    },
    endTurn: () => {
      const state = get();
      if (state.status !== "playing" || state.currentTurn !== "player") {
        return;
      }

      let cells = state.cells.map((cell) => ({ ...cell }));
      let stats = calculateStats(cells);
      const playerVictory = checkBaseVictory(stats);

      if (playerVictory) {
        set({
          cells,
          stats,
          status: playerVictory,
          majorityOwner: null,
          majorityStreak: 0,
          selectedCellId: null,
        });
        return;
      }

      // AI turn start
      cells = produceUnitsForPlayer(cells, "ai");
      stats = calculateStats(cells);
      let status: GameStatus = state.status;
      let majorityOwner = state.majorityOwner;
      let majorityStreak = state.majorityStreak;

      const postProductionVictory = checkBaseVictory(stats);
      if (postProductionVictory) {
        set({
          cells,
          stats,
          status: postProductionVictory,
          majorityOwner: null,
          majorityStreak: 0,
          selectedCellId: null,
        });
        return;
      }

      let lastAction: LastAction | undefined = state.lastAction;

      const aiOutcome = runAiTurn(cells);
      cells = aiOutcome.cells;
      if (aiOutcome.lastAction) {
        lastAction = aiOutcome.lastAction;
      }
      stats = calculateStats(cells);

      const postAttackVictory = checkBaseVictory(stats);
      if (postAttackVictory) {
        set({
          cells,
          stats,
          lastAction,
          selectedCellId: null,
          currentTurn: "ai",
          status: postAttackVictory,
          majorityOwner: null,
          majorityStreak: 0,
        });
        return;
      }

      const majorityProgress = updateMajority(stats, majorityOwner, majorityStreak, status);
      status = majorityProgress.status;
      majorityOwner = majorityProgress.majorityOwner;
      majorityStreak = majorityProgress.majorityStreak;

      if (status !== "playing") {
        set({
          cells,
          stats,
          lastAction,
          selectedCellId: null,
          currentTurn: "ai",
          status,
          majorityOwner,
          majorityStreak,
        });
        return;
      }

      // Player turn start
      cells = produceUnitsForPlayer(cells, "player");
      stats = calculateStats(cells);

      set({
        cells,
        stats,
        currentTurn: "player",
        turnNumber: state.turnNumber + 1,
        selectedCellId: null,
        lastAction,
        status,
        majorityOwner,
        majorityStreak,
      });
    },
    newGame: (size?: number) => {
      const state = get();
      const gridSize = size ?? state.gridSize;
      const snapshot = createSnapshot(gridSize);
      const stats = calculateStats(snapshot.cells);
      set({
        ...snapshot,
        stats,
        selectedCellId: null,
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
      });
    },
  },
}));

export type GameStore = ReturnType<typeof useGameStore>;

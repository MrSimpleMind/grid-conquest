import { Cell, LastAction, Player } from "../types";
import { performMove, previewAttackPower, previewDefensePower } from "./performMove";
import { canReachWithinMovement, getNeighbors } from "./utils";

const MIN_UNITS_TO_MOVE = 2;

interface AttackOption {
  from: Cell;
  to: Cell;
  priority: number;
}

function totalUnitsForOwner(cells: Cell[], owner: Player): number {
  return cells
    .filter((cell) => cell.owner === owner)
    .reduce((sum, cell) => sum + cell.units, 0);
}

export function runAiTurn(cells: Cell[]): {
  cells: Cell[];
  lastAction?: LastAction;
} {
  const aiCells = cells.filter((cell) => cell.owner === "ai" && cell.units >= MIN_UNITS_TO_MOVE);
  if (aiCells.length === 0) {
    return { cells };
  }

  const options: AttackOption[] = [];

  const aiBases = cells.filter((cell) => cell.owner === "ai" && cell.type === "base");
  aiBases.forEach((base) => {
    const neighbors = getNeighbors(cells, base);
    neighbors
      .filter((neighbor) => neighbor.owner === "player")
      .forEach((enemy) => {
        aiCells
          .filter((candidate) => canReachWithinMovement(cells, candidate, enemy, "ai"))
          .forEach((candidate) => {
            options.push({ from: candidate, to: enemy, priority: 3 });
          });
      });
  });

  if (!options.length) {
    aiCells.forEach((cell) => {
      cells
        .filter((candidate) => candidate.id !== cell.id)
        .filter((candidate) => candidate.type === "resource" && candidate.owner !== "ai")
        .forEach((resource) => {
          if (canReachWithinMovement(cells, cell, resource, "ai")) {
            options.push({ from: cell, to: resource, priority: 2 });
          }
        });
    });
  }

  if (!options.length) {
    aiCells.forEach((cell) => {
      cells
        .filter((candidate) => candidate.id !== cell.id)
        .filter((candidate) => candidate.owner === "player" || candidate.type === "base")
        .forEach((enemy) => {
          if (canReachWithinMovement(cells, cell, enemy, "ai")) {
            options.push({ from: cell, to: enemy, priority: 1 });
          }
        });
    });
  }

  if (!options.length) {
    aiCells.forEach((cell) => {
      cells
        .filter((candidate) => candidate.id !== cell.id)
        .filter((candidate) => !candidate.owner)
        .forEach((neutral) => {
          if (canReachWithinMovement(cells, cell, neutral, "ai")) {
            options.push({ from: cell, to: neutral, priority: 0 });
          }
        });
    });
  }

  if (!options.length) {
    return { cells };
  }

  const scored = options
    .map((option) => {
      const attackPower = previewAttackPower(option.from);
      const defensePower = previewDefensePower(option.to);
      const simulation = performMove(cells, option.from.id, option.to.id, "ai");
      if (simulation.cells === cells) {
        return null;
      }

      const aiUnitsBefore = totalUnitsForOwner(cells, "ai");
      const aiUnitsAfter = totalUnitsForOwner(simulation.cells, "ai");
      const playerUnitsBefore = totalUnitsForOwner(cells, "player");
      const playerUnitsAfter = totalUnitsForOwner(simulation.cells, "player");

      const unitsDelta = (aiUnitsAfter - aiUnitsBefore) - (playerUnitsAfter - playerUnitsBefore);
      const specializationBonus =
        option.to.type === "base" && option.to.specialization && option.to.owner !== "ai"
          ? 250
          : 0;

      const score =
        option.priority * 1000 +
        unitsDelta * 5 +
        (attackPower - defensePower) * 10 +
        specializationBonus;

      return { ...option, score };
    })
    .filter((value): value is AttackOption & { score: number } => Boolean(value))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) {
    return { cells };
  }

  const outcome = performMove(cells, best.from.id, best.to.id, "ai");
  return { cells: outcome.cells, lastAction: outcome.lastAction };
}

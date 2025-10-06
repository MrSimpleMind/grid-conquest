import { Cell, LastAction } from "../types";
import { canReachWithinMovement, getNeighbors, getCellIndex } from "./utils";

const MIN_UNITS_TO_MOVE = 2;

interface AttackOption {
  from: Cell;
  to: Cell;
  priority: number;
}

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({ ...cell }));
}

function unitsToDeploy(units: number): number {
  return Math.max(1, Math.floor(units / 2));
}

function executeMove(
  source: Cell,
  target: Cell,
  cells: Cell[]
): { cells: Cell[]; lastAction: LastAction } {
  const updated = cloneCells(cells);
  const fromIndex = getCellIndex(updated, source.id);
  const toIndex = getCellIndex(updated, target.id);
  const attacker = updated[fromIndex];
  const defender = updated[toIndex];

  const deployed = unitsToDeploy(attacker.units);
  attacker.units -= deployed;

  let conqueredOwner = defender.owner;

  if (!defender.owner || defender.owner !== attacker.owner) {
    if (deployed > defender.units) {
      defender.owner = attacker.owner;
      defender.units = deployed - defender.units;
      conqueredOwner = attacker.owner;
    } else {
      defender.units = defender.units - deployed;
      if (defender.units === 0) {
        defender.owner = null;
      }
    }
  } else {
    defender.units += deployed;
  }

  return {
    cells: updated,
    lastAction: {
      fromId: attacker.id,
      toId: defender.id,
      conqueredOwner,
      timestamp: Date.now(),
    },
  };
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
      const deployed = unitsToDeploy(option.from.units);
      const advantage = deployed - option.to.units;
      return { ...option, score: option.priority * 100 + advantage };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) {
    return { cells };
  }

  return executeMove(best.from, best.to, cells);
}

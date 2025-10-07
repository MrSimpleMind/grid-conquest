import { Cell, LastAction, Player } from "../types";
import { getNeighbors } from "./utils";
import { performMove } from "./performMove";
import { UNIT_BLUEPRINTS, createBattalion } from "./units";

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({
    ...cell,
    battalions: cell.battalions.map((unit) => ({ ...unit })),
    resourceClaimedBy: { ...cell.resourceClaimedBy },
  }));
}

interface AiOutcome {
  cells: Cell[];
  resources: Record<Player, number>;
  lastAction?: LastAction;
}

function produceUnits(cells: Cell[], resources: Record<Player, number>): void {
  const bases = cells.filter((cell) => cell.owner === "ai" && cell.type === "base");
  if (!bases.length || resources.ai < UNIT_BLUEPRINTS.infantry.cost) {
    return;
  }

  const base = bases[Math.floor(Math.random() * bases.length)];
  const newUnit = createBattalion({ owner: "ai", type: "infantry", initialMovement: 0 });
  base.battalions.push(newUnit);
  resources.ai -= UNIT_BLUEPRINTS.infantry.cost;
}

export function runAiTurn(
  cells: Cell[],
  resources: Record<Player, number>
): AiOutcome {
  let updatedCells = cloneCells(cells);
  const updatedResources: Record<Player, number> = { ...resources };
  let lastAction: LastAction | undefined;

  produceUnits(updatedCells, updatedResources);

  outer: for (const cell of updatedCells) {
    if (cell.owner !== "ai") {
      continue;
    }

    for (const battalion of cell.battalions) {
      if (battalion.owner !== "ai" || battalion.movementLeft <= 0) {
        continue;
      }

      const neighbors = getNeighbors(updatedCells, cell);
      for (const neighbor of neighbors) {
        if (neighbor.owner === "ai") {
          continue;
        }

        const outcome = performMove(updatedCells, cell.id, neighbor.id, "ai", battalion.id);
        if (outcome.cells !== updatedCells) {
          updatedCells = outcome.cells;
          if (outcome.lastAction?.resourceReward) {
            updatedResources.ai += outcome.lastAction.resourceReward;
          }
          lastAction = outcome.lastAction;
          break outer;
        }
      }
    }
  }

  return { cells: updatedCells, resources: updatedResources, lastAction };
}

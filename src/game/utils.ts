import { Cell, GameStats, Owner, Player } from "../types";

export function getCellIndex(cells: Cell[], id: string): number {
  return cells.findIndex((cell) => cell.id === id);
}

export function getCell(cells: Cell[], id: string): Cell | undefined {
  return cells.find((cell) => cell.id === id);
}

export function getNeighbors(cells: Cell[], origin: Cell): Cell[] {
  const deltas = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  return deltas
    .map(([dx, dy]) =>
      cells.find((cell) => cell.x === origin.x + dx && cell.y === origin.y + dy)
    )
    .filter((cell): cell is Cell => Boolean(cell));
}

export function areNeighbors(a: Cell, b: Cell): boolean {
  const distance = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  return distance === 1;
}

export function findMovementPath(
  cells: Cell[],
  from: Cell,
  to: Cell,
  player: Player,
  maxSteps = 3
): Cell[] | null {
  if (from.id === to.id) {
    return null;
  }

  const visited = new Set<string>([from.id]);
  const queue: { cell: Cell; path: Cell[] }[] = [{ cell: from, path: [from] }];

  while (queue.length > 0) {
    const { cell, path } = queue.shift()!;
    const steps = path.length - 1;

    if (steps >= maxSteps) {
      continue;
    }

    for (const neighbor of getNeighbors(cells, cell)) {
      if (visited.has(neighbor.id)) {
        continue;
      }

      const nextSteps = steps + 1;
      if (nextSteps > maxSteps) {
        continue;
      }

      if (neighbor.id === to.id) {
        return [...path, neighbor];
      }

      if (neighbor.owner === player) {
        visited.add(neighbor.id);
        queue.push({ cell: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return null;
}

export function canReachWithinMovement(
  cells: Cell[],
  from: Cell,
  to: Cell,
  player: Player,
  maxSteps = 3
): boolean {
  return Boolean(findMovementPath(cells, from, to, player, maxSteps));
}

export function calculateStats(cells: Cell[]): GameStats {
  const baseTotals: Record<Player, number> = { player: 0, ai: 0 };
  const resourceTotals: Record<Player, number> = { player: 0, ai: 0 };

  cells.forEach((cell) => {
    if (cell.owner) {
      if (cell.type === "base") {
        baseTotals[cell.owner] += 1;
      }
      if (cell.type === "resource") {
        resourceTotals[cell.owner] += 1;
      }
    }
  });

  return {
    bases: baseTotals,
    resources: resourceTotals,
  };
}

export function determineMajorityOwner(stats: GameStats): Owner {
  if (stats.bases.player === stats.bases.ai) {
    return null;
  }
  return stats.bases.player > stats.bases.ai ? "player" : "ai";
}

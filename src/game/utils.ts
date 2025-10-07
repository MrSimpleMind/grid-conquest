import { Battalion, Cell, GameStats, Owner, Player } from "../types";

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

export interface MovementResult {
  path: Cell[];
  cost: number;
}

export function findBattalionPath(
  cells: Cell[],
  from: Cell,
  to: Cell,
  battalion: Battalion
): MovementResult | null {
  if (from.id === to.id) {
    return null;
  }

  const queue: { cell: Cell; movementLeft: number; path: Cell[] }[] = [
    { cell: from, movementLeft: battalion.movementLeft, path: [from] },
  ];
  const bestMovement = new Map<string, number>([[from.id, battalion.movementLeft]]);

  while (queue.length > 0) {
    const { cell, movementLeft, path } = queue.shift()!;

    for (const neighbor of getNeighbors(cells, cell)) {
      const isFriendly = neighbor.owner === battalion.owner;
      if (!isFriendly && path.length > battalion.movementLeft) {
        continue;
      }

      let cost = 1;
      let remaining = movementLeft - cost;

      if (!isFriendly) {
        cost = movementLeft;
        remaining = 0;
        if (movementLeft <= 0) {
          continue;
        }
      }

      if (remaining < 0) {
        continue;
      }

      const nextPath = [...path, neighbor];

      if (neighbor.id === to.id) {
        return { path: nextPath, cost: battalion.movementLeft - remaining };
      }

      if (!isFriendly) {
        continue;
      }

      const previousBest = bestMovement.get(neighbor.id) ?? -1;
      if (remaining > previousBest) {
        bestMovement.set(neighbor.id, remaining);
        queue.push({ cell: neighbor, movementLeft: remaining, path: nextPath });
      }
    }
  }

  return null;
}

export function getReachableCells(
  cells: Cell[],
  from: Cell,
  battalion: Battalion
): { reachable: Cell[]; movementLeft: Map<string, number> } {
  const reachable = new Map<string, number>();
  const queue: { cell: Cell; movementLeft: number }[] = [
    { cell: from, movementLeft: battalion.movementLeft },
  ];

  while (queue.length > 0) {
    const { cell, movementLeft } = queue.shift()!;

    for (const neighbor of getNeighbors(cells, cell)) {
      const isFriendly = neighbor.owner === battalion.owner;
      let cost = 1;
      let remaining = movementLeft - cost;

      if (!isFriendly) {
        cost = movementLeft;
        remaining = 0;
        if (movementLeft <= 0) {
          continue;
        }
      }

      if (remaining < 0) {
        continue;
      }

      const existing = reachable.get(neighbor.id);
      if (existing === undefined || remaining > existing) {
        reachable.set(neighbor.id, remaining);
      }

      if (isFriendly && remaining > 0) {
        queue.push({ cell: neighbor, movementLeft: remaining });
      }
    }
  }

  return {
    reachable: cells.filter((cell) => reachable.has(cell.id)),
    movementLeft: reachable,
  };
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

import { useMemo } from "react";
import { getReachableCells } from "../game/utils";
import { Cell, LastAction } from "../types";
import { CellTile } from "./CellTile";

interface GameGridProps {
  cells: Cell[];
  gridSize: number;
  selectedCellId: string | null;
  lastAction?: LastAction;
  onCellClick: (cell: Cell) => void;
}

export function GameGrid({ cells, gridSize, selectedCellId, lastAction, onCellClick }: GameGridProps) {
  const movementOverlay = useMemo(() => {
    if (!selectedCellId) {
      return { active: false, reachable: new Set<string>() };
    }

    const selectedCell = cells.find((cell) => cell.id === selectedCellId);
    if (!selectedCell || selectedCell.owner !== "player" || selectedCell.units < 2) {
      return { active: false, reachable: new Set<string>() };
    }

    const reachableCells = getReachableCells(cells, selectedCell, "player", 3);
    const reachableIds = new Set(reachableCells.map((cell) => cell.id));

    if (reachableIds.size === 0) {
      return { active: false, reachable: reachableIds };
    }

    return { active: true, reachable: reachableIds };
  }, [cells, selectedCellId]);

  return (
    <div
      className="grid w-full max-w-4xl gap-1.5 rounded-2xl bg-slate-900/60 p-2 shadow-lg backdrop-blur sm:gap-2 sm:p-3"
      style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
    >
      {cells.map((cell) => (
        <CellTile
          key={cell.id}
          cell={cell}
          isSelected={selectedCellId === cell.id}
          isReachable={movementOverlay.reachable.has(cell.id)}
          isDimmed={movementOverlay.active && !movementOverlay.reachable.has(cell.id) && selectedCellId !== cell.id}
          showMovementOverlay={movementOverlay.active}
          lastAction={lastAction}
          onClick={() => onCellClick(cell)}
        />
      ))}
    </div>
  );
}

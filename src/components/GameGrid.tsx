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
  return (
    <div
      className="grid w-full max-w-4xl gap-2 rounded-2xl bg-slate-900/60 p-3 shadow-lg backdrop-blur"
      style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
    >
      {cells.map((cell) => (
        <CellTile
          key={cell.id}
          cell={cell}
          isSelected={selectedCellId === cell.id}
          lastAction={lastAction}
          onClick={() => onCellClick(cell)}
        />
      ))}
    </div>
  );
}

import clsx from "classnames";
import { Cell, LastAction } from "../types";

interface CellTileProps {
  cell: Cell;
  isSelected: boolean;
  lastAction?: LastAction;
  onClick: () => void;
}

const typeIcon: Record<Cell["type"], string> = {
  base: "🏰",
  resource: "💎",
  neutral: "",
};

export function CellTile({ cell, isSelected, lastAction, onClick }: CellTileProps) {
  const ownerClass = {
    player: "bg-gradient-to-br from-player-light/80 to-player-dark/70 border-player-light/60",
    ai: "bg-gradient-to-br from-ai-light/80 to-ai-dark/70 border-ai-light/60",
    null: "bg-gradient-to-br from-neutral-light/30 to-neutral-dark/30 border-slate-500/40",
  }[cell.owner ?? "null"];

  const conquered = lastAction?.toId === cell.id;
  const origin = lastAction?.fromId === cell.id;
  const ownerLabel =
    cell.owner === "player"
      ? "Comandante"
      : cell.owner === "ai"
      ? "IA"
      : cell.type === "resource"
      ? "Risorsa"
      : "Neutrale";
  const icon = typeIcon[cell.type];

  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative aspect-square overflow-hidden rounded-xl border backdrop-blur-sm transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
        ownerClass,
        conquered && "animate-conquer",
        origin && "animate-pulseGlow",
        isSelected && "ring-4 ring-amber-300",
        cell.owner === "player"
          ? "hover:-translate-y-0.5"
          : "hover:scale-[0.99]"
      )}
    >
      <div className="flex h-full w-full flex-col items-center justify-between gap-1.5 p-1 text-center sm:gap-2 sm:p-2">
        {icon && (
          <span className="text-base leading-none drop-shadow-sm sm:text-lg">{icon}</span>
        )}
        <span className="text-lg font-semibold leading-tight drop-shadow-md sm:text-2xl">
          {cell.units}
        </span>
        <span className="text-[0.6rem] uppercase tracking-wide text-slate-200/80 leading-tight sm:text-xs">
          <span className="block w-full truncate">{ownerLabel}</span>
        </span>
      </div>
    </button>
  );
}

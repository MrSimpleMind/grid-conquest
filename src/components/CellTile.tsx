import clsx from "classnames";
import { Cell, LastAction } from "../types";

interface CellTileProps {
  cell: Cell;
  isSelected: boolean;
  isReachable: boolean;
  isDimmed: boolean;
  showMovementOverlay: boolean;
  lastAction?: LastAction;
  onClick: () => void;
}

const typeIcon: Record<Cell["type"], string> = {
  base: "🏰",
  resource: "💎",
  neutral: "",
};

const specializationInfo = {
  barracks: {
    icon: "🎖️",
    label: "Caserma avanzata",
    description: "Sblocca unità d'assalto veloci.",
  },
  forge: {
    icon: "⚒️",
    label: "Forgia da guerra",
    description: "Permette l'impiego dell'artiglieria pesante.",
  },
  sanctuary: {
    icon: "🛡️",
    label: "Santuario difensivo",
    description: "Addestra battaglioni di guardiani difensivi.",
  },
} as const;

function buildTooltip(cell: Cell): string | undefined {
  if (!cell.battalions.length) {
    return undefined;
  }

  return cell.battalions
    .map((unit) => {
      const ownerLabel = unit.owner === "player" ? "Comandante" : "IA";
      return `${ownerLabel} · ${unit.type.toUpperCase()} · Soldati ${unit.soldiers} · Movimento ${unit.movementLeft}/${unit.maxMovement}`;
    })
    .join("\n");
}

export function CellTile({
  cell,
  isSelected,
  isReachable,
  isDimmed,
  showMovementOverlay,
  lastAction,
  onClick,
}: CellTileProps) {
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
  const specialization =
    cell.type === "base" && cell.specialization ? specializationInfo[cell.specialization] : null;

  const displayedUnits = cell.owner
    ? cell.battalions.filter((unit) => unit.owner === cell.owner)
    : cell.battalions;
  const stackSize = displayedUnits.length;
  const soldierCount = displayedUnits.reduce((sum, unit) => sum + unit.soldiers, 0);

  const overlayClass = showMovementOverlay
    ? isSelected || isReachable
      ? "after:absolute after:inset-0 after:bg-amber-200/20 after:mix-blend-screen after:opacity-100 after:pointer-events-none"
      : "after:absolute after:inset-0 after:bg-slate-950/70 after:pointer-events-none"
    : "";

  const tooltip = buildTooltip(cell);
  const baseTitle = specialization
    ? `${specialization.label}: ${specialization.description}`
    : cell.type === "resource"
    ? "Fornisce risorse bonus una volta conquistata."
    : undefined;
  const title = [baseTitle, tooltip].filter(Boolean).join("\n");

  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative aspect-square overflow-hidden rounded-xl border backdrop-blur-sm transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
        ownerClass,
        conquered && "animate-conquer",
        origin && "animate-pulseGlow",
        isSelected && "ring-4 ring-amber-300",
        showMovementOverlay && isDimmed && "brightness-50",
        overlayClass,
        cell.owner === "player" ? "hover:-translate-y-0.5" : "hover:scale-[0.99]"
      )}
      title={title || undefined}
    >
      <div className="flex h-full w-full flex-col items-center justify-between gap-1.5 p-1 text-center sm:gap-2 sm:p-2">
        {specialization && (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-200 drop-shadow-sm">
            <span>{specialization.icon}</span>
            <span className="hidden sm:inline">{specialization.label}</span>
          </span>
        )}
        {icon && <span className="text-base leading-none drop-shadow-sm sm:text-lg">{icon}</span>}
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold leading-tight drop-shadow-md sm:text-2xl">
            {stackSize > 0 ? `${stackSize}×` : "—"}
          </span>
          {stackSize > 0 && (
            <span className="rounded-full bg-slate-900/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-slate-200/80 sm:text-xs">
              {soldierCount} soldati
            </span>
          )}
        </div>
        <span className="text-[0.6rem] uppercase tracking-wide text-slate-200/80 leading-tight sm:text-xs">
          <span className="block w-full truncate">{ownerLabel}</span>
        </span>
      </div>
    </button>
  );
}

import clsx from "classnames";
import { useMemo } from "react";
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

const terrainTextures: ReadonlyArray<ReadonlyArray<string>> = [
  [
    "radial-gradient(circle at 18% 22%, rgba(226, 232, 240, 0.16) 0, rgba(226, 232, 240, 0) 55%)",
    "radial-gradient(circle at 82% 28%, rgba(59, 130, 246, 0.1) 0, rgba(59, 130, 246, 0) 52%)",
    "linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 52%, rgba(15, 23, 42, 0.98) 100%)",
  ],
  [
    "radial-gradient(circle at 20% 80%, rgba(248, 250, 252, 0.12) 0, rgba(248, 250, 252, 0) 50%)",
    "radial-gradient(circle at 75% 20%, rgba(45, 212, 191, 0.12) 0, rgba(45, 212, 191, 0) 47%)",
    "linear-gradient(165deg, rgba(12, 10, 25, 0.95) 0%, rgba(30, 27, 75, 0.88) 48%, rgba(15, 23, 42, 0.96) 100%)",
  ],
  [
    "radial-gradient(circle at 30% 30%, rgba(148, 163, 184, 0.18) 0, rgba(148, 163, 184, 0) 45%)",
    "radial-gradient(circle at 70% 70%, rgba(96, 165, 250, 0.12) 0, rgba(96, 165, 250, 0) 55%)",
    "linear-gradient(150deg, rgba(12, 74, 110, 0.9) 0%, rgba(8, 47, 73, 0.85) 60%, rgba(15, 23, 42, 0.95) 100%)",
  ],
  [
    "radial-gradient(circle at 65% 25%, rgba(253, 224, 71, 0.12) 0, rgba(253, 224, 71, 0) 40%)",
    "radial-gradient(circle at 25% 70%, rgba(248, 113, 113, 0.12) 0, rgba(248, 113, 113, 0) 50%)",
    "linear-gradient(140deg, rgba(67, 20, 7, 0.88) 0%, rgba(88, 28, 135, 0.82) 50%, rgba(15, 23, 42, 0.95) 100%)",
  ],
  [
    "radial-gradient(circle at 15% 50%, rgba(248, 250, 252, 0.1) 0, rgba(248, 250, 252, 0) 48%)",
    "radial-gradient(circle at 88% 60%, rgba(129, 140, 248, 0.15) 0, rgba(129, 140, 248, 0) 55%)",
    "linear-gradient(175deg, rgba(30, 64, 175, 0.85) 0%, rgba(30, 64, 175, 0.76) 40%, rgba(30, 58, 138, 0.92) 100%)",
  ],
];

const ownerOverlays = {
  player: {
    border: "border-player-light/70",
    gradient: "linear-gradient(135deg, rgba(226, 232, 255, 0.18), rgba(59, 130, 246, 0.15))",
  },
  ai: {
    border: "border-ai-light/70",
    gradient: "linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(239, 68, 68, 0.25))",
  },
  null: {
    border: "border-slate-600/60",
    gradient: "linear-gradient(135deg, rgba(148, 163, 184, 0.08), rgba(30, 41, 59, 0.22))",
  },
} satisfies Record<"player" | "ai" | "null", { border: string; gradient: string | null }>;
type OwnerVisualKey = keyof typeof ownerOverlays;

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
  const ownerKey = (cell.owner ?? "null") as OwnerVisualKey;
  const ownerStyle = ownerOverlays[ownerKey];
  const backgroundTextureLayers = useMemo(
    () => terrainTextures[Math.floor(Math.random() * terrainTextures.length)],
    []
  );
  const backgroundLayers = useMemo(() => {
    const layers = [...backgroundTextureLayers];
    if (ownerStyle.gradient) {
      layers.push(ownerStyle.gradient);
    }
    return layers.join(", ");
  }, [backgroundTextureLayers, ownerStyle.gradient]);
  const layerCount = backgroundTextureLayers.length + (ownerStyle.gradient ? 1 : 0);
  const backgroundSize = Array(layerCount).fill("cover").join(", ");
  const backgroundRepeat = Array(layerCount).fill("no-repeat").join(", ");

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
        "relative aspect-square overflow-hidden rounded-none border bg-cover bg-center bg-no-repeat backdrop-blur-[1px] transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
        ownerStyle.border,
        conquered && "animate-conquer",
        origin && "animate-pulseGlow",
        isSelected && "ring-4 ring-amber-300",
        showMovementOverlay && isDimmed && "brightness-50",
        overlayClass,
        cell.owner === "player" ? "hover:-translate-y-0.5" : "hover:scale-[0.99]"
      )}
      style={{
        backgroundImage: backgroundLayers,
        backgroundSize,
        backgroundPosition: "center",
        backgroundRepeat,
      }}
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

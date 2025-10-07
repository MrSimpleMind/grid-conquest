import { Cell } from "../types";

interface SelectedBattalionPanelProps {
  cell: Cell | null;
  selectedBattalionId: string | null;
  onSelectBattalion: (battalionId: string) => void;
}

export function SelectedBattalionPanel({
  cell,
  selectedBattalionId,
  onSelectBattalion,
}: SelectedBattalionPanelProps) {
  const battalions =
    cell?.owner === "player"
      ? cell.battalions.filter((unit) => unit.owner === "player")
      : [];

  return (
    <aside className="w-full max-w-xs shrink-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur">
      {battalions.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Unità selezionate
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Scegli quale battaglione controllare in questa cella.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {battalions.map((unit) => {
              const isSelected = unit.id === selectedBattalionId;
              const canMove = unit.movementLeft > 0;
              return (
                <li key={unit.id}>
                  <button
                    type="button"
                    onClick={() => onSelectBattalion(unit.id)}
                    className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      isSelected
                        ? "border-emerald-400/80 bg-emerald-400/10"
                        : "border-slate-700/80 bg-slate-900/80 hover:border-emerald-400/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold uppercase tracking-wide text-slate-100">
                        {unit.type}
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        {canMove ? "Pronto a muoversi" : "Movimento esaurito"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      Soldati: {unit.soldiers} · Att {unit.attack} · Dif {unit.defense}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Movimento: {unit.movementLeft}/{unit.maxMovement}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </aside>
  );
}

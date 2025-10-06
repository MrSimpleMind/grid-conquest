interface ControlsBarProps {
  gridSize: number;
  onChangeGrid: (size: number) => void;
  onNewGame: () => void;
  onEndTurn: () => void;
  canEndTurn: boolean;
}

const sizes = [6, 8, 10, 12];

export function ControlsBar({ gridSize, onChangeGrid, onNewGame, onEndTurn, canEndTurn }: ControlsBarProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-slate-900/70 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Grid Conquest</h1>
        <button
          onClick={onNewGame}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Nuova partita
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span>Dimensione griglia</span>
          <select
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            value={gridSize}
            onChange={(event) => onChangeGrid(Number(event.target.value))}
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}×{size}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={onEndTurn}
          disabled={!canEndTurn}
          className="rounded-full bg-sky-500 px-4 py-2 font-semibold text-sky-950 shadow transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          Termina turno
        </button>
      </div>
    </div>
  );
}

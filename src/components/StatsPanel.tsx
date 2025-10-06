import { GameStats, GameStatus, Owner, Player } from "../types";

interface StatsPanelProps {
  turnNumber: number;
  currentTurn: Player;
  stats: GameStats;
  majorityOwner: Owner;
  majorityStreak: number;
  status: GameStatus;
}

export function StatsPanel({
  turnNumber,
  currentTurn,
  stats,
  majorityOwner,
  majorityStreak,
  status,
}: StatsPanelProps) {
  const turnsRemaining = majorityOwner ? Math.max(0, 10 - majorityStreak) : null;
  const majorityLabel = majorityOwner === "player" ? "Comandante" : majorityOwner === "ai" ? "IA" : "";

  return (
    <section className="flex w-full flex-col gap-3 rounded-2xl bg-slate-900/70 p-4 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Turno {turnNumber}</h2>
        <p className="text-sm text-slate-300">
          {status === "playing" ? `In azione: ${currentTurn === "player" ? "Comandante" : "IA"}` : "Partita conclusa"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <StatBlock label="Basi (Comandante)" value={stats.bases.player} accent="text-player-light" />
        <StatBlock label="Basi (IA)" value={stats.bases.ai} accent="text-ai-light" />
        <StatBlock label="Risorse (Comandante)" value={stats.resources.player} accent="text-player-light" />
        <StatBlock label="Risorse (IA)" value={stats.resources.ai} accent="text-ai-light" />
      </div>
      {majorityOwner && status === "playing" && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 p-3 text-sm">
          <p>
            {majorityLabel} mantiene la maggioranza. Resistere per {turnsRemaining} turni per la vittoria.
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
              style={{ width: `${(majorityStreak / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

interface StatBlockProps {
  label: string;
  value: number;
  accent: string;
}

function StatBlock({ label, value, accent }: StatBlockProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-700/60 bg-slate-800/70 p-3 text-slate-200">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-2xl font-semibold ${accent}`}>{value}</span>
    </div>
  );
}

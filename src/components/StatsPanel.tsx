import { Cell, GameStats, GameStatus, Owner, Player } from "../types";

interface StatsPanelProps {
  turnNumber: number;
  currentTurn: Player;
  stats: GameStats;
  majorityOwner: Owner;
  majorityStreak: number;
  status: GameStatus;
  cells: Cell[];
}

export function StatsPanel({
  turnNumber,
  currentTurn,
  stats,
  majorityOwner,
  majorityStreak,
  status,
  cells,
}: StatsPanelProps) {
  const turnsRemaining = majorityOwner ? Math.max(0, 10 - majorityStreak) : null;
  const majorityLabel = majorityOwner === "player" ? "Comandante" : majorityOwner === "ai" ? "IA" : "";

  const playerSummary = summarizeSpecialization(cells, "player");
  const aiSummary = summarizeSpecialization(cells, "ai");

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
      <div className="grid gap-3 text-sm lg:grid-cols-2">
        <SpecializationSummary
          title="Forze speciali (Comandante)"
          summary={playerSummary}
          accent="from-player-light/30 to-player-dark/30"
        />
        <SpecializationSummary
          title="Forze speciali (IA)"
          summary={aiSummary}
          accent="from-ai-light/20 to-ai-dark/30"
        />
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

interface SpecializationData {
  elite: number;
  guardian: number;
  bases: Record<"barracks" | "forge" | "sanctuary", number>;
}

function summarizeSpecialization(cells: Cell[], owner: Player): SpecializationData {
  return cells
    .filter((cell) => cell.owner === owner)
    .reduce<SpecializationData>(
      (acc, cell) => {
        acc.elite += cell.specialUnits.elite;
        acc.guardian += cell.specialUnits.guardian;
        if (cell.type === "base" && cell.specialization) {
          acc.bases[cell.specialization] += 1;
        }
        return acc;
      },
      { elite: 0, guardian: 0, bases: { barracks: 0, forge: 0, sanctuary: 0 } }
    );
}

interface SpecializationSummaryProps {
  title: string;
  summary: SpecializationData;
  accent: string;
}

function SpecializationSummary({ title, summary, accent }: SpecializationSummaryProps) {
  const hasForces = summary.elite > 0 || summary.guardian > 0;
  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-slate-700/60 bg-gradient-to-br ${accent} p-3 text-xs text-slate-100`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap items-center gap-2">
        <Badge icon="⚔️" label="Elite" value={summary.elite} />
        <Badge icon="🛡️" label="Guardiani" value={summary.guardian} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-wide text-slate-200/80">
        <span className="rounded-full bg-slate-900/40 px-2 py-1">Caserme: {summary.bases.barracks}</span>
        <span className="rounded-full bg-slate-900/40 px-2 py-1">Forge: {summary.bases.forge}</span>
        <span className="rounded-full bg-slate-900/40 px-2 py-1">Santuari: {summary.bases.sanctuary}</span>
      </div>
      {!hasForces && <p className="text-[0.65rem] text-slate-200/70">Conquista una base neutrale per sbloccare unità speciali.</p>}
    </div>
  );
}

interface BadgeProps {
  icon: string;
  label: string;
  value: number;
}

function Badge({ icon, label, value }: BadgeProps) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-slate-900/50 px-2 py-1">
      <span>{icon}</span>
      <span className="uppercase tracking-wide text-[0.65rem]">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </span>
  );
}

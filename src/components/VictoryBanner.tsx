import { GameStatus } from "../types";

interface VictoryBannerProps {
  status: GameStatus;
  onNewGame: () => void;
}

const statusMessages: Record<GameStatus, string> = {
  playing: "",
  playerVictory: "Hai conquistato tutte le basi nemiche!",
  aiVictory: "Le forze IA hanno preso il controllo.",
  playerMajority: "Hai mantenuto la maggioranza per 10 turni!",
  aiMajority: "L'IA ha dominato la scacchiera per 10 turni.",
};

export function VictoryBanner({ status, onNewGame }: VictoryBannerProps) {
  if (status === "playing") {
    return null;
  }

  const isPlayerWin = status === "playerVictory" || status === "playerMajority";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/90 p-8 text-center shadow-2xl">
        <h2 className={isPlayerWin ? "text-3xl font-bold text-amber-300" : "text-3xl font-bold text-rose-300"}>
          {isPlayerWin ? "Vittoria" : "Sconfitta"}
        </h2>
        <p className="text-lg text-slate-200">{statusMessages[status]}</p>
        <button
          onClick={onNewGame}
          className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-emerald-950 shadow-lg hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Nuova partita
        </button>
      </div>
    </div>
  );
}

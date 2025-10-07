import { useMemo } from "react";
import { ControlsBar } from "./components/ControlsBar";
import { GameGrid } from "./components/GameGrid";
import { StatsPanel } from "./components/StatsPanel";
import { VictoryBanner } from "./components/VictoryBanner";
import { useGamePersistence } from "./hooks/useGamePersistence";
import { useGameStore } from "./state/gameStore";

export default function App() {
  const gridSize = useGameStore((state) => state.gridSize);
  const cells = useGameStore((state) => state.cells);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const stats = useGameStore((state) => state.stats);
  const turnNumber = useGameStore((state) => state.turnNumber);
  const majorityOwner = useGameStore((state) => state.majorityOwner);
  const majorityStreak = useGameStore((state) => state.majorityStreak);
  const status = useGameStore((state) => state.status);
  const lastAction = useGameStore((state) => state.lastAction);
  const selectedCellId = useGameStore((state) => state.selectedCellId);
  const isHydrated = useGameStore((state) => state.isHydrated);
  const actions = useGameStore((state) => state.actions);

  useGamePersistence();

  const boardMessage = useMemo(() => {
    if (!isHydrated) {
      return "Caricamento salvataggio...";
    }
    if (status === "playing") {
      return currentTurn === "player" ? "È il tuo turno." : "L'IA sta pianificando.";
    }
    return "Partita terminata.";
  }, [currentTurn, isHydrated, status]);

  const handleCellClick = (cellId: string) => {
    if (status !== "playing" || currentTurn !== "player") {
      return;
    }

    if (selectedCellId && selectedCellId !== cellId) {
      actions.moveTo(cellId);
      return;
    }

    actions.selectCell(cellId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 sm:py-10">
        <ControlsBar
          gridSize={gridSize}
          onChangeGrid={actions.setGridSize}
          onNewGame={() => actions.newGame()}
          onEndTurn={actions.endTurn}
          canEndTurn={status === "playing" && currentTurn === "player" && isHydrated}
        />

        <StatsPanel
          turnNumber={turnNumber}
          currentTurn={currentTurn}
          stats={stats}
          majorityOwner={majorityOwner}
          majorityStreak={majorityStreak}
          status={status}
          cells={cells}
        />

        <section className="flex flex-1 flex-col items-center gap-4 pb-10">
          <p className="text-sm text-slate-300">{boardMessage}</p>
          <div className="w-full overflow-auto">
            <div className="mx-auto min-w-[18rem] max-w-max">
              <GameGrid
                cells={cells}
                gridSize={gridSize}
                selectedCellId={selectedCellId}
                lastAction={lastAction}
                onCellClick={(cell) => handleCellClick(cell.id)}
              />
            </div>
          </div>
        </section>
      </main>
      <VictoryBanner status={status} onNewGame={() => actions.newGame()} />
    </div>
  );
}

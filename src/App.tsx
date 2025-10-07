import { useMemo } from "react";
import type { Battalion, Cell } from "./types";
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
  const selectedBattalionId = useGameStore((state) => state.selectedBattalionId);
  const isHydrated = useGameStore((state) => state.isHydrated);
  const actions = useGameStore((state) => state.actions);
  const resourcePool = useGameStore((state) => state.resources);

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

  const handleUnitPrompt = (options: Battalion[]): Battalion | null => {
    if (options.length === 0) {
      return null;
    }
    const choice = window.prompt(
      [
        "Scegli l'unità da addestrare:",
        ...options.map(
          (unit, index) =>
            `${index + 1}) ${unit.type.toUpperCase()} - Soldati: ${unit.soldiers}, Attacco: ${unit.attack}, Difesa: ${unit.defense}`
        ),
      ].join("\n")
    );
    if (!choice) {
      return null;
    }
    const index = Number.parseInt(choice, 10) - 1;
    if (Number.isNaN(index) || index < 0 || index >= options.length) {
      return null;
    }
    return options[index];
  };

  const handleCellClick = (cell: Cell) => {
    if (status !== "playing" || currentTurn !== "player") {
      return;
    }

    if (selectedCellId && selectedCellId !== cell.id) {
      actions.moveTo(cell.id);
      return;
    }

    if (selectedCellId === cell.id) {
      if (cell.type === "base" && cell.owner === "player") {
        actions.produceAt(cell.id, handleUnitPrompt);
      }
      return;
    }

    actions.selectCell(cell.id);
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
          resources={resourcePool}
        />

        <section className="flex flex-1 flex-col items-center gap-4 pb-10">
          <p className="text-sm text-slate-300">{boardMessage}</p>
          <div className="w-full overflow-auto">
            <div className="mx-auto min-w-[18rem] max-w-max">
              <GameGrid
                cells={cells}
                gridSize={gridSize}
                selectedCellId={selectedCellId}
                selectedBattalionId={selectedBattalionId}
                lastAction={lastAction}
                onCellClick={handleCellClick}
              />
            </div>
          </div>
        </section>
      </main>
      <VictoryBanner status={status} onNewGame={() => actions.newGame()} />
    </div>
  );
}

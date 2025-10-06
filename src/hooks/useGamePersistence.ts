import { useEffect } from "react";
import { loadGameState, saveGameState } from "../db/gameStorage";
import { useGameStore } from "../state/gameStore";
import { GameSnapshot } from "../types";

export function useGamePersistence() {
  const hydrate = useGameStore((state) => state.actions.hydrate);

  useEffect(() => {
    loadGameState().then((snapshot) => {
      hydrate(snapshot);
    });
  }, [hydrate]);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      if (!state.isHydrated) {
        return;
      }
      const snapshot: GameSnapshot = {
        gridSize: state.gridSize,
        cells: state.cells,
        currentTurn: state.currentTurn,
        turnNumber: state.turnNumber,
        majorityOwner: state.majorityOwner,
        majorityStreak: state.majorityStreak,
        status: state.status,
        lastAction: state.lastAction,
      };
      saveGameState(snapshot);
    });

    return unsubscribe;
  }, []);
}

import Dexie, { Table } from "dexie";
import { GameSnapshot } from "../types";

interface GameSave {
  id: number;
  state: GameSnapshot;
  updatedAt: Date;
}

class GameDatabase extends Dexie {
  public games!: Table<GameSave, number>;

  constructor() {
    super("GridConquestDB");
    this.version(1).stores({
      games: "id, updatedAt",
    });
  }
}

const db = new GameDatabase();

export async function saveGameState(state: GameSnapshot) {
  await db.games.put({ id: 1, state, updatedAt: new Date() });
}

export async function loadGameState(): Promise<GameSnapshot | undefined> {
  const record = await db.games.get(1);
  return record?.state;
}

export async function clearGameState() {
  await db.games.delete(1);
}

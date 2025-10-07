export type Player = "player" | "ai";
export type Owner = Player | null;
export type CellType = "neutral" | "base" | "resource";

export type BaseSpecialization = "barracks" | "forge" | "sanctuary" | null;

export interface SpecialUnitCounts {
  elite: number;
  guardian: number;
}

export interface Cell {
  id: string;
  x: number;
  y: number;
  type: CellType;
  owner: Owner;
  units: number;
  specialization: BaseSpecialization;
  specialUnits: SpecialUnitCounts;
}

export interface GameStats {
  resources: Record<Player, number>;
  bases: Record<Player, number>;
}

export interface LastAction {
  fromId: string;
  toId: string;
  conqueredOwner: Owner;
  timestamp: number;
}

export interface GameSnapshot {
  gridSize: number;
  cells: Cell[];
  currentTurn: Player;
  turnNumber: number;
  majorityOwner: Owner;
  majorityStreak: number;
  status: GameStatus;
  lastAction?: LastAction;
}

export type GameStatus =
  | "playing"
  | "playerVictory"
  | "aiVictory"
  | "playerMajority"
  | "aiMajority";

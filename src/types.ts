export type Player = "player" | "ai";
export type Owner = Player | null;
export type CellType = "neutral" | "base" | "resource";

export type BaseSpecialization = "barracks" | "forge" | "sanctuary" | null;

export type UnitType = "infantry" | "vanguard" | "guardian" | "artillery";

export interface Battalion {
  id: string;
  owner: Player;
  type: UnitType;
  soldiers: number;
  attack: number;
  defense: number;
  maxMovement: number;
  movementLeft: number;
}

export interface Cell {
  id: string;
  x: number;
  y: number;
  type: CellType;
  owner: Owner;
  specialization: BaseSpecialization;
  battalions: Battalion[];
  resourceClaimedBy: Partial<Record<Player, boolean>>;
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
  fortune: number;
  resourceReward?: number;
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
  resources: Record<Player, number>;
}

export type GameStatus =
  | "playing"
  | "playerVictory"
  | "aiVictory"
  | "playerMajority"
  | "aiMajority";

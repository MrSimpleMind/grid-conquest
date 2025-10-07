import { Battalion, Player, UnitType } from "../types";

interface UnitBlueprint {
  type: UnitType;
  name: string;
  cost: number;
  soldiers: number;
  attack: number;
  defense: number;
  movement: number;
  unlockedBy?: "barracks" | "forge" | "sanctuary";
}

export const UNIT_BLUEPRINTS: Record<UnitType, UnitBlueprint> = {
  infantry: {
    type: "infantry",
    name: "Battaglione di fanteria",
    cost: 1,
    soldiers: 10,
    attack: 8,
    defense: 7,
    movement: 3,
  },
  vanguard: {
    type: "vanguard",
    name: "Avanguardia d'assalto",
    cost: 2,
    soldiers: 12,
    attack: 12,
    defense: 8,
    movement: 3,
    unlockedBy: "barracks",
  },
  guardian: {
    type: "guardian",
    name: "Guardiani del santuario",
    cost: 2,
    soldiers: 10,
    attack: 7,
    defense: 12,
    movement: 2,
    unlockedBy: "sanctuary",
  },
  artillery: {
    type: "artillery",
    name: "Batteria d'artiglieria",
    cost: 3,
    soldiers: 8,
    attack: 15,
    defense: 6,
    movement: 2,
    unlockedBy: "forge",
  },
};

let battalionId = 0;

export function createBattalion({
  owner,
  type,
  initialMovement,
}: {
  owner: Player;
  type: UnitType;
  initialMovement?: number;
}): Battalion {
  const blueprint = UNIT_BLUEPRINTS[type];
  battalionId += 1;
  return {
    id: `${type}-${battalionId}`,
    owner,
    type,
    soldiers: blueprint.soldiers,
    attack: blueprint.attack,
    defense: blueprint.defense,
    maxMovement: blueprint.movement,
    movementLeft: initialMovement ?? blueprint.movement,
  };
}

export function getAvailableBlueprints(
  controlledSpecializations: Set<UnitBlueprint["unlockedBy"]>
): UnitBlueprint[] {
  return Object.values(UNIT_BLUEPRINTS).filter((blueprint) => {
    if (!blueprint.unlockedBy) {
      return true;
    }
    return controlledSpecializations.has(blueprint.unlockedBy);
  });
}

import { BaseSpecialization, Battalion, Cell } from "../types";
import { createBattalion } from "./units";

const NEUTRAL_SPECIALIZATIONS: BaseSpecialization[] = [
  "barracks",
  "forge",
  "sanctuary",
];

export interface MapOptions {
  size: number;
  neutralBaseChance?: number;
  resourceChance?: number;
}

const DEFAULT_NEUTRAL_BASE_CHANCE = 0.08;
const DEFAULT_RESOURCE_CHANCE = 0.2;

export function generateMap({
  size,
  neutralBaseChance = DEFAULT_NEUTRAL_BASE_CHANCE,
  resourceChance = DEFAULT_RESOURCE_CHANCE,
}: MapOptions): Cell[] {
  const cells: Cell[] = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const id = `${x}-${y}`;
      let owner: Cell["owner"] = null;
      let type: Cell["type"] = "neutral";
      let specialization: BaseSpecialization = null;
      const battalions: Battalion[] = [];
      const resourceClaimedBy: Cell["resourceClaimedBy"] = {};

      const isPlayerBase = x === 0 && y === 0;
      const isAiBase = x === size - 1 && y === size - 1;

      if (isPlayerBase || isAiBase) {
        type = "base";
        owner = isPlayerBase ? "player" : "ai";
        specialization = null;
        battalions.push(
          createBattalion({
            owner: owner!,
            type: "infantry",
          })
        );
      } else {
        const roll = Math.random();
        if (roll < neutralBaseChance) {
          type = "base";
          owner = null;
          specialization =
            NEUTRAL_SPECIALIZATIONS[
              Math.floor(Math.random() * NEUTRAL_SPECIALIZATIONS.length)
            ];
        } else if (roll < neutralBaseChance + resourceChance) {
          type = "resource";
        }
      }

      cells.push({
        id,
        x,
        y,
        type,
        owner,
        specialization: type === "base" ? specialization : null,
        battalions,
        resourceClaimedBy,
      });
    }
  }

  return cells;
}

import { BaseSpecialization, Cell, LastAction, Owner, Player } from "../types";
import {
  findMovementPath,
  getCell,
  getCellIndex,
} from "./utils";

const ELITE_ATTACK_MODIFIER = 1.5;
const ELITE_DEFENSE_MODIFIER = 1.2;
const GUARDIAN_ATTACK_MODIFIER = 1.1;
const GUARDIAN_DEFENSE_MODIFIER = 1.6;
const FORGE_ATTACK_BONUS = 1.25;
const SANCTUARY_DEFENSE_BONUS = 1.25;

interface UnitDistribution {
  regular: number;
  elite: number;
  guardian: number;
}

function cloneCell(cell: Cell): Cell {
  return {
    ...cell,
    specialUnits: {
      elite: cell.specialUnits?.elite ?? 0,
      guardian: cell.specialUnits?.guardian ?? 0,
    },
  };
}

function normalizeSpecialUnits(cell: Cell) {
  if (cell.specialUnits.elite < 0) {
    cell.specialUnits.elite = 0;
  }
  if (cell.specialUnits.guardian < 0) {
    cell.specialUnits.guardian = 0;
  }
  const maxElite = Math.min(cell.specialUnits.elite, cell.units);
  cell.specialUnits.elite = maxElite;
  const remaining = Math.max(cell.units - cell.specialUnits.elite, 0);
  cell.specialUnits.guardian = Math.min(cell.specialUnits.guardian, remaining);
}

function distributeUnits(cell: Cell, amount: number): UnitDistribution {
  if (amount <= 0 || cell.units === 0) {
    return { regular: 0, elite: 0, guardian: 0 };
  }

  const eliteAvailable = cell.specialUnits.elite;
  const guardianAvailable = cell.specialUnits.guardian;
  const regularAvailable = Math.max(cell.units - eliteAvailable - guardianAvailable, 0);
  const total = cell.units;

  let elite = Math.min(
    eliteAvailable,
    Math.round((eliteAvailable / total) * amount)
  );
  let guardian = Math.min(
    guardianAvailable,
    Math.round((guardianAvailable / total) * amount)
  );

  let regular = amount - elite - guardian;

  if (regular < 0) {
    const deficit = -regular;
    if (guardian > deficit) {
      guardian -= deficit;
      regular = 0;
    } else {
      const remainingDeficit = deficit - guardian;
      guardian = 0;
      elite = Math.max(elite - remainingDeficit, 0);
      regular = 0;
    }
  }

  regular = Math.min(regular, regularAvailable);

  let assigned = elite + guardian + regular;
  if (assigned < amount) {
    const extra = Math.min(amount - assigned, regularAvailable - regular);
    regular += extra;
    assigned = elite + guardian + regular;
  }

  if (assigned < amount) {
    const remainingNeeded = amount - assigned;
    const eliteRoom = eliteAvailable - elite;
    const eliteTake = Math.min(remainingNeeded, eliteRoom);
    elite += eliteTake;
    assigned += eliteTake;
  }

  if (assigned < amount) {
    const remainingNeeded = amount - assigned;
    const guardianRoom = guardianAvailable - guardian;
    const guardianTake = Math.min(remainingNeeded, guardianRoom);
    guardian += guardianTake;
    assigned += guardianTake;
  }

  regular = Math.max(amount - elite - guardian, 0);

  return { regular, elite, guardian };
}

function calculateAttackPower(
  distribution: UnitDistribution,
  specialization: BaseSpecialization
): number {
  const basePower =
    distribution.regular +
    distribution.elite * ELITE_ATTACK_MODIFIER +
    distribution.guardian * GUARDIAN_ATTACK_MODIFIER;

  if (distribution.regular + distribution.elite + distribution.guardian === 0) {
    return 0;
  }

  if (specialization === "forge") {
    return basePower * FORGE_ATTACK_BONUS;
  }

  if (specialization === "barracks") {
    return basePower * 1.05;
  }

  return basePower;
}

function calculateDefensePower(defender: Cell): number {
  const distribution = defender.specialUnits;
  let power =
    (defender.units - distribution.elite - distribution.guardian) +
    distribution.elite * ELITE_DEFENSE_MODIFIER +
    distribution.guardian * GUARDIAN_DEFENSE_MODIFIER;

  if (
    defender.type === "base" &&
    defender.owner &&
    defender.specialization === "sanctuary"
  ) {
    power *= SANCTUARY_DEFENSE_BONUS;
  }

  return power;
}

function resolveCombat(
  attacker: Cell,
  defender: Cell,
  player: Player,
  deployed: number,
  distribution: UnitDistribution
): Owner {
  attacker.units -= deployed;
  attacker.specialUnits.elite -= distribution.elite;
  attacker.specialUnits.guardian -= distribution.guardian;
  normalizeSpecialUnits(attacker);

  if (defender.owner === player) {
    defender.units += deployed;
    defender.specialUnits.elite += distribution.elite;
    defender.specialUnits.guardian += distribution.guardian;
    normalizeSpecialUnits(defender);
    return defender.owner;
  }

  const attackPower = calculateAttackPower(distribution, attacker.specialization);
  const defensePower = calculateDefensePower(defender);

  if (attackPower > defensePower) {
    const casualtyRatio = defensePower / attackPower;
    const survivorsCount = Math.max(
      1,
      Math.round(deployed * (1 - casualtyRatio))
    );
    const ratio = survivorsCount / deployed;
    let eliteSurvivors = Math.min(
      distribution.elite,
      Math.round(distribution.elite * ratio)
    );
    let guardianSurvivors = Math.min(
      distribution.guardian,
      Math.round(distribution.guardian * ratio)
    );
    let regularSurvivors = survivorsCount - eliteSurvivors - guardianSurvivors;

    if (regularSurvivors < 0) {
      const deficit = -regularSurvivors;
      if (guardianSurvivors >= deficit) {
        guardianSurvivors -= deficit;
      } else {
        const remainingDeficit = deficit - guardianSurvivors;
        guardianSurvivors = 0;
        eliteSurvivors = Math.max(eliteSurvivors - remainingDeficit, 0);
      }
      regularSurvivors = 0;
    }

    defender.owner = player;
    defender.units = survivorsCount;
    defender.specialUnits = {
      elite: eliteSurvivors,
      guardian: guardianSurvivors,
    };
    normalizeSpecialUnits(defender);
    return player;
  }

  const inflicted = Math.min(defender.units, Math.round(attackPower));
  if (inflicted > 0) {
    const totalDefenderUnits = defender.units || 1;
    const eliteLosses = Math.min(
      defender.specialUnits.elite,
      Math.round((defender.specialUnits.elite / totalDefenderUnits) * inflicted)
    );
    const guardianLosses = Math.min(
      defender.specialUnits.guardian,
      Math.round(
        (defender.specialUnits.guardian / totalDefenderUnits) * inflicted
      )
    );
    let regularLosses = inflicted - eliteLosses - guardianLosses;
    if (regularLosses < 0) {
      regularLosses = 0;
    }

    defender.units = Math.max(0, defender.units - inflicted);
    defender.specialUnits.elite = Math.max(
      0,
      defender.specialUnits.elite - eliteLosses
    );
    defender.specialUnits.guardian = Math.max(
      0,
      defender.specialUnits.guardian - guardianLosses
    );

    if (defender.units === 0) {
      defender.owner = null;
      defender.specialUnits.elite = 0;
      defender.specialUnits.guardian = 0;
    }
  }

  return defender.owner ?? null;
}

export function performMove(
  cells: Cell[],
  fromId: string,
  toId: string,
  player: Player
): { cells: Cell[]; lastAction: LastAction | undefined } {
  const fromCell = getCell(cells, fromId);
  const toCell = getCell(cells, toId);

  if (!fromCell || !toCell) {
    return { cells, lastAction: undefined };
  }

  if (fromCell.owner !== player || fromCell.units < 2) {
    return { cells, lastAction: undefined };
  }

  const path = findMovementPath(cells, fromCell, toCell, player, 3);
  if (!path) {
    return { cells, lastAction: undefined };
  }

  const updated = cells.map((cell) => cloneCell(cell));
  const fromIndex = getCellIndex(updated, fromId);
  const toIndex = getCellIndex(updated, toId);
  const attacker = updated[fromIndex];
  const defender = updated[toIndex];

  const deployed = Math.max(1, Math.floor(attacker.units / 2));
  const distribution = distributeUnits(attacker, deployed);

  const conqueredOwner = resolveCombat(
    attacker,
    defender,
    player,
    deployed,
    distribution
  );

  return {
    cells: updated,
    lastAction: {
      fromId,
      toId,
      conqueredOwner,
      timestamp: Date.now(),
    },
  };
}

export function previewAttackPower(cell: Cell): number {
  if (cell.units < 2) {
    return 0;
  }
  const deployed = Math.max(1, Math.floor(cell.units / 2));
  const distribution = distributeUnits(cell, deployed);
  return calculateAttackPower(distribution, cell.specialization);
}

export function previewDefensePower(cell: Cell): number {
  return calculateDefensePower(cell);
}

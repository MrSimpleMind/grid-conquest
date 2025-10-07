import { Battalion, Cell, LastAction, Owner, Player } from "../types";
import { findBattalionPath } from "./utils";

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({
    ...cell,
    battalions: cell.battalions.map((unit) => ({ ...unit })),
    resourceClaimedBy: { ...cell.resourceClaimedBy },
  }));
}

function removeBattalion(cell: Cell, battalionId: string): Battalion | null {
  const index = cell.battalions.findIndex((unit) => unit.id === battalionId);
  if (index === -1) {
    return null;
  }
  const [battalion] = cell.battalions.splice(index, 1);
  return battalion;
}

function applyFortune(): number {
  const deviation = 0.1;
  const roll = Math.random() * deviation * 2 - deviation;
  return 1 + roll;
}

function calculatePower(units: Battalion[], mode: "attack" | "defense"): number {
  return units.reduce((total, unit) => {
    const stat = mode === "attack" ? unit.attack : unit.defense;
    return total + stat * unit.soldiers;
  }, 0);
}

function cleanupOwner(cell: Cell) {
  if (cell.battalions.length === 0) {
    cell.owner = null;
  } else {
    cell.owner = cell.battalions[0].owner;
  }
}

export function performMove(
  cells: Cell[],
  fromId: string,
  toId: string,
  player: Player,
  battalionId: string
): { cells: Cell[]; lastAction: LastAction | undefined } {
  const updated = cloneCells(cells);
  const fromCell = updated.find((cell) => cell.id === fromId);
  const toCell = updated.find((cell) => cell.id === toId);

  if (!fromCell || !toCell) {
    return { cells, lastAction: undefined };
  }

  const battalion = removeBattalion(fromCell, battalionId);
  if (!battalion || battalion.owner !== player || battalion.movementLeft <= 0) {
    return { cells, lastAction: undefined };
  }

  const path = findBattalionPath(cells, fromCell, toCell, battalion);
  if (!path) {
    fromCell.battalions.push(battalion);
    cleanupOwner(fromCell);
    return { cells, lastAction: undefined };
  }

  const conqueredOwner: Owner = toCell.owner;

  if (toCell.owner === player) {
    battalion.movementLeft = Math.max(0, battalion.movementLeft - path.cost);
    toCell.battalions.push(battalion);
    cleanupOwner(fromCell);
    cleanupOwner(toCell);
    return {
      cells: updated,
      lastAction: {
        fromId,
        toId,
        conqueredOwner: toCell.owner,
        timestamp: Date.now(),
        fortune: 1,
      },
    };
  }

  const defenders = [...toCell.battalions];
  const attackers = [battalion];
  let resourceReward = 0;

  if (defenders.length === 0) {
    battalion.movementLeft = 0;
    toCell.owner = player;
    toCell.battalions = [battalion];
    if (toCell.type === "resource" && !toCell.resourceClaimedBy[player]) {
      resourceReward = Math.floor(Math.random() * 3) + 1;
      toCell.resourceClaimedBy[player] = true;
    }
    cleanupOwner(fromCell);
    const fortune = applyFortune();
    return {
      cells: updated,
      lastAction: {
        fromId,
        toId,
        conqueredOwner,
        timestamp: Date.now(),
        fortune,
        resourceReward: resourceReward || undefined,
      },
    };
  }

  const fortuneAttack = applyFortune();
  const fortuneDefense = applyFortune();

  const attackPower = calculatePower(attackers, "attack") * fortuneAttack;
  const defensePower = calculatePower(defenders, "defense") * fortuneDefense;

  let winner: Player | null = null;

  if (attackPower > defensePower) {
    winner = player;
  } else {
    winner = defenders[0]?.owner ?? null;
  }

  if (winner === player) {
    const casualtyRatio = Math.min(1, defensePower / (attackPower || 1));
    const survivors = Math.max(1, Math.round(battalion.soldiers * (1 - casualtyRatio)));
    battalion.soldiers = survivors;
    battalion.movementLeft = 0;
    toCell.owner = player;
    toCell.battalions = [battalion];
    if (toCell.type === "resource" && !toCell.resourceClaimedBy[player]) {
      resourceReward = Math.floor(Math.random() * 3) + 1;
      toCell.resourceClaimedBy[player] = true;
    }
  } else {
    const casualtyRatio = Math.min(1, attackPower / (defensePower || 1));
    defenders.forEach((defender) => {
      defender.soldiers = Math.max(1, Math.round(defender.soldiers * (1 - casualtyRatio / defenders.length)));
      defender.movementLeft = defender.maxMovement;
    });
    toCell.battalions = defenders;
    fromCell.battalions.push(battalion);
    cleanupOwner(fromCell);
  }

  cleanupOwner(toCell);

  return {
    cells: updated,
    lastAction: {
      fromId,
      toId,
      conqueredOwner,
      timestamp: Date.now(),
      fortune: attackPower > defensePower ? fortuneAttack : fortuneDefense,
      resourceReward: resourceReward || undefined,
    },
  };
}

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;

export const SPRITES = {
  // Linha 0 (y = 0)
  playerStraight: { x: 0, y: 0, w: 64, h: 64 },
  playerLeft: { x: 64, y: 0, w: 64, h: 64 },
  playerRight: { x: 128, y: 0, w: 64, h: 64 },
  bullet: { x: 192, y: 0, w: 64, h: 64 },

  // Linha 1 (y = 64)
  enemyJet: { x: 0, y: 64, w: 64, h: 64 },
  enemyHeli: { x: 64, y: 64, w: 64, h: 64 },
  enemyShip: { x: 128, y: 64, w: 64, h: 64 },
  enemyTank: { x: 192, y: 64, w: 64, h: 64 },

  // Linha 2 (y = 128)
  fuel: { x: 0, y: 128, w: 64, h: 64 },
  road: { x: 64, y: 128, w: 64, h: 64 },
  bridge1: { x: 128, y: 128, w: 64, h: 64 },
  bridge2: { x: 192, y: 128, w: 64, h: 64 },

  // Linha 3 (y = 192)
  explosion1: { x: 0, y: 192, w: 64, h: 64 },
  explosion2: { x: 64, y: 192, w: 64, h: 64 },
  explosion3: { x: 128, y: 192, w: 64, h: 64 },
  explosion4: { x: 192, y: 192, w: 64, h: 64 },
};

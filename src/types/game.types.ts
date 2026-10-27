export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'jet' | 'heli' | 'fuel';
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  timer: number;
}

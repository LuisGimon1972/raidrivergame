<template>
  <q-page class="flex flex-center text-white q-pa-md bg-dark">
    <div class="column items-center">
      <!-- Cabeçalho com Botões nos Extremos e Título no Centro -->
      <div class="row items-center justify-between" :style="{ width: CANVAS_WIDTH + 'px' }">
        <q-btn
          style="width: 80px"
          color="amber-8"
          icon="refresh"
          label="Reiniciar"
          size="sm"
          dense
          unelevated
          @click="resetGame"
        />
        <div class="text-h6 text-amber-5 text-weight-bold">River Raid Game</div>
        <q-btn
          style="width: 80px"
          color="negative"
          icon="logout"
          label="Sair"
          size="sm"
          dense
          unelevated
          @click="exitGame"
        />
      </div>

      <!-- HUD / Placar colado ao título -->
      <div class="row q-gutter-md text-subtitle2" style="margin-top: -2px">
        <div class="text-amber-3">
          Combustível: <b>{{ Math.ceil(player.fuel) }}%</b>
        </div>
        <div class="text-red-4">
          Vidas: <b>{{ lives }}</b>
        </div>
        <div class="text-green-4">
          Pontuação: <b>{{ score }}</b>
        </div>
      </div>

      <!-- Canvas do Jogo -->
      <canvas
        ref="gameCanvas"
        :width="CANVAS_WIDTH"
        :height="GAME_HEIGHT"
        class="game-canvas shadow-10 q-mt-sm"
      ></canvas>

      <div class="text-caption text-grey-4 text-center q-mt-xs">
        <b>W / A / S / D</b> ou <b>Setas</b> para mover | <b>Espaço</b> para disparar
      </div>
    </div>

    <!-- Diálogo de Game Over -->
    <q-dialog v-model="isGameOver" persistent>
      <q-card
        class="bg-dark text-white q-pa-md border-amber"
        style="min-width: 320px; border: 2px solid rgba(212, 175, 55, 0.6); border-radius: 12px"
      >
        <q-card-section class="text-h6 text-amber-5 text-weight-bold text-center">
          {{ gameOverTitle }}
        </q-card-section>

        <q-card-section
          class="text-subtitle2 text-center"
          v-html="gameOverMessage"
        ></q-card-section>

        <q-card-actions align="center" class="q-mt-md">
          <q-btn
            color="amber-8"
            icon="refresh"
            label="Jogar Novamente"
            unelevated
            @click="resetGame"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SPRITES } from '../game/constantes';
import { Bullet, Enemy, Explosion } from '../types/game.types';
import atlasSrc from '../assets/imagesraid.png';

const atlasImage = new Image();
atlasImage.src = atlasSrc;

const router = useRouter();
const gameCanvas = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
const score = ref(0);
const lives = ref(3);
const isGameOver = ref(false);

const gameOverTitle = ref('Game Over');
const gameOverMessage = ref('');

// Altura reduzida em 10% mantendo a proporção
const GAME_HEIGHT = Math.round(CANVAS_HEIGHT * 0.9);

// Controlo de teclas reativo e fiável
const keys = reactive<{ [key: string]: boolean }>({});

// Gerador equilibrado de tipos (Jatos e Helicópteros são mais comuns, Combustível é raro)
const getRandomEnemyType = (): 'jet' | 'heli' | 'fuel' => {
  const rand = Math.random();
  if (rand < 0.45) return 'jet';
  if (rand < 0.85) return 'heli';
  return 'fuel'; // Apenas 15% de chance
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (isGameOver.value) return;

  if (
    [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Space',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
    ].includes(e.code)
  ) {
    e.preventDefault();
  }

  keys[e.code] = true;

  // Disparo com a Barra de Espaço
  if (e.code === 'Space') {
    bullets.value.push({
      x: player.value.x + player.value.width / 2 - 4,
      y: player.value.y,
      width: 8,
      height: 16,
      speed: 8,
    });
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  keys[e.code] = false;
};

const handleBlur = () => {
  Object.keys(keys).forEach((k) => {
    keys[k] = false;
  });
};

const player = ref({
  x: 180,
  y: GAME_HEIGHT - 80,
  width: 40,
  height: 40,
  speed: 6.5,
  fuel: 100,
  invulnerableTimer: 0,
});

const bullets = ref<Bullet[]>([]);

// Inimigos iniciais equilibrados
const enemies = ref<Enemy[]>([
  { x: 80, y: -50, width: 40, height: 40, speed: 3.5, type: 'jet' },
  { x: 200, y: -180, width: 40, height: 40, speed: 3.0, type: 'fuel' },
  { x: 300, y: -320, width: 40, height: 40, speed: 4.0, type: 'heli' },
  { x: 140, y: -480, width: 40, height: 40, speed: 3.8, type: 'jet' },
  { x: 250, y: -620, width: 40, height: 40, speed: 3.2, type: 'heli' },
]);

const explosions = ref<Explosion[]>([]);

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);
  animationFrameId = requestAnimationFrame(gameLoop);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', handleBlur);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

const update = () => {
  if (isGameOver.value) return;

  if (player.value.invulnerableTimer > 0) {
    player.value.invulnerableTimer--;
  }

  // Movimentação horizontal (Esquerda / Direita)
  if (keys['ArrowLeft'] || keys['KeyA']) player.value.x -= player.value.speed;
  if (keys['ArrowRight'] || keys['KeyD']) player.value.x += player.value.speed;

  // Movimentação vertical (Frente / Trás - Cima / Baixo)
  if (keys['ArrowUp'] || keys['KeyW']) player.value.y -= player.value.speed;
  if (keys['ArrowDown'] || keys['KeyS']) player.value.y += player.value.speed;

  // Limites verticais do ecrã (topo e fundo)
  if (player.value.y < 50) player.value.y = 50;
  if (player.value.y > GAME_HEIGHT - player.value.height - 20) {
    player.value.y = GAME_HEIGHT - player.value.height - 20;
  }

  // Colisão com as margens laterais do rio (Explode se tocar nas margens verdes)
  if (
    player.value.invulnerableTimer === 0 &&
    (player.value.x < 20 || player.value.x > CANVAS_WIDTH - player.value.width - 20)
  ) {
    explosions.value.push({ x: player.value.x, y: player.value.y, frame: 0, timer: 0 });
    handlePlayerCrash();
  }

  // Combustível decrescente
  player.value.fuel -= 0.035;
  if (player.value.fuel <= 0) {
    showGameOverModal('Game Over', 'O seu combustível esgotou-se!');
    return;
  }

  // Atualizar Tiros
  bullets.value.forEach((b, index) => {
    b.y -= b.speed;
    if (b.y < 0) bullets.value.splice(index, 1);
  });

  // Atualizar Inimigos e Combustível
  enemies.value.forEach((en, index) => {
    en.y += en.speed;
    if (en.y > GAME_HEIGHT) {
      en.y = -80;
      en.x = Math.random() * (CANVAS_WIDTH - 80) + 30;
      en.type = getRandomEnemyType(); // Recicla com novo tipo aleatório equilibrado
    }

    // Recolher Combustível
    if (
      en.type === 'fuel' &&
      player.value.x < en.x + en.width &&
      player.value.x + player.value.width > en.x &&
      player.value.y < en.y + en.height &&
      player.value.y + player.value.height > en.y
    ) {
      player.value.fuel = Math.min(100, player.value.fuel + 35);
      en.y = -80;
      en.x = Math.random() * (CANVAS_WIDTH - 80) + 30;
      en.type = getRandomEnemyType(); // Deixa de ser combustível após recolhido
      score.value += 50;
    }

    // Colisão: Jogador vs Inimigo
    if (
      en.type !== 'fuel' &&
      player.value.invulnerableTimer === 0 &&
      player.value.x < en.x + en.width &&
      player.value.x + player.value.width > en.x &&
      player.value.y < en.y + en.height &&
      player.value.y + player.value.height > en.y
    ) {
      explosions.value.push({ x: player.value.x, y: player.value.y, frame: 0, timer: 0 });

      enemies.value.splice(index, 1);
      enemies.value.push({
        x: Math.random() * (CANVAS_WIDTH - 80) + 30,
        y: -80,
        width: 40,
        height: 40,
        speed: 3.5 + Math.random() * 1.5,
        type: getRandomEnemyType(),
      });

      handlePlayerCrash();
    }

    // Colisão: Tiro vs Inimigo
    bullets.value.forEach((b, bIndex) => {
      if (
        b.x < en.x + en.width &&
        b.x + b.width > en.x &&
        b.y < en.y + en.height &&
        b.y + b.height > en.y
      ) {
        explosions.value.push({ x: en.x, y: en.y, frame: 0, timer: 0 });
        enemies.value.splice(index, 1);
        bullets.value.splice(bIndex, 1);
        score.value += en.type === 'fuel' ? 100 : 200;

        enemies.value.push({
          x: Math.random() * (CANVAS_WIDTH - 80) + 30,
          y: -80,
          width: 40,
          height: 40,
          speed: 3.5 + Math.random() * 1.5,
          type: getRandomEnemyType(),
        });
      }
    });
  });

  // Atualizar Animações de Explosão
  explosions.value.forEach((ex, index) => {
    ex.timer++;
    if (ex.timer > 4) {
      ex.frame++;
      ex.timer = 0;
      if (ex.frame >= 4) {
        explosions.value.splice(index, 1);
      }
    }
  });
};

const handlePlayerCrash = () => {
  lives.value--;
  if (lives.value <= 0) {
    showGameOverModal('Game Over', 'O seu avião foi destruído e esgotou as vidas!');
  } else {
    player.value.x = 180;
    player.value.y = GAME_HEIGHT - 80;
    player.value.invulnerableTimer = 60;
  }
};

const resetGame = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  isGameOver.value = false;
  lives.value = 3;
  score.value = 0;
  player.value.fuel = 100;
  player.value.x = 180;
  player.value.y = GAME_HEIGHT - 80;
  player.value.invulnerableTimer = 0;
  bullets.value = [];
  explosions.value = [];

  Object.keys(keys).forEach((k) => {
    keys[k] = false;
  });

  enemies.value = [
    { x: 80, y: -50, width: 40, height: 40, speed: 3.5, type: 'jet' },
    { x: 200, y: -180, width: 40, height: 40, speed: 3.0, type: 'fuel' },
    { x: 300, y: -320, width: 40, height: 40, speed: 4.0, type: 'heli' },
    { x: 140, y: -480, width: 40, height: 40, speed: 3.8, type: 'jet' },
    { x: 250, y: -620, width: 40, height: 40, speed: 3.2, type: 'heli' },
  ];
};

const exitGame = () => {
  router.push('/');
};

const showGameOverModal = (title: string, message: string) => {
  gameOverTitle.value = title;
  gameOverMessage.value = `${message}<br><br><b>Pontuação Final: ${score.value}</b>`;
  isGameOver.value = true;
};

const draw = (ctx: CanvasRenderingContext2D) => {
  // 1. Fundo do Rio (Azul)
  ctx.fillStyle = '#1b4965';
  ctx.fillRect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);

  // 2. Margens
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, 20, GAME_HEIGHT);
  ctx.fillRect(CANVAS_WIDTH - 20, 0, 20, GAME_HEIGHT);

  // 3. Desenhar Inimigos e Postos de Combustível
  enemies.value.forEach((en) => {
    let sprite = SPRITES.enemyJet;
    if (en.type === 'fuel') sprite = SPRITES.fuel;
    else if (en.type === 'heli') sprite = SPRITES.enemyHeli;

    ctx.drawImage(
      atlasImage,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      en.x,
      en.y,
      en.width,
      en.height,
    );
  });

  // 4. Desenhar Tiros
  bullets.value.forEach((b) => {
    ctx.drawImage(
      atlasImage,
      SPRITES.bullet.x,
      SPRITES.bullet.y,
      SPRITES.bullet.w,
      SPRITES.bullet.h,
      b.x,
      b.y,
      b.width,
      b.height,
    );
  });

  // 5. Desenhar Explosões Animadas
  const explosionFrames = [
    SPRITES.explosion1,
    SPRITES.explosion2,
    SPRITES.explosion3,
    SPRITES.explosion4,
  ];
  explosions.value.forEach((ex) => {
    const expSprite = explosionFrames[ex.frame];
    if (expSprite) {
      ctx.drawImage(
        atlasImage,
        expSprite.x,
        expSprite.y,
        expSprite.w,
        expSprite.h,
        ex.x,
        ex.y,
        45,
        45,
      );
    }
  });

  // 6. Desenhar Jogador com efeito de piscar se estiver invulnerável
  const isFlashing =
    player.value.invulnerableTimer > 0 && Math.floor(player.value.invulnerableTimer / 5) % 2 === 0;

  if (!isFlashing) {
    let playerSprite = SPRITES.playerStraight;
    if (keys['ArrowLeft'] || keys['KeyA']) playerSprite = SPRITES.playerLeft;
    if (keys['ArrowRight'] || keys['KeyD']) playerSprite = SPRITES.playerRight;

    ctx.drawImage(
      atlasImage,
      playerSprite.x,
      playerSprite.y,
      playerSprite.w,
      playerSprite.h,
      player.value.x,
      player.value.y,
      player.value.width,
      player.value.height,
    );
  }
};

const gameLoop = () => {
  const canvas = gameCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  update();
  draw(ctx);
  animationFrameId = requestAnimationFrame(gameLoop);
};
</script>

<style scoped>
.game-canvas {
  border: 3px solid rgba(212, 175, 55, 0.6);
  border-radius: 12px;
  background-color: #1b4965;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
}
</style>

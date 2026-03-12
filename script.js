const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const stateLabel = document.getElementById("stateLabel");
const coinLabel = document.getElementById("coinLabel");
const lifeLabel = document.getElementById("lifeLabel");
const messageBox = document.getElementById("messageBox");

const SCALE = 2.4;
const GRAVITY = 0.45;
const MOVE_SPEED = 2.5;
const JUMP_FORCE = -9.6;
const FLOOR_Y = 475;

const keys = {};
let gameReady = false;

const camera = {
  x: 0,
  width: canvas.width,
  height: canvas.height,
};

const world = {
  width: 2300,
  height: 540,
  platforms: [
    { x: 140, y: 430, w: 200, h: 22 },
    { x: 450, y: 385, w: 160, h: 20 },
    { x: 690, y: 340, w: 180, h: 18 },
    { x: 980, y: 410, w: 190, h: 20 },
    { x: 1280, y: 355, w: 170, h: 20 },
    { x: 1570, y: 300, w: 170, h: 20 },
    { x: 1860, y: 395, w: 180, h: 22 }
  ],
  coins: [
    { x: 220, y: 390, r: 12, collected: false },
    { x: 505, y: 345, r: 12, collected: false },
    { x: 770, y: 300, r: 12, collected: false },
    { x: 1050, y: 370, r: 12, collected: false },
    { x: 1365, y: 315, r: 12, collected: false },
    { x: 1645, y: 260, r: 12, collected: false },
    { x: 1940, y: 355, r: 12, collected: false }
  ]
};

const assets = {
  map: null,
  idle: null,
  run: null,
  walk: null,
  jump: null,
  attack1: null,
  attack2: null,
  attack3: null,
  hurt: null,
  dead: null,
  shield: null,
};

const animations = {
  idle:    { key: "idle",    frames: 6, frameWidth: 128, frameHeight: 128, speed: 0.12, loop: true },
  run:     { key: "run",     frames: 8, frameWidth: 128, frameHeight: 128, speed: 0.22, loop: true },
  walk:    { key: "walk",    frames: 8, frameWidth: 128, frameHeight: 128, speed: 0.16, loop: true },
  jump:    { key: "jump",    frames: 12, frameWidth: 128, frameHeight: 128, speed: 0.20, loop: false },
  attack1: { key: "attack1", frames: 6, frameWidth: 128, frameHeight: 128, speed: 0.24, loop: false },
  attack2: { key: "attack2", frames: 5, frameWidth: 128, frameHeight: 128, speed: 0.24, loop: false },
  attack3: { key: "attack3", frames: 3, frameWidth: 128, frameHeight: 128, speed: 0.20, loop: false },
  hurt:    { key: "hurt",    frames: 2, frameWidth: 128, frameHeight: 128, speed: 0.16, loop: false },
  dead:    { key: "dead",    frames: 3, frameWidth: 128, frameHeight: 128, speed: 0.12, loop: false },
  shield:  { key: "shield",  frames: 8, frameWidth: 128, frameHeight: 128, speed: 0.16, loop: true },
};

const player = {
  x: 80,
  y: FLOOR_Y - 78,
  width: 42,
  height: 78,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  state: "idle",
  frameIndex: 0,
  frameTick: 0,
  attackLocked: false,
  lives: 3,
  coins: 0,
  respawnX: 80,
  respawnY: FLOOR_Y - 78,
};

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    e.preventDefault();
  }

  if (!gameReady) return;

  if ((key === " " || key === "w" || key === "arrowup") && player.onGround && !player.attackLocked && player.lives > 0) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    setState("jump", true);
  }

  if (key === "j" && !player.attackLocked && player.lives > 0) startAttack("attack1");
  if (key === "k" && !player.attackLocked && player.lives > 0) startAttack("attack2");
  if (key === "l" && !player.attackLocked && player.lives > 0) startAttack("attack3");
  if (key === "r") resetGame();
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Erro ao carregar ${src}`));
    img.src = src;
  });
}

async function loadAssets() {
  try {
    assets.map     = await loadImage("assets/mapa.png");
    assets.idle    = await loadImage("assets/Idle.png");
    assets.run     = await loadImage("assets/Run.png");
    assets.walk    = await loadImage("assets/Walk.png");
    assets.jump    = await loadImage("assets/Jump.png");
    assets.attack1 = await loadImage("assets/Attack_1.png");
    assets.attack2 = await loadImage("assets/Attack_2.png");
    assets.attack3 = await loadImage("assets/Attack_3.png");
    assets.hurt    = await loadImage("assets/Hurt.png");
    assets.dead    = await loadImage("assets/Dead.png");
    assets.shield  = await loadImage("assets/Shield.png");

    gameReady = true;
    messageBox.textContent = "Assets carregados. Jogo rodando.";
    requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error(error);
    messageBox.textContent = "Erro ao carregar assets. Verifique os nomes na pasta assets/.";
    drawErrorScreen(error.message);
  }
}

function drawErrorScreen(message) {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "22px Arial";
  ctx.fillText("Erro ao carregar o jogo", 40, 60);
  ctx.font = "16px Arial";
  ctx.fillText(message, 40, 95);
}

function setState(newState, forceReset = false) {
  if (player.state !== newState || forceReset) {
    player.state = newState;
    player.frameIndex = 0;
    player.frameTick = 0;
    stateLabel.textContent = newState.charAt(0).toUpperCase() + newState.slice(1);
  }
}

function startAttack(type) {
  player.attackLocked = true;
  setState(type, true);
}

function updateHud() {
  coinLabel.textContent = String(player.coins);
  lifeLabel.textContent = String(player.lives);
}

function resetGame() {
  player.x = player.respawnX;
  player.y = player.respawnY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.attackLocked = false;
  player.lives = 3;
  player.coins = 0;
  setState("idle", true);

  for (const coin of world.coins) {
    coin.collected = false;
  }

  updateHud();
  messageBox.textContent = "Jogo reiniciado.";
}

function getPlayerRect(x = player.x, y = player.y) {
  return { x, y, w: player.width, h: player.height };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveHorizontalCollisions(nextX) {
  const nextRect = getPlayerRect(nextX, player.y);

  for (const p of world.platforms) {
    const plat = { x: p.x, y: p.y, w: p.w, h: p.h };
    if (intersects(nextRect, plat)) {
      if (player.vx > 0) nextX = p.x - player.width;
      if (player.vx < 0) nextX = p.x + p.w;
    }
  }

  return nextX;
}

function resolveVerticalCollisions(nextY) {
  let landed = false;
  const nextRect = getPlayerRect(player.x, nextY);

  for (const p of world.platforms) {
    const plat = { x: p.x, y: p.y, w: p.w, h: p.h };
    if (intersects(nextRect, plat)) {
      const previousBottom = player.y + player.height;
      const previousTop = player.y;

      if (player.vy >= 0 && previousBottom <= p.y + 8) {
        nextY = p.y - player.height;
        player.vy = 0;
        landed = true;
      } else if (player.vy < 0 && previousTop >= p.y + p.h - 8) {
        nextY = p.y + p.h;
        player.vy = 0.1;
      }
    }
  }

  if (nextY + player.height >= FLOOR_Y) {
    nextY = FLOOR_Y - player.height;
    player.vy = 0;
    landed = true;
  }

  player.onGround = landed;
  return nextY;
}

function collectCoins() {
  const playerRect = getPlayerRect(player.x + 8, player.y + 8);

  for (const coin of world.coins) {
    if (coin.collected) continue;

    const coinRect = { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 };
    if (intersects(playerRect, coinRect)) {
      coin.collected = true;
      player.coins += 1;
      updateHud();
      messageBox.textContent = `Moedas: ${player.coins}/${world.coins.length}`;
      if (player.coins === world.coins.length) {
        messageBox.textContent = "Você coletou todas as moedas.";
      }
    }
  }
}

function respawnPlayer() {
  player.lives -= 1;
  if (player.lives <= 0) {
    player.lives = 0;
    player.attackLocked = true;
    setState("dead", true);
    messageBox.textContent = "Game over. Aperte R para reiniciar.";
  } else {
    player.x = player.respawnX;
    player.y = player.respawnY;
    player.vx = 0;
    player.vy = 0;
    player.attackLocked = false;
    setState("hurt", true);
    messageBox.textContent = "Você caiu e voltou ao início.";
  }
  updateHud();
}

function updateStateMachine() {
  if (player.lives <= 0) return;
  if (player.attackLocked) return;

  if (!player.onGround) {
    setState("jump");
  } else if (Math.abs(player.vx) > 1.8) {
    setState("run");
  } else if (Math.abs(player.vx) > 0.1) {
    setState("walk");
  } else {
    setState("idle");
  }
}

function updateAnimation() {
  const anim = animations[player.state];
  player.frameTick += anim.speed;

  if (player.frameTick >= 1) {
    player.frameTick = 0;
    player.frameIndex += 1;

    if (player.frameIndex >= anim.frames) {
      if (anim.loop) {
        player.frameIndex = 0;
      } else {
        player.frameIndex = anim.frames - 1;

        if (["attack1", "attack2", "attack3"].includes(player.state)) {
          player.attackLocked = false;
          if (player.onGround) {
            setState("idle", true);
          } else {
            setState("jump", true);
          }
        }

        if (player.state === "hurt") {
          setState("idle", true);
        }
      }
    }
  }
}

function updateCamera() {
  camera.x = player.x - canvas.width / 2 + player.width / 2;
  camera.x = Math.max(0, Math.min(world.width - canvas.width, camera.x));
}

function updatePlayer() {
  const left = keys["a"] || keys["arrowleft"];
  const right = keys["d"] || keys["arrowright"];

  if (!player.attackLocked && player.lives > 0) {
    player.vx = 0;
    if (left) {
      player.vx = -MOVE_SPEED;
      player.facing = -1;
    }
    if (right) {
      player.vx = MOVE_SPEED;
      player.facing = 1;
    }
  }

  let nextX = player.x + player.vx;
  nextX = Math.max(0, Math.min(world.width - player.width, nextX));
  nextX = resolveHorizontalCollisions(nextX);
  player.x = nextX;

  player.vy += GRAVITY;
  let nextY = player.y + player.vy;
  nextY = resolveVerticalCollisions(nextY);
  player.y = nextY;

  if (player.y > canvas.height + 300) {
    respawnPlayer();
  }

  collectCoins();
  updateStateMachine();
  updateAnimation();
  updateCamera();
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (assets.map) {
    const repeats = Math.ceil(world.width / assets.map.width) + 1;
    for (let i = 0; i < repeats; i++) {
      ctx.drawImage(assets.map, i * assets.map.width - camera.x, 0, assets.map.width, canvas.height);
    }
  } else {
    ctx.fillStyle = "#10192d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPlatforms() {
  for (const p of world.platforms) {
    const x = p.x - camera.x;
    ctx.fillStyle = "rgba(78, 134, 191, 0.32)";
    ctx.fillRect(x, p.y, p.w, p.h);
    ctx.strokeStyle = "rgba(205, 237, 255, 0.45)";
    ctx.strokeRect(x, p.y, p.w, p.h);
  }
}

function drawCoins() {
  for (const coin of world.coins) {
    if (coin.collected) continue;
    const x = coin.x - camera.x;
    const y = coin.y;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd24a";
    ctx.fill();
    ctx.strokeStyle = "#fff1a8";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawPlayer() {
  const anim = animations[player.state];
  const img = assets[anim.key];
  if (!img) return;

  const frame = Math.floor(player.frameIndex);
  const sw = anim.frameWidth;
  const sh = anim.frameHeight;
  const sx = frame * sw;

  const drawW = sw * SCALE;
  const drawH = sh * SCALE;
  const drawX = player.x - camera.x - (drawW - player.width) / 2;
  const drawY = player.y - (drawH - player.height);

  ctx.save();
  if (player.facing === -1) {
    ctx.translate(drawX + drawW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, sw, sh, 0, drawY, drawW, drawH);
  } else {
    ctx.drawImage(img, sx, 0, sw, sh, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(12, 12, 240, 80);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(12, 12, 240, 80);
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px Arial";
  ctx.fillText(`X: ${Math.floor(player.x)}`, 24, 36);
  ctx.fillText(`Y: ${Math.floor(player.y)}`, 24, 58);
  ctx.fillText(`Moedas: ${player.coins}/${world.coins.length}`, 24, 80);
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawCoins();
  drawPlayer();
  drawOverlay();
}

function gameLoop() {
  if (gameReady) {
    updatePlayer();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

updateHud();
loadAssets();
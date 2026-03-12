const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const stateLabel = document.getElementById("stateLabel");
const coinLabel = document.getElementById("coinLabel");
const lifeLabel = document.getElementById("lifeLabel");
const messageBox = document.getElementById("messageBox");

const playBtn =
  document.getElementById("playButton") ||
  document.getElementById("jogarBtn") ||
  document.getElementById("btnJogar") ||
  null;

const SCALE = 2.4;

const GRAVITY = 0.42;
const MAX_WALK_SPEED = 2.0;
const MAX_RUN_SPEED = 3.5;
const GROUND_ACCEL = 0.28;
const AIR_ACCEL = 0.14;
const GROUND_FRICTION = 0.80;
const AIR_FRICTION = 0.97;
const JUMP_FORCE = -9.8;
const MAX_FALL_SPEED = 10;
const FLOOR_Y = 470;

const MAX_HEALTH = 180;
const ROUND_RESET_DELAY = 1800;
const HITSTOP_FRAMES = 7;
const ROUNDS_TO_WIN = 2;

const keys = {};
let gameReady = false;
let roundOver = false;
let matchOver = false;
let roundResetTimeout = null;
let hitstop = 0;

let score = {
  player: 0,
  enemy: 0,
  round: 1
};

const world = {
  width: canvas.width,
  height: canvas.height
};

const assets = {
  map: null,

  // player
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

  // enemy
  e_idle: null,
  e_walk: null,
  e_attack1: null,
  e_hurt: null,
  e_dead: null,
  e_shield: null
};

const animations = {
  idle:    { key: "idle",      frames: 6, frameWidth: 128, frameHeight: 128, speed: 0.12, loop: true },
  run:     { key: "run",       frames: 8, frameWidth: 128, frameHeight: 128, speed: 0.22, loop: true },
  walk:    { key: "walk",      frames: 8, frameWidth: 128, frameHeight: 128, speed: 0.16, loop: true },
  jump:    { key: "jump",      frames: 12, frameWidth: 128, frameHeight: 128, speed: 0.18, loop: false },
  attack1: { key: "attack1",   frames: 6, frameWidth: 128, frameHeight: 128, speed: 0.18, loop: false },
  attack2: { key: "attack2",   frames: 5, frameWidth: 128, frameHeight: 128, speed: 0.16, loop: false },
  attack3: { key: "attack3",   frames: 3, frameWidth: 128, frameHeight: 128, speed: 0.13, loop: false },
  hurt:    { key: "hurt",      frames: 2, frameWidth: 128, frameHeight: 128, speed: 0.12, loop: false },
  dead:    { key: "dead",      frames: 3, frameWidth: 128, frameHeight: 128, speed: 0.09, loop: false },
  shield:  { key: "shield",    frames: 8, frameWidth: 128, frameHeight: 128, speed: 0.14, loop: true },

  e_idle:    { key: "e_idle",    frames: 6, frameWidth: 128, frameHeight: 128, speed: 0.12, loop: true },
  e_walk:    { key: "e_walk",    frames: 7, frameWidth: 128, frameHeight: 128, speed: 0.14, loop: true },
  e_attack1: { key: "e_attack1", frames: 5, frameWidth: 128, frameHeight: 128, speed: 0.15, loop: false },
  e_hurt:    { key: "e_hurt",    frames: 3, frameWidth: 128, frameHeight: 128, speed: 0.12, loop: false },
  e_dead:    { key: "e_dead",    frames: 6, frameWidth: 128, frameHeight: 128, speed: 0.09, loop: false },
  e_shield:  { key: "e_idle",    frames: 6, frameWidth: 128, frameHeight: 128, speed: 0.12, loop: true }
};

function createAttackData(type) {
  if (type === "attack1") {
    return {
      type,
      startup: 10,
      activeStart: 11,
      activeEnd: 14,
      total: 28,
      damage: 10,
      knockback: 3.5,
      range: 54
    };
  }

  if (type === "attack2") {
    return {
      type,
      startup: 14,
      activeStart: 15,
      activeEnd: 18,
      total: 36,
      damage: 16,
      knockback: 4.5,
      range: 62
    };
  }

  return {
    type: "attack3",
    startup: 20,
    activeStart: 21,
    activeEnd: 24,
    total: 46,
    damage: 24,
    knockback: 6,
    range: 72
  };
}

function makeFighter({
  x,
  y,
  width,
  height,
  facing,
  state,
  idleState,
  walkState,
  runState,
  jumpState,
  hurtState,
  deadState,
  blockState,
  attackStatePrefix
}) {
  return {
    x,
    y,
    width,
    height,
    vx: 0,
    vy: 0,
    onGround: false,
    facing,
    state,
    frameIndex: 0,
    frameTick: 0,

    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    isDead: false,

    attackLocked: false,
    hitDone: false,
    attackData: null,
    attackFrame: 0,

    isBlocking: false,

    hurtTimer: 0,

    idleState,
    walkState,
    runState,
    jumpState,
    hurtState,
    deadState,
    blockState,
    attackStatePrefix
  };
}

const player = makeFighter({
  x: 110,
  y: FLOOR_Y - 78,
  width: 42,
  height: 78,
  facing: 1,
  state: "idle",
  idleState: "idle",
  walkState: "walk",
  runState: "run",
  jumpState: "jump",
  hurtState: "hurt",
  deadState: "dead",
  blockState: "shield",
  attackStatePrefix: ""
});

const enemy = makeFighter({
  x: 620,
  y: FLOOR_Y - 78,
  width: 42,
  height: 78,
  facing: -1,
  state: "e_idle",
  idleState: "e_idle",
  walkState: "e_walk",
  runState: "e_walk",
  jumpState: "e_idle",
  hurtState: "e_hurt",
  deadState: "e_dead",
  blockState: "e_shield",
  attackStatePrefix: "e_"
});

if (playBtn) {
  playBtn.addEventListener("click", () => {
    if (!gameReady) return;
    startNewMatch();
  });
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if ([" ", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    e.preventDefault();
  }

  if (!gameReady) return;

  if (key === "r" && !matchOver) {
    resetRoundPositions();
    return;
  }

  if (roundOver || matchOver) return;

  if ((key === " " || key === "w" || key === "arrowup") && player.onGround && !player.attackLocked && !player.isDead && !player.isBlocking) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    setState(player, player.jumpState, true);
  }

  if (key === "j" && canAttack(player)) startAttack(player, "attack1");
  if (key === "k" && canAttack(player)) startAttack(player, "attack2");
  if (key === "l" && canAttack(player)) startAttack(player, "attack3");
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
    assets.map       = await loadImage("mapa.png");

    assets.idle      = await loadImage("Idle.png");
    assets.run       = await loadImage("Run.png");
    assets.walk      = await loadImage("Walk.png");
    assets.jump      = await loadImage("Jump.png");
    assets.attack1   = await loadImage("Attack_1.png");
    assets.attack2   = await loadImage("Attack_2.png");
    assets.attack3   = await loadImage("Attack_3.png");
    assets.hurt      = await loadImage("Hurt.png");
    assets.dead      = await loadImage("Dead.png");
    assets.shield    = await loadImage("Shield.png");

    assets.e_idle    = await loadImage("IIdle.png");
    assets.e_walk    = await loadImage("IWalk.png");
    assets.e_attack1 = await loadImage("IAttack_1.png");
    assets.e_hurt    = await loadImage("IHurt.png");
    assets.e_dead    = await loadImage("IDead.png");

    gameReady = true;
    startNewMatch();
    requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error(error);
    messageBox.textContent = "Erro ao carregar sprites. Confira os nomes dos arquivos.";
    drawErrorScreen(error.message);
  }
}

function drawErrorScreen(message) {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "22px Arial";
  ctx.fillText("Erro ao carregar o jogo", 30, 60);
  ctx.font = "16px Arial";
  ctx.fillText(message, 30, 95);
}

function updateHud() {
  if (coinLabel) coinLabel.textContent = `P ${score.player} x ${score.enemy} E`;
  if (lifeLabel) lifeLabel.textContent = `${player.health}`;
  if (stateLabel) stateLabel.textContent = player.state;
}

function setState(character, newState, forceReset = false) {
  if (character.state !== newState || forceReset) {
    character.state = newState;
    character.frameIndex = 0;
    character.frameTick = 0;
    character.hitDone = false;

    if (character === player && stateLabel) {
      stateLabel.textContent = newState;
    }
  }
}

function canAttack(character) {
  return !character.isDead && !character.attackLocked && !character.isBlocking && !roundOver && !matchOver;
}

function startAttack(character, type) {
  character.attackLocked = true;
  character.isBlocking = false;
  character.attackData = createAttackData(type);
  character.attackFrame = 0;
  character.hitDone = false;

  const stateName = character.attackStatePrefix + type;
  const finalState = animations[stateName] ? stateName : character.attackStatePrefix + "attack1";
  setState(character, finalState, true);
}

function scheduleAutoResetRound() {
  if (roundResetTimeout) clearTimeout(roundResetTimeout);
  roundResetTimeout = setTimeout(() => {
    if (!matchOver) {
      resetRoundPositions();
    }
  }, ROUND_RESET_DELAY);
}

function resetCharacter(character, x, facing) {
  character.x = x;
  character.y = FLOOR_Y - character.height;
  character.vx = 0;
  character.vy = 0;
  character.onGround = false;
  character.facing = facing;
  character.health = character.maxHealth;
  character.isDead = false;
  character.attackLocked = false;
  character.hitDone = false;
  character.attackData = null;
  character.attackFrame = 0;
  character.isBlocking = false;
  character.hurtTimer = 0;
  setState(character, character.idleState, true);
}

function resetRoundPositions() {
  roundOver = false;
  hitstop = 0;

  if (roundResetTimeout) {
    clearTimeout(roundResetTimeout);
    roundResetTimeout = null;
  }

  resetCharacter(player, 110, 1);
  resetCharacter(enemy, 620, -1);

  updateHud();
  messageBox.textContent = `Round ${score.round}`;
}

function startNewMatch() {
  matchOver = false;
  roundOver = false;
  hitstop = 0;

  if (roundResetTimeout) {
    clearTimeout(roundResetTimeout);
    roundResetTimeout = null;
  }

  score.player = 0;
  score.enemy = 0;
  score.round = 1;

  resetCharacter(player, 110, 1);
  resetCharacter(enemy, 620, -1);

  updateHud();
  messageBox.textContent = "Round 1";
}

function getRect(obj, x = obj.x, y = obj.y) {
  return { x, y, w: obj.width, h: obj.height };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clampToArena(character) {
  if (character.x < 0) {
    character.x = 0;
    character.vx = 0;
  }
  if (character.x + character.width > world.width) {
    character.x = world.width - character.width;
    character.vx = 0;
  }
}

function applyGroundCollision(character) {
  if (character.y + character.height >= FLOOR_Y) {
    character.y = FLOOR_Y - character.height;
    character.vy = 0;
    character.onGround = true;
  } else {
    character.onGround = false;
  }
}

function separateFighters() {
  const a = getRect(player);
  const b = getRect(enemy);

  if (!intersects(a, b)) return;

  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  if (overlapX <= 0) return;

  const push = overlapX / 2;

  if (player.x < enemy.x) {
    player.x -= push;
    enemy.x += push;
  } else {
    player.x += push;
    enemy.x -= push;
  }

  clampToArena(player);
  clampToArena(enemy);
}

function updatePhysics(character) {
  character.vy += GRAVITY;
  if (character.vy > MAX_FALL_SPEED) character.vy = MAX_FALL_SPEED;

  character.x += character.vx;
  character.y += character.vy;

  clampToArena(character);
  applyGroundCollision(character);
}

function canAutoTurn(character) {
  return !character.isBlocking && !character.attackLocked && !character.isDead && character.hurtTimer <= 0;
}

function updateFacingBetweenFighters() {
  if (canAutoTurn(player)) {
    player.facing = player.x <= enemy.x ? 1 : -1;
  }
  if (canAutoTurn(enemy)) {
    enemy.facing = enemy.x <= player.x ? 1 : -1;
  }
}

function updateBlocking() {
  player.isBlocking =
    !player.isDead &&
    !player.attackLocked &&
    player.onGround &&
    (keys["s"] || keys["arrowdown"]);

  if (player.isBlocking) {
    player.vx *= 0.65;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
    setState(player, player.blockState);
  }

  const dist = Math.abs(player.x - enemy.x);
  const shouldEnemyBlock =
    !enemy.isDead &&
    !enemy.attackLocked &&
    enemy.onGround &&
    dist < 95 &&
    Math.random() < 0.02;

  if (shouldEnemyBlock) {
    enemy.isBlocking = true;
  }

  if (enemy.isBlocking && Math.random() < 0.025) {
    enemy.isBlocking = false;
  }

  if (enemy.isBlocking && !enemy.attackLocked) {
    enemy.vx *= 0.65;
    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;
    setState(enemy, enemy.blockState);
  }
}

function updatePlayerMovement() {
  if (player.isDead || roundOver || matchOver || player.isBlocking) {
    player.vx *= 0.84;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
    return;
  }

  const left = keys["a"] || keys["arrowleft"];
  const right = keys["d"] || keys["arrowright"];
  const running = keys["shift"];

  const targetSpeed = running ? MAX_RUN_SPEED : MAX_WALK_SPEED;
  const accel = player.onGround ? GROUND_ACCEL : AIR_ACCEL;
  const friction = player.onGround ? GROUND_FRICTION : AIR_FRICTION;

  if (!player.attackLocked) {
    if (left && !right) {
      player.vx -= accel;
    } else if (right && !left) {
      player.vx += accel;
    } else {
      player.vx *= friction;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
    }

    if (player.vx > targetSpeed) player.vx = targetSpeed;
    if (player.vx < -targetSpeed) player.vx = -targetSpeed;
  } else {
    player.vx *= 0.90;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }
}

function updateEnemyAI() {
  if (enemy.isDead || roundOver || matchOver) {
    enemy.vx *= 0.84;
    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;
    return;
  }

  if (enemy.isBlocking) {
    enemy.vx *= 0.8;
    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;
    return;
  }

  const distX = player.x - enemy.x;
  const absDist = Math.abs(distX);

  if (enemy.attackLocked) {
    enemy.vx *= 0.88;
    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;
    return;
  }

  if (absDist > 92) {
    enemy.vx = distX > 0 ? 1.45 : -1.45;
  } else {
    enemy.vx *= 0.65;
    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;

    if (Math.random() < 0.03) {
      startAttack(enemy, "attack1");
    }
  }
}

function getAttackBox(character) {
  const data = character.attackData;
  const range = data ? data.range : 50;
  const yOffset = 10;
  const height = character.height - 16;

  if (character.facing === 1) {
    return {
      x: character.x + character.width - 4,
      y: character.y + yOffset,
      w: range,
      h: height
    };
  }

  return {
    x: character.x - range + 4,
    y: character.y + yOffset,
    w: range,
    h: height
  };
}

function isBlockingAttack(target, attacker) {
  if (!target.isBlocking) return false;

  const attackerInFront =
    (target.facing === 1 && attacker.x >= target.x) ||
    (target.facing === -1 && attacker.x <= target.x);

  return attackerInFront;
}

function finishRound(winner) {
  roundOver = true;

  if (winner === "player") {
    score.player++;
    messageBox.textContent = "Você venceu o round!";
  } else {
    score.enemy++;
    messageBox.textContent = "Você perdeu o round!";
  }

  if (score.player >= ROUNDS_TO_WIN || score.enemy >= ROUNDS_TO_WIN) {
    matchOver = true;
    messageBox.textContent =
      score.player > score.enemy
        ? "Você venceu a luta! Aperte Jogar."
        : "Você perdeu a luta! Aperte Jogar.";
    return;
  }

  score.round++;
  scheduleAutoResetRound();
}

function applyHitEffects(attacker, target, damage, knockback, wasBlocked) {
  const finalDamage = wasBlocked ? Math.floor(damage * 0.25) : damage;
  target.health -= finalDamage;
  if (target.health < 0) target.health = 0;

  const kb = wasBlocked ? knockback * 0.30 : knockback;
  target.vx = attacker.x < target.x ? kb : -kb;

  if (!wasBlocked) {
    target.hurtTimer = 12;
    target.isBlocking = false;
    setState(target, target.hurtState, true);
  }

  hitstop = wasBlocked ? 4 : HITSTOP_FRAMES;

  if (target.health <= 0) {
    target.health = 0;
    target.isDead = true;
    target.attackLocked = true;
    target.isBlocking = false;
    setState(target, target.deadState, true);

    finishRound(attacker === player ? "player" : "enemy");
  }

  updateHud();
}

function handleAttackHit(attacker, defender) {
  if (!attacker.attackData || attacker.hitDone || defender.isDead) return;

  const frame = attacker.attackFrame;
  const data = attacker.attackData;
  const isActive = frame >= data.activeStart && frame <= data.activeEnd;

  if (!isActive) return;

  const atk = getAttackBox(attacker);
  const body = getRect(defender);

  if (intersects(atk, body)) {
    const blocked = isBlockingAttack(defender, attacker);
    applyHitEffects(attacker, defender, data.damage, data.knockback, blocked);
    attacker.hitDone = true;
  }
}

function handleCombat() {
  handleAttackHit(player, enemy);
  handleAttackHit(enemy, player);
}

function updateAttackFrames(character) {
  if (!character.attackLocked || !character.attackData) return;

  character.attackFrame++;

  if (character.attackFrame >= character.attackData.total) {
    character.attackLocked = false;
    character.hitDone = false;
    character.attackData = null;
    character.attackFrame = 0;

    if (!character.isDead) {
      setState(character, character.onGround ? character.idleState : character.jumpState, true);
    }
  }
}

function updateHurtState(character) {
  if (character.hurtTimer > 0) {
    character.hurtTimer--;
    if (character.hurtTimer <= 0 && !character.isDead && !character.attackLocked && !character.isBlocking) {
      setState(character, character.idleState, true);
    }
  }
}

function updateStateMachine() {
  if (!player.attackLocked && !player.isDead && !player.isBlocking && player.hurtTimer <= 0) {
    if (!player.onGround) {
      setState(player, player.jumpState);
    } else if (Math.abs(player.vx) > 2.8) {
      setState(player, player.runState);
    } else if (Math.abs(player.vx) > 0.15) {
      setState(player, player.walkState);
    } else {
      setState(player, player.idleState);
    }
  }

  if (!enemy.attackLocked && !enemy.isDead && !enemy.isBlocking && enemy.hurtTimer <= 0) {
    if (!enemy.onGround) {
      setState(enemy, enemy.idleState);
    } else if (Math.abs(enemy.vx) > 0.15) {
      setState(enemy, enemy.walkState);
    } else {
      setState(enemy, enemy.idleState);
    }
  }
}

function updateCharacterAnimation(character) {
  const anim = animations[character.state];
  if (!anim) return;

  character.frameTick += anim.speed;

  if (character.frameTick >= 1) {
    character.frameTick = 0;
    character.frameIndex += 1;

    if (character.frameIndex >= anim.frames) {
      if (anim.loop) {
        character.frameIndex = 0;
      } else {
        character.frameIndex = anim.frames - 1;

        if (character.isDead) return;

        if (character.hurtTimer <= 0 && !character.attackLocked && !character.isBlocking) {
          setState(character, character.idleState, true);
        }
      }
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (assets.map) {
    ctx.drawImage(assets.map, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#1a1a28";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "rgba(0,0,0,0.20)";
  ctx.fillRect(0, FLOOR_Y, canvas.width, canvas.height - FLOOR_Y);
}

function drawCharacter(character) {
  const anim = animations[character.state];
  const img = assets[anim.key];
  if (!img) return;

  const frame = Math.floor(character.frameIndex);
  const sw = anim.frameWidth;
  const sh = anim.frameHeight;
  const sx = Math.min(frame, anim.frames - 1) * sw;

  const drawW = sw * SCALE;
  const drawH = sh * SCALE;
  const drawX = character.x - (drawW - character.width) / 2;
  const drawY = character.y - (drawH - character.height);

  ctx.save();

  if (character.facing === -1) {
    ctx.translate(drawX + drawW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, sw, sh, 0, drawY, drawW, drawH);
  } else {
    ctx.drawImage(img, sx, 0, sw, sh, drawX, drawY, drawW, drawH);
  }

  ctx.restore();
}

function drawHealthBars() {
  const barW = 240;
  const barH = 24;
  const y = 20;
  const leftX = 20;
  const rightX = canvas.width - barW - 20;

  ctx.fillStyle = "#000";
  ctx.fillRect(leftX - 4, y - 4, barW + 8, barH + 8);
  ctx.fillRect(rightX - 4, y - 4, barW + 8, barH + 8);

  ctx.fillStyle = "#343434";
  ctx.fillRect(leftX, y, barW, barH);
  ctx.fillRect(rightX, y, barW, barH);

  ctx.fillStyle = "#d32f2f";
  ctx.fillRect(leftX, y, (player.health / player.maxHealth) * barW, barH);

  const eWidth = (enemy.health / enemy.maxHealth) * barW;
  ctx.fillRect(rightX + (barW - eWidth), y, eWidth, barH);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(leftX, y, barW, barH);
  ctx.strokeRect(rightX, y, barW, barH);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.fillText("PLAYER", leftX, y - 8);
  ctx.fillText("ENEMY", rightX + barW - 60, y - 8);
}

function drawRoundScore() {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(canvas.width / 2 - 90, 12, 180, 42);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`ROUND ${Math.min(score.round, 3)}`, canvas.width / 2, 28);
  ctx.fillText(`${score.player}  x  ${score.enemy}`, canvas.width / 2, 46);
  ctx.textAlign = "start";
}

function drawRoundText() {
  if (!roundOver && !matchOver) return;

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(canvas.width / 2 - 180, 90, 360, 86);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";

  if (matchOver) {
    ctx.fillText(score.player > score.enemy ? "YOU WIN MATCH" : "YOU LOSE MATCH", canvas.width / 2, 125);
    ctx.font = "16px Arial";
    ctx.fillText("Clique em Jogar para iniciar outra luta", canvas.width / 2, 150);
  } else {
    ctx.fillText(player.isDead ? "ROUND LOSE" : "ROUND WIN", canvas.width / 2, 125);
    ctx.font = "16px Arial";
    ctx.fillText("Próximo round iniciando...", canvas.width / 2, 150);
  }

  ctx.textAlign = "start";
}

function drawControlsHint() {
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fillRect(14, canvas.height - 40, 370, 26);
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.fillText("A/D mover • Shift correr • W pular • J/K/L atacar • S bloquear", 20, canvas.height - 22);
}

function draw() {
  drawBackground();
  drawCharacter(player);
  drawCharacter(enemy);
  drawHealthBars();
  drawRoundScore();
  drawRoundText();
  drawControlsHint();
}

function update() {
  if (matchOver) {
    updateCharacterAnimation(player);
    updateCharacterAnimation(enemy);
    return;
  }

  if (hitstop > 0) {
    hitstop--;
    updateCharacterAnimation(player);
    updateCharacterAnimation(enemy);
    return;
  }

  updateFacingBetweenFighters();
  updateBlocking();
  updatePlayerMovement();
  updateEnemyAI();

  updatePhysics(player);
  updatePhysics(enemy);
  separateFighters();

  updateAttackFrames(player);
  updateAttackFrames(enemy);

  handleCombat();

  updateHurtState(player);
  updateHurtState(enemy);

  updateStateMachine();

  updateCharacterAnimation(player);
  updateCharacterAnimation(enemy);
}

function gameLoop() {
  if (gameReady) {
    update();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

updateHud();
loadAssets();

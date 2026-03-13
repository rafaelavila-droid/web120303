  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const menuScreen = document.getElementById("menuScreen");
  const selectScreen = document.getElementById("selectScreen");
  const fightScreen = document.getElementById("fightScreen");

const fullscreenBtn = document.getElementById("fullscreenBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const confirmSelectionBtn = document.getElementById("confirmSelectionBtn");
const restartMatchBtn = document.getElementById("restartMatchBtn");
const backToMenuFromFightBtn = document.getElementById("backToMenuFromFightBtn");

  const characterGrid = document.getElementById("characterGrid");
  const messageBox = document.getElementById("messageBox");
  const roundLabel = document.getElementById("roundLabel");
  const scoreLabel = document.getElementById("scoreLabel");
  const playerNameLabel = document.getElementById("playerNameLabel");
  const enemyNameLabel = document.getElementById("enemyNameLabel");

const playerPreviewCanvas = document.getElementById("playerPreviewCanvas");
const enemyPreviewCanvas = document.getElementById("enemyPreviewCanvas");
const playerSelectName = document.getElementById("playerSelectName");
const enemySelectName = document.getElementById("enemySelectName");
const playerSelectDesc = document.getElementById("playerSelectDesc");
const enemySelectDesc = document.getElementById("enemySelectDesc");
const playerSelectStats = document.getElementById("playerSelectStats");
const enemySelectStats = document.getElementById("enemySelectStats");
const playerHealthBar = document.getElementById("playerHealthBar");
const enemyHealthBar = document.getElementById("enemyHealthBar");
const playerHealthText = document.getElementById("playerHealthText");
const enemyHealthText = document.getElementById("enemyHealthText");

  const LOGICAL_WIDTH = 1280;
  const LOGICAL_HEIGHT = 720;

  canvas.width = LOGICAL_WIDTH;
  canvas.height = LOGICAL_HEIGHT;

  const SCALE = 2.7;
  const FRAME_W = 128;
  const FRAME_H = 128;

  const GRAVITY = 0.42;
  const MAX_WALK_SPEED = 2.0;
  const MAX_RUN_SPEED = 3.5;
  const GROUND_ACCEL = 0.28;
  const AIR_ACCEL = 0.14;
  const GROUND_FRICTION = 0.80;
  const AIR_FRICTION = 0.97;
  const JUMP_FORCE = -9.8;
  const MAX_FALL_SPEED = 10;
  const FLOOR_Y = 585;

  const MAX_HEALTH = 220;
  const HITSTOP_FRAMES = 7;
  const ROUNDS_TO_WIN = 2;
  const POST_DEATH_ROUND_DELAY_FRAMES = 52;
  const POST_DEATH_MATCH_DELAY_FRAMES = 92;
  const POST_MATCH_RETURN_DELAY_FRAMES = 150;
  const ROUND_END_AUDIO_FALLBACK_FRAMES = 120;

  const keys = {};
  const assets = {};
  const roundKoAudio = new Audio("ko.mp3");
  const themeAudio = new Audio("theme.mp3");
  const swordSlashAudioPool = Array.from({ length: 4 }, () => new Audio("sword-slash.mp3"));
  roundKoAudio.preload = "auto";
  roundKoAudio.volume = 0.2;
  themeAudio.preload = "auto";
  themeAudio.loop = true;
  themeAudio.volume = 0.22;
  swordSlashAudioPool.forEach((audio) => {
    audio.preload = "auto";
    audio.volume = 0.3;
  });

  let gameReady = false;
  let hitstop = 0;
  let roundOver = false;
  let matchOver = false;
  let selectedCharacterId = null;
  let selectedCharacter = null;
  let matchReturnTimer = 0;
  let previewAnimationTime = 0;

  const gameState = {
    screen: "menu",
    playerWins: 0,
    enemyWins: 0,
    round: 1
  };

  const deathFlow = {
    active: false,
    winner: null,
    target: null,
    waitingForAnim: false,
    timer: 0
  };

  const roundTransition = {
    active: false,
    timer: 0
  };

  const characters = [
    {
      id: "shinobi",
      name: "Shinobi",
      description: "Lutador equilibrado, rápido e versátil.",
      stats: { power: 7, speed: 8, defense: 6 },
      preview: "Idle.png",
      sprites: {
        idle: "Idle.png",
        walk: "Walk.png",
        run: "Run.png",
        jump: "Jump.png",
        attack1: "Attack_1.png",
        attack2: "Attack_2.png",
        attack3: "Attack_3.png",
        hurt: "Hurt.png",
        dead: "Dead.png",
        block: "Shield.png"
      },
      anim: {
        idle: { frames: 6, speed: 0.12 },
        walk: { frames: 8, speed: 0.16 },
        run: { frames: 8, speed: 0.22 },
        jump: { frames: 12, speed: 0.18 },
        attack1: { frames: 6, speed: 0.18 },
        attack2: { frames: 5, speed: 0.16 },
        attack3: { frames: 3, speed: 0.13 },
        hurt: { frames: 2, speed: 0.12 },
        dead: { frames: 3, speed: 0.09 },
        block: { frames: 8, speed: 0.14 }
      }
    },
    {
      id: "specter",
      name: "Specter",
      description: "Oponente sombrio com golpes mais pesados.",
      stats: { power: 8, speed: 6, defense: 7 },
      preview: "IIdle.png",
      sprites: {
        idle: "IIdle.png",
        walk: "IWalk.png",
        run: "IWalk.png",
        jump: "IIdle.png",
        attack1: "IAttack_1.png",
        attack2: "IAttack_1.png",
        attack3: "IAttack_1.png",
        hurt: "IHurt.png",
        dead: "IDead.png",
        block: "IIdle.png"
      },
      anim: {
        idle: { frames: 6, speed: 0.12 },
        walk: { frames: 7, speed: 0.14 },
        run: { frames: 7, speed: 0.18 },
        jump: { frames: 6, speed: 0.12 },
        attack1: { frames: 5, speed: 0.15 },
        attack2: { frames: 5, speed: 0.15 },
        attack3: { frames: 5, speed: 0.15 },
        hurt: { frames: 3, speed: 0.12 },
        dead: { frames: 6, speed: 0.09 },
        block: { frames: 6, speed: 0.12 }
      }
    }
  ];

const stage = {
  background: "mapa.png",
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT
};

  function createFighter() {
    return {
      x: 0,
      y: 0,
      width: 56,
      height: 112,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,

      state: "idle",
      frameIndex: 0,
      frameTick: 0,

      health: MAX_HEALTH,
      maxHealth: MAX_HEALTH,
      isDead: false,
      deathAnimFinished: false,

      isBlocking: false,
      attackLocked: false,
      hitDone: false,
      attackData: null,
      attackFrame: 0,
      hurtTimer: 0,

      characterId: null,
      name: "",
      spriteSet: null,
      animSet: null,
      aiControlled: false,
      aiState: "idle",
      aiDecisionTimer: 0,
      aiActionTimer: 0,
      aiAttackCooldown: 0,
      aiStrafeBias: 0
    };
  }

  const player = createFighter();
  const enemy = createFighter();

  function createAttackData(type, owner) {
    const isPlayer = owner === player;

    if (isPlayer) {
      if (type === "attack1") {
        return { type, total: 28, activeStart: 11, activeEnd: 14, damage: 10, knockback: 3.5, range: 62 };
      }
      if (type === "attack2") {
        return { type, total: 36, activeStart: 15, activeEnd: 18, damage: 16, knockback: 4.5, range: 72 };
      }
      return { type, total: 46, activeStart: 21, activeEnd: 24, damage: 24, knockback: 6.0, range: 82 };
    }

    if (type === "attack1") {
      return { type, total: 32, activeStart: 14, activeEnd: 18, damage: 12, knockback: 4.0, range: 74 };
    }
    if (type === "attack2") {
      return { type, total: 36, activeStart: 15, activeEnd: 19, damage: 14, knockback: 4.4, range: 78 };
    }
    return { type, total: 42, activeStart: 18, activeEnd: 22, damage: 18, knockback: 5.2, range: 84 };
  }

function setScreen(name) {
  gameState.screen = name;
  clearKeys();
  stopRoundKoAudio();
  syncBackgroundMusic();
  menuScreen.classList.toggle("active", name === "menu");
  selectScreen.classList.toggle("active", name === "select");
  fightScreen.classList.toggle("active", name === "fight");
}

function updateUI() {
  roundLabel.textContent = `ROUND ${Math.min(gameState.round, 3)}`;
  scoreLabel.textContent = `${gameState.playerWins} x ${gameState.enemyWins}`;
  playerNameLabel.textContent = player.name || "PLAYER";
  enemyNameLabel.textContent = enemy.name || "ENEMY";
  syncFightHud();
}

function setMessage(text) {
  if (messageBox) {
    messageBox.textContent = text;
  }
}

function stopRoundKoAudio() {
  try {
    roundKoAudio.pause();
    roundKoAudio.currentTime = 0;
  } catch {}
}

function syncBackgroundMusic() {
  const shouldPlay = gameState.screen === "menu" || gameState.screen === "select";

  try {
    if (!shouldPlay) {
      themeAudio.pause();
      return;
    }

    const playPromise = themeAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {}
}

function playRoundKoAudio() {
  try {
    roundKoAudio.pause();
    roundKoAudio.currentTime = 0;
    const playPromise = roundKoAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {}
}

function playSwordSlashAudio() {
  const availableAudio =
    swordSlashAudioPool.find((audio) => audio.paused || audio.ended) ||
    swordSlashAudioPool[0];

  if (!availableAudio) return;

  try {
    availableAudio.currentTime = 0;
    const playPromise = availableAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {}
}

function getRoundKoDelayFrames() {
  const duration = Number.isFinite(roundKoAudio.duration) ? roundKoAudio.duration : 0;
  const fromAudio = duration > 0 ? Math.ceil(duration * 60) : 0;
  return Math.max(ROUND_END_AUDIO_FALLBACK_FRAMES, fromAudio);
}

function resetRoundTransition() {
  roundTransition.active = false;
  roundTransition.timer = 0;
}

function clearKeys() {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
}

function renderStatChips(container, stats) {
  if (!container || !stats) return;

  container.innerHTML = `
    <span>Poder ${stats.power}</span>
    <span>Velocidade ${stats.speed}</span>
    <span>Defesa ${stats.defense}</span>
  `;
}

function syncFightHud() {
  const playerRatio = player.maxHealth ? (player.health / player.maxHealth) * 100 : 0;
  const enemyRatio = enemy.maxHealth ? (enemy.health / enemy.maxHealth) * 100 : 0;

  if (playerHealthBar) playerHealthBar.style.width = `${Math.max(0, playerRatio)}%`;
  if (enemyHealthBar) enemyHealthBar.style.width = `${Math.max(0, enemyRatio)}%`;
  if (playerHealthText) playerHealthText.textContent = `${player.health} / ${player.maxHealth}`;
  if (enemyHealthText) enemyHealthText.textContent = `${enemy.health} / ${enemy.maxHealth}`;
}

  function setState(fighter, newState, force = false) {
    if (fighter.state !== newState || force) {
      fighter.state = newState;
      fighter.frameIndex = 0;
      fighter.frameTick = 0;
      fighter.hitDone = false;
    }
  }

  function canAttack(fighter) {
    return !fighter.isDead && !fighter.attackLocked && !fighter.isBlocking && !roundOver && !matchOver && !deathFlow.active;
  }

  function resetDeathFlow() {
    deathFlow.active = false;
    deathFlow.winner = null;
    deathFlow.target = null;
    deathFlow.waitingForAnim = false;
    deathFlow.timer = 0;
  }

  function resetFighter(fighter, x, facing, data, aiControlled = false) {
    fighter.x = x;
    fighter.y = FLOOR_Y - fighter.height;
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.onGround = false;
    fighter.facing = facing;

    fighter.state = "idle";
    fighter.frameIndex = 0;
    fighter.frameTick = 0;

    fighter.health = fighter.maxHealth;
    fighter.isDead = false;
    fighter.deathAnimFinished = false;

    fighter.isBlocking = false;
    fighter.attackLocked = false;
    fighter.hitDone = false;
    fighter.attackData = null;
    fighter.attackFrame = 0;
    fighter.hurtTimer = 0;

  fighter.characterId = data.id;
  fighter.name = data.name;
  fighter.spriteSet = data.sprites;
  fighter.animSet = data.anim;
  fighter.aiControlled = aiControlled;
  fighter.aiState = "idle";
  fighter.aiDecisionTimer = 0;
  fighter.aiActionTimer = 0;
  fighter.aiAttackCooldown = 0;
  fighter.aiStrafeBias = Math.random() < 0.5 ? -1 : 1;
}

  function getEnemyCharacterForSelection() {
    return characters.find(c => c.id !== selectedCharacter.id) || characters[0];
  }

function startNewMatch() {
  if (!selectedCharacter) return;

    gameState.playerWins = 0;
    gameState.enemyWins = 0;
    gameState.round = 1;

  roundOver = false;
  matchOver = false;
  matchReturnTimer = 0;
  hitstop = 0;
  clearKeys();
  resetRoundTransition();
  stopRoundKoAudio();
  resetDeathFlow();

    const enemyCharacter = getCpuPreviewCharacter();

    resetFighter(player, 180, 1, selectedCharacter, false);
    resetFighter(enemy, 1040, -1, enemyCharacter, true);

    updateUI();
    setMessage("Luta iniciada.");
    setScreen("fight");
  }

function nextRound() {
  roundOver = false;
  hitstop = 0;
  clearKeys();
  resetRoundTransition();
  stopRoundKoAudio();
  resetDeathFlow();

    resetFighter(player, 180, 1, selectedCharacter, false);
    const enemyCharacter = characters.find(c => c.id === enemy.characterId) || getEnemyCharacterForSelection();
    resetFighter(enemy, 1040, -1, enemyCharacter, true);

    updateUI();
    setMessage(`Round ${gameState.round}`);
  }

  function finishRound(winner) {
    if (winner === "player") {
      gameState.playerWins++;
      setMessage("Você venceu o round!");
    } else {
      gameState.enemyWins++;
      setMessage("Você perdeu o round!");
    }

    updateUI();

    if (gameState.playerWins >= ROUNDS_TO_WIN || gameState.enemyWins >= ROUNDS_TO_WIN) {
      matchOver = true;
      matchReturnTimer = Math.max(POST_MATCH_RETURN_DELAY_FRAMES, getRoundKoDelayFrames());
      setMessage(gameState.playerWins > gameState.enemyWins ? "Vitória final." : "Derrota final.");
      return;
    }

    gameState.round++;
    roundTransition.active = true;
    roundTransition.timer = getRoundKoDelayFrames();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      if (assets[src]) {
        resolve(assets[src]);
        return;
      }

      const img = new Image();
      img.onload = () => {
        assets[src] = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Erro ao carregar ${src}`));
      img.src = src;
    });
  }

  async function preloadAssets() {
    const files = new Set([stage.background]);

    characters.forEach(char => {
      files.add(char.preview);
      Object.values(char.sprites).forEach(src => files.add(src));
    });

    for (const file of files) {
      await loadImage(file);
    }

    gameReady = true;
  }

  function renderCharacterCards() {
    characterGrid.innerHTML = "";

    characters.forEach(char => {
      const card = document.createElement("button");
      card.className = "character-card";
      card.type = "button";
      card.dataset.id = char.id;

      const previewWrap = document.createElement("div");
      previewWrap.className = "character-preview";

      const previewCanvas = document.createElement("canvas");
      previewCanvas.width = 260;
      previewCanvas.height = 180;
      previewWrap.appendChild(previewCanvas);

      const meta = document.createElement("div");
      meta.className = "character-meta";
      meta.innerHTML = `
        <h3>${char.name}</h3>
        <p>${char.description}</p>
        <div class="character-stats">
          <span>Poder ${char.stats.power}</span>
          <span>Velocidade ${char.stats.speed}</span>
          <span>Defesa ${char.stats.defense}</span>
        </div>
      `;

      card.appendChild(previewWrap);
      card.appendChild(meta);

      card.addEventListener("click", () => {
        selectedCharacterId = char.id;
        selectedCharacter = char;
        confirmSelectionBtn.disabled = false;

        document.querySelectorAll(".character-card").forEach(el => el.classList.remove("selected"));
        card.classList.add("selected");

        updateCharacterSelectShowcase();
      });

      characterGrid.appendChild(card);
      drawCharacterPreview(previewCanvas, char);
    });

    if (!selectedCharacter && characters.length > 0) {
      selectedCharacter = characters[0];
      selectedCharacterId = characters[0].id;
      confirmSelectionBtn.disabled = false;

      const firstCard = characterGrid.querySelector(".character-card");
      if (firstCard) firstCard.classList.add("selected");
    }

    updateCharacterSelectShowcase();
  }

  function drawCharacterPreview(previewCanvas, char) {
    const pctx = previewCanvas.getContext("2d");
    pctx.imageSmoothingEnabled = false;

    const img = assets[char.preview];
    if (!img) return;

    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pctx.fillStyle = "#0a1020";
    pctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    const scale = 1.75;
    const dw = FRAME_W * scale;
    const dh = FRAME_H * scale;

    pctx.drawImage(
      img,
      0, 0, FRAME_W, FRAME_H,
      previewCanvas.width / 2 - dw / 2,
      previewCanvas.height / 2 - dh / 2 + 8,
      dw, dh
    );
  }

  function getCpuPreviewCharacter() {
    if (!selectedCharacter) return characters[1] || characters[0];
    return characters.find(c => c.id !== selectedCharacter.id) || selectedCharacter;
  }

  function drawShowcaseCharacter(previewCanvas, char, facing = 1, elapsed = 0) {
    if (!previewCanvas || !char) return;

    const pctx = previewCanvas.getContext("2d");
    pctx.imageSmoothingEnabled = false;

    const img = assets[char.preview];
    if (!img) return;

    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const scale = 2.55;
    const dw = FRAME_W * scale;
    const dh = FRAME_H * scale;
    const dx = previewCanvas.width / 2 - dw / 2;
    const dy = previewCanvas.height / 2 - dh / 2 + 22;
    const idleAnim = char.anim?.idle;
    const idleFrame = idleAnim
      ? Math.floor((elapsed * idleAnim.speed * 0.06) % idleAnim.frames)
      : 0;
    const sx = idleFrame * FRAME_W;

    pctx.save();

    if (facing === -1) {
      pctx.translate(dx + dw, 0);
      pctx.scale(-1, 1);
      pctx.drawImage(img, sx, 0, FRAME_W, FRAME_H, 0, dy, dw, dh);
    } else {
      pctx.drawImage(img, sx, 0, FRAME_W, FRAME_H, dx, dy, dw, dh);
    }

    pctx.restore();
  }

  function updateCharacterSelectShowcase() {
  const playerChar = selectedCharacter || characters[0];
  const cpuChar = getCpuPreviewCharacter();

    if (playerSelectName) {
      playerSelectName.textContent = playerChar ? playerChar.name : "ESCOLHA";
    }

  if (enemySelectName) {
    enemySelectName.textContent = cpuChar ? cpuChar.name : "RIVAL";
  }

  if (playerSelectDesc) {
    playerSelectDesc.textContent = playerChar ? playerChar.description : "Selecione seu lutador para ver os detalhes.";
  }

  if (enemySelectDesc) {
    enemySelectDesc.textContent = cpuChar ? cpuChar.description : "Oponente definido automaticamente para o confronto.";
  }

  renderStatChips(playerSelectStats, playerChar?.stats);
  renderStatChips(enemySelectStats, cpuChar?.stats);

  drawShowcaseCharacter(playerPreviewCanvas, playerChar, 1, previewAnimationTime);
  drawShowcaseCharacter(enemyPreviewCanvas, cpuChar, -1, previewAnimationTime);
}

function animateCharacterSelectShowcase() {
  previewAnimationTime += 1;
  const playerChar = selectedCharacter || characters[0];
  const cpuChar = getCpuPreviewCharacter();

  drawShowcaseCharacter(playerPreviewCanvas, playerChar, 1, previewAnimationTime);
  drawShowcaseCharacter(enemyPreviewCanvas, cpuChar, -1, previewAnimationTime);
}

  function requestFullscreenGame() {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if ([" ", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      e.preventDefault();
    }

    if (!gameReady) return;

    // MENU: qualquer tecla entra na seleção
    if (gameState.screen === "menu") {
      setScreen("select");
      return;
    }

    // SELEÇÃO
    if (gameState.screen === "select") {
      if (key === "escape") {
        setScreen("menu");
        return;
      }

      if (key === "enter" && selectedCharacter) {
        startNewMatch();
        return;
      }

      // seleção por teclado simples
      const currentIndex = characters.findIndex(c => c.id === selectedCharacterId);
      let nextIndex = currentIndex >= 0 ? currentIndex : 0;

      if (key === "arrowright" || key === "d") {
        nextIndex = (nextIndex + 1) % characters.length;
      } else if (key === "arrowleft" || key === "a") {
        nextIndex = (nextIndex - 1 + characters.length) % characters.length;
      } else {
        return;
      }

      selectedCharacter = characters[nextIndex];
      selectedCharacterId = selectedCharacter.id;
      confirmSelectionBtn.disabled = false;

      document.querySelectorAll(".character-card").forEach(el => {
        el.classList.toggle("selected", el.dataset.id === selectedCharacterId);
      });

      updateCharacterSelectShowcase();
      return;
    }

    // FIGHT
    if (gameState.screen !== "fight") return;
    if (roundOver || matchOver || deathFlow.active) return;

    if (key === "escape") {
      setScreen("menu");
      return;
    }

    if (
      (key === " " || key === "w" || key === "arrowup") &&
      player.onGround &&
      !player.attackLocked &&
      !player.isBlocking
    ) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      setState(player, "jump", true);
    }

  if (key === "j" && canAttack(player)) startAttack(player, "attack1");
  if (key === "k" && canAttack(player)) startAttack(player, "attack2");
  if (key === "l" && canAttack(player)) startAttack(player, "attack3");
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
  });

  window.addEventListener("blur", () => {
    clearKeys();
  });

  function startAttack(fighter, type) {
    fighter.attackLocked = true;
    fighter.isBlocking = false;
    fighter.attackData = createAttackData(type, fighter);
    fighter.attackFrame = 0;
    fighter.hitDone = false;
    if (type === "attack1" || type === "attack2" || type === "attack3") {
      playSwordSlashAudio();
    }
    setState(fighter, type, true);
  }

  function clampToArena(fighter) {
    if (fighter.x < 0) {
      fighter.x = 0;
      fighter.vx = 0;
    }
    if (fighter.x + fighter.width > stage.width) {
      fighter.x = stage.width - fighter.width;
      fighter.vx = 0;
    }
  }

  function applyGroundCollision(fighter) {
    if (fighter.y + fighter.height >= FLOOR_Y) {
      fighter.y = FLOOR_Y - fighter.height;
      fighter.vy = 0;
      fighter.onGround = true;
    } else {
      fighter.onGround = false;
    }
  }

  function updatePhysics(fighter) {
    fighter.vy += GRAVITY;
    if (fighter.vy > MAX_FALL_SPEED) fighter.vy = MAX_FALL_SPEED;

    fighter.x += fighter.vx;
    fighter.y += fighter.vy;

    clampToArena(fighter);
    applyGroundCollision(fighter);
  }

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function getRect(f) {
    return { x: f.x, y: f.y, w: f.width, h: f.height };
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

  function canAutoTurn(fighter) {
    return !fighter.isBlocking && !fighter.attackLocked && !fighter.isDead && fighter.hurtTimer <= 0;
  }

  function updateFacing() {
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
      !deathFlow.active &&
      (keys["s"] || keys["arrowdown"]);

    if (player.isBlocking) {
      player.vx *= 0.65;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
      setState(player, "block");
    }

    const dist = Math.abs(player.x - enemy.x);
    const shouldEnemyBlock =
      !enemy.isDead &&
      !enemy.attackLocked &&
      enemy.onGround &&
      !deathFlow.active &&
      dist < 120 &&
      (player.attackLocked || player.hurtTimer > 0) &&
      Math.random() < 0.16;

    if (shouldEnemyBlock) enemy.isBlocking = true;
    if (enemy.isBlocking && Math.random() < (player.attackLocked ? 0.035 : 0.12)) enemy.isBlocking = false;

    if (enemy.isBlocking) {
      enemy.vx *= 0.65;
      if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;
      setState(enemy, "block");
    }
  }

  function updatePlayerMovement() {
    if (player.isDead || player.isBlocking || deathFlow.active) {
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
      if (left && !right) player.vx -= accel;
      else if (right && !left) player.vx += accel;
      else {
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
    if (enemy.isDead || enemy.isBlocking || deathFlow.active) {
      enemy.vx *= 0.84;
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

    if (enemy.aiAttackCooldown > 0) enemy.aiAttackCooldown--;
    if (enemy.aiDecisionTimer > 0) enemy.aiDecisionTimer--;
    if (enemy.aiActionTimer > 0) enemy.aiActionTimer--;

    const playerAttacking = player.attackLocked || player.hurtTimer > 0;
    const lowHealth = enemy.health < enemy.maxHealth * 0.35;
    const veryClose = absDist < 86;
    const close = absDist < 135;
    const far = absDist > 250;

    if (enemy.aiDecisionTimer <= 0) {
      enemy.aiDecisionTimer = 18 + Math.floor(Math.random() * 28);

      if (playerAttacking && close && Math.random() < 0.45) {
        enemy.aiState = "retreat";
        enemy.aiActionTimer = 16 + Math.floor(Math.random() * 22);
      } else if (veryClose && Math.random() < (lowHealth ? 0.55 : 0.3)) {
        enemy.aiState = "retreat";
        enemy.aiActionTimer = 14 + Math.floor(Math.random() * 20);
      } else if (far) {
        enemy.aiState = Math.random() < 0.78 ? "approach" : "wait";
        enemy.aiActionTimer = 20 + Math.floor(Math.random() * 22);
      } else if (close) {
        const roll = Math.random();
        if (roll < 0.25) {
          enemy.aiState = "wait";
          enemy.aiActionTimer = 10 + Math.floor(Math.random() * 18);
        } else if (roll < 0.48) {
          enemy.aiState = "strafe";
          enemy.aiActionTimer = 16 + Math.floor(Math.random() * 20);
          if (Math.random() < 0.5) enemy.aiStrafeBias *= -1;
        } else {
          enemy.aiState = "approach";
          enemy.aiActionTimer = 14 + Math.floor(Math.random() * 18);
        }
      } else {
        enemy.aiState = "approach";
        enemy.aiActionTimer = 16 + Math.floor(Math.random() * 24);
      }
    }

    const moveDir = distX === 0 ? 0 : distX > 0 ? 1 : -1;

    if (enemy.aiState === "wait") {
      enemy.vx *= 0.72;
    } else if (enemy.aiState === "retreat") {
      enemy.vx = -moveDir * (1.0 + Math.random() * 0.45);
    } else if (enemy.aiState === "strafe") {
      enemy.vx = enemy.aiStrafeBias * 0.9;

      if (absDist > 170) {
        enemy.vx = moveDir * 1.15;
      }
    } else {
      const desiredSpeed = close ? 0.95 + Math.random() * 0.35 : 1.2 + Math.random() * 0.45;
      enemy.vx = moveDir * desiredSpeed;
    }

    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;

    if (enemy.aiAttackCooldown <= 0 && close && enemy.onGround && !player.isDead) {
      const attackRoll = Math.random();

      if (veryClose && attackRoll < 0.04) {
        startAttack(enemy, lowHealth ? "attack2" : "attack1");
        enemy.aiAttackCooldown = 26 + Math.floor(Math.random() * 18);
        enemy.aiState = "wait";
        enemy.aiActionTimer = 12;
      } else if (absDist < 118 && attackRoll < 0.02) {
        startAttack(enemy, "attack2");
        enemy.aiAttackCooldown = 34 + Math.floor(Math.random() * 18);
        enemy.aiState = "retreat";
        enemy.aiActionTimer = 10;
      }
    }
  }

  function getAttackBox(fighter) {
    const data = fighter.attackData;
    const range = data ? data.range : 60;
    const yOffset = 16;
    const height = fighter.height - 24;

    if (fighter.facing === 1) {
      return {
        x: fighter.x + fighter.width - 6,
        y: fighter.y + yOffset,
        w: range,
        h: height
      };
    }

    return {
      x: fighter.x - range + 6,
      y: fighter.y + yOffset,
      w: range,
      h: height
    };
  }

  function isBlockingAttack(target, attacker) {
    if (!target.isBlocking) return false;

    return (
      (target.facing === 1 && attacker.x >= target.x) ||
      (target.facing === -1 && attacker.x <= target.x)
    );
  }

function applyHitEffects(attacker, target, damage, knockback, blocked) {
  const finalDamage = blocked ? Math.floor(damage * 0.25) : damage;
  target.health -= finalDamage;
  if (target.health < 0) target.health = 0;
  syncFightHud();

    const kb = blocked ? knockback * 0.32 : knockback;
    target.vx = attacker.x < target.x ? kb : -kb;

    if (!blocked) {
      target.hurtTimer = 12;
      target.isBlocking = false;
      setState(target, "hurt", true);
    }

    hitstop = blocked ? 4 : HITSTOP_FRAMES;

  if (target.health <= 0) {
    target.health = 0;
    target.isDead = true;
    target.attackLocked = true;
    target.isBlocking = false;
      target.deathAnimFinished = false;
      setState(target, "dead", true);

      roundOver = true;
      deathFlow.active = true;
    deathFlow.winner = attacker === player ? "player" : "enemy";
    deathFlow.target = target;
    deathFlow.waitingForAnim = true;
    deathFlow.timer = 0;
    playRoundKoAudio();
  }
}

  function handleAttackHit(attacker, defender) {
    if (!attacker.attackData || attacker.hitDone || defender.isDead) return;

    const frame = attacker.attackFrame;
    const data = attacker.attackData;
    const isActive = frame >= data.activeStart && frame <= data.activeEnd;

    if (!isActive) return;

    const attackBox = getAttackBox(attacker);
    const body = getRect(defender);

    if (intersects(attackBox, body)) {
      const blocked = isBlockingAttack(defender, attacker);
      applyHitEffects(attacker, defender, data.damage, data.knockback, blocked);
      attacker.hitDone = true;
    }
  }

  function handleCombat() {
    handleAttackHit(player, enemy);
    handleAttackHit(enemy, player);
  }

  function updateAttackFrames(fighter) {
    if (!fighter.attackLocked || !fighter.attackData) return;

    fighter.attackFrame++;

    if (fighter.attackFrame >= fighter.attackData.total) {
      fighter.attackLocked = false;
      fighter.hitDone = false;
      fighter.attackData = null;
      fighter.attackFrame = 0;

      if (!fighter.isDead) {
        setState(fighter, fighter.onGround ? "idle" : "jump", true);
      }
    }
  }

  function updateHurtState(fighter) {
    if (fighter.hurtTimer > 0) {
      fighter.hurtTimer--;
      if (fighter.hurtTimer <= 0 && !fighter.isDead && !fighter.attackLocked && !fighter.isBlocking) {
        setState(fighter, "idle", true);
      }
    }
  }

  function updateStateMachine() {
    if (!player.attackLocked && !player.isDead && !player.isBlocking && player.hurtTimer <= 0) {
      if (!player.onGround) setState(player, "jump");
      else if (Math.abs(player.vx) > 2.8) setState(player, "run");
      else if (Math.abs(player.vx) > 0.15) setState(player, "walk");
      else setState(player, "idle");
    }

    if (!enemy.attackLocked && !enemy.isDead && !enemy.isBlocking && enemy.hurtTimer <= 0) {
      if (!enemy.onGround) setState(enemy, "jump");
      else if (Math.abs(enemy.vx) > 1.2) setState(enemy, "walk");
      else setState(enemy, "idle");
    }
  }

  function updateAnimation(fighter) {
    if (!fighter.animSet) return;

    const anim = fighter.animSet[fighter.state];
    if (!anim) return;

    fighter.frameTick += anim.speed;

    if (fighter.frameTick >= 1) {
      fighter.frameTick = 0;
      fighter.frameIndex += 1;

      if (fighter.frameIndex >= anim.frames) {
        if (["idle", "walk", "run", "block"].includes(fighter.state)) {
          fighter.frameIndex = 0;
        } else {
          fighter.frameIndex = anim.frames - 1;

          if (fighter.isDead && fighter.state === "dead") {
            fighter.deathAnimFinished = true;
            return;
          }

          if (fighter.hurtTimer <= 0 && !fighter.attackLocked && !fighter.isBlocking) {
            setState(fighter, "idle", true);
          }
        }
      }
    }
  }

  function processDeathFlow() {
    if (!deathFlow.active || !deathFlow.target) return;

    if (deathFlow.waitingForAnim) {
      if (deathFlow.target.deathAnimFinished) {
        deathFlow.waitingForAnim = false;
        deathFlow.timer = 0;
      }
      return;
    }

    deathFlow.timer++;

    const willEndMatch =
      (deathFlow.winner === "player" && gameState.playerWins + 1 >= ROUNDS_TO_WIN) ||
      (deathFlow.winner === "enemy" && gameState.enemyWins + 1 >= ROUNDS_TO_WIN);

    const requiredFrames = willEndMatch
      ? POST_DEATH_MATCH_DELAY_FRAMES
      : POST_DEATH_ROUND_DELAY_FRAMES;

    if (deathFlow.timer < requiredFrames) return;

    const winner = deathFlow.winner;
    resetDeathFlow();
    finishRound(winner);
  }

  function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bg = assets[stage.background];
    if (bg) {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#0d1320";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, FLOOR_Y, canvas.width, canvas.height - FLOOR_Y);

    const grad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      120,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.65
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.48)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawFighter(fighter) {
    if (!fighter.spriteSet || !fighter.animSet) return;

    const stateKey = fighter.state in fighter.spriteSet ? fighter.state : "idle";
    const img = assets[fighter.spriteSet[stateKey]];
    const anim = fighter.animSet[stateKey];

    if (!img || !anim) return;

    const frame = Math.min(Math.floor(fighter.frameIndex), anim.frames - 1);
    const sx = frame * FRAME_W;

    const dw = FRAME_W * SCALE;
    const dh = FRAME_H * SCALE;
    const dx = fighter.x - (dw - fighter.width) / 2;
    const dy = fighter.y - (dh - fighter.height);

    ctx.save();

    if (fighter.facing === -1) {
      ctx.translate(dx + dw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, 0, FRAME_W, FRAME_H, 0, dy, dw, dh);
    } else {
      ctx.drawImage(img, sx, 0, FRAME_W, FRAME_H, dx, dy, dw, dh);
    }

    ctx.restore();
  }

  function drawHealthBars() {
    const barW = 360;
    const barH = 28;
    const topY = 26;
    const leftX = 28;
    const rightX = canvas.width - barW - 28;

    ctx.fillStyle = "#000";
    ctx.fillRect(leftX - 5, topY - 5, barW + 10, barH + 10);
    ctx.fillRect(rightX - 5, topY - 5, barW + 10, barH + 10);

    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(leftX, topY, barW, barH);
    ctx.fillRect(rightX, topY, barW, barH);

    ctx.fillStyle = "#d6334c";
    ctx.fillRect(leftX, topY, (player.health / player.maxHealth) * barW, barH);

    const enemyWidth = (enemy.health / enemy.maxHealth) * barW;
    ctx.fillRect(rightX + (barW - enemyWidth), topY, enemyWidth, barH);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(leftX, topY, barW, barH);
    ctx.strokeRect(rightX, topY, barW, barH);
  }

function drawOverlayCard(title, subtitle, scoreText = "") {
    ctx.save();

    ctx.fillStyle = "rgba(3, 6, 14, 0.58)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const w = 560;
    const h = 260;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;

    ctx.fillStyle = "rgba(8, 14, 28, 0.92)";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const topGrad = ctx.createLinearGradient(x, y, x, y + 84);
    topGrad.addColorStop(0, "rgba(88, 198, 255, 0.22)");
    topGrad.addColorStop(1, "rgba(88, 198, 255, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, 84);

    ctx.textAlign = "center";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.fillText(title, canvas.width / 2, y + 74);

    ctx.fillStyle = "#b8c7e6";
    ctx.font = "20px Arial";
    ctx.fillText(subtitle, canvas.width / 2, y + 120);

    if (scoreText) {
      ctx.fillStyle = "#eaf2ff";
      ctx.font = "bold 30px Arial";
      ctx.fillText(scoreText, canvas.width / 2, y + 170);
    }

    ctx.textAlign = "start";
    ctx.restore();
  }

  function drawRoundOverlay() {
    if (deathFlow.active) {
      drawOverlayCard("K.O.", "Finalizando animação de morte...");
      return;
    }

    if (matchOver) {
      drawOverlayCard(
        gameState.playerWins > gameState.enemyWins ? "YOU WIN" : "GAME OVER",
        gameState.playerWins > gameState.enemyWins
          ? "Você venceu a luta inteira."
          : "Seu lutador foi derrotado.",
        `${gameState.playerWins}  x  ${gameState.enemyWins}`
      );

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#8fd8ff";
      ctx.font = "18px Arial";
      ctx.fillText("Use o botão Revanche ou volte ao Menu", canvas.width / 2, canvas.height / 2 + 74);
      ctx.restore();
      return;
    }

    if (roundOver) {
      drawOverlayCard(
        player.isDead ? "ROUND LOSE" : "ROUND WIN",
        "Preparando o próximo round..."
      );
    }
  }

function draw() {
  drawBackground();
  drawHealthBars();
  drawFighter(player);
  drawFighter(enemy);
  drawRoundOverlay();
}

  function update() {
    if (matchOver) {
      if (matchReturnTimer > 0) {
        matchReturnTimer--;
      } else {
        clearKeys();
        setScreen("select");
        updateCharacterSelectShowcase();
        return;
      }

      updateAnimation(player);
      updateAnimation(enemy);
      return;
    }

    if (roundTransition.active) {
      if (roundTransition.timer > 0) {
        roundTransition.timer--;
      } else {
        nextRound();
        return;
      }

      updateAnimation(player);
      updateAnimation(enemy);
      return;
    }

    if (hitstop > 0) {
      hitstop--;
      updateAnimation(player);
      updateAnimation(enemy);
      return;
    }

    updateFacing();
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

    updateAnimation(player);
    updateAnimation(enemy);

    processDeathFlow();
  }

  function gameLoop() {
    if (gameReady) {
      if (gameState.screen === "fight") {
        update();
        draw();
      } else if (gameState.screen === "select") {
        animateCharacterSelectShowcase();
      }
    }
    requestAnimationFrame(gameLoop);
  }

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", () => {
    requestFullscreenGame();
  });
}

  backToMenuBtn.addEventListener("click", () => {
    setScreen("menu");
  });

  confirmSelectionBtn.addEventListener("click", () => {
    if (!selectedCharacter) return;
    startNewMatch();
  });

if (restartMatchBtn) {
  restartMatchBtn.addEventListener("click", () => {
    if (!selectedCharacter) return;
    startNewMatch();
  });
}

if (backToMenuFromFightBtn) {
  backToMenuFromFightBtn.addEventListener("click", () => {
    setScreen("menu");
  });
}

(async function init() {
  try {
    setMessage("Carregando assets...");
    await preloadAssets();
    renderCharacterCards();
    updateUI();
    setScreen("menu");
    setMessage("Pronto.");
    requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Erro ao carregar o jogo.");
    }
  })();

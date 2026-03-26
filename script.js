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
const playerPortraitCanvas = document.getElementById("playerPortraitCanvas");
const enemyPortraitCanvas = document.getElementById("enemyPortraitCanvas");
const cpuShowcase = document.querySelector(".fighter-showcase.right");
const centerChip = document.querySelector(".center-chip");
const mobileControls = document.getElementById("mobileControls");
const mobileJoystickArea = document.getElementById("mobileJoystickArea");
const mobileJoystickThumb = document.getElementById("mobileJoystickThumb");
const mobileJumpButton = document.getElementById("mobileJumpButton");
const mobileAttack1Button = document.getElementById("mobileAttack1Button");
const mobileAttack2Button = document.getElementById("mobileAttack2Button");
const mobileAttack3Button = document.getElementById("mobileAttack3Button");
const mobileBlockButton = document.getElementById("mobileBlockButton");
const mobileDashButton = document.getElementById("mobileDashButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const vrToggleButton = document.getElementById("vrToggleButton");

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
  const JUMP_FORCE = -13.8;
  const MAX_FALL_SPEED = 11;
  const FLOOR_Y = 585;

  const MAX_HEALTH = 220;
  const HITSTOP_FRAMES = 7;
  const ROUNDS_TO_WIN = 2;
  const POST_DEATH_ROUND_DELAY_FRAMES = 52;
  const POST_DEATH_MATCH_DELAY_FRAMES = 92;
  const POST_MATCH_RETURN_DELAY_FRAMES = 150;
  const ROUND_END_AUDIO_FALLBACK_FRAMES = 120;
  const ROUND_INTRO_AUDIO_FALLBACK_FRAMES = 165;
  const DASH_SPEED = 9.8;
  const AIR_DASH_SPEED = 10.4;
  const DASH_DURATION_FRAMES = 13;
  const DASH_COOLDOWN_FRAMES = 24;
  const MOBILE_FIGHT_RENDER_SCALE_LANDSCAPE = 0.72;
  const MOBILE_FIGHT_RENDER_SCALE_PORTRAIT = 0.8;

  const keys = {};
  const assets = {};
  const roundKoAudio = new Audio("ko.mp3");
  const themeAudio = new Audio("theme.mp3");
  const round1FightAudio = new Audio("round1-fight.mp3");
  const round2FightAudio = new Audio("round2-fight.mp3");
  const round3FightAudio = new Audio("round3-fight.mp3");
  const swordSlashAudioPool = Array.from({ length: 4 }, () => new Audio("sword-slash.mp3"));
  const mageFlameAudioPool = Array.from({ length: 4 }, () => new Audio("flames-effect.mp3"));
  const selectClickAudioPool = Array.from({ length: 8 }, () => new Audio("select-click.mp3"));
  const ROUND_INTRO_VOLUME = 0.42;
  const ROUND1_INTRO_VOLUME = 0.72;
  roundKoAudio.preload = "auto";
  roundKoAudio.volume = 0.2;
  themeAudio.preload = "auto";
  themeAudio.loop = true;
  themeAudio.volume = 0.22;
  [round1FightAudio, round2FightAudio, round3FightAudio].forEach((audio) => {
    audio.preload = "auto";
    audio.volume = ROUND_INTRO_VOLUME;
    audio.addEventListener("ended", () => {
      if (roundIntro.active && getRoundIntroAudio(roundIntro.round) === audio) {
        roundIntro.timer = 0;
        roundIntro.audioStarted = false;
      }
    });
  });
  round1FightAudio.volume = ROUND1_INTRO_VOLUME;
  swordSlashAudioPool.forEach((audio) => {
    audio.preload = "auto";
    audio.volume = 0.3;
  });
  mageFlameAudioPool.forEach((audio) => {
    audio.preload = "auto";
    audio.volume = 0.34;
  });
  selectClickAudioPool.forEach((audio) => {
    audio.preload = "auto";
    audio.volume = 0.34;
  });

  let gameReady = false;
  let hitstop = 0;
  let roundOver = false;
  let matchOver = false;
  let selectedCharacterId = null;
  let selectedCharacter = null;
  let matchReturnTimer = 0;
  let previewAnimationTime = 0;
  let cpuRouletteStep = 0;
  let selectClickAudioIndex = 0;

  const cpuSelection = {
    previewId: null,
    lockedId: null,
    spinning: false,
    timerId: null
  };

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

  const roundIntro = {
    active: false,
    timer: 0,
    round: 1,
    audioStarted: false
  };

  const mobileMode = {
    active: false
  };

  const renderState = {
    scale: 1,
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT
  };

  const inputMode = {
    forceDesktop: false,
    lastPointerType: "mouse"
  };

  const audioState = {
    userActivated: false
  };

  const vrState = {
    supported: false,
    supportChecked: false,
    active: false,
    session: null,
    refSpace: null,
    gl: null,
    layer: null,
    canvas: null,
    program: null,
    positionBuffer: null,
    uvBuffer: null,
    indexBuffer: null,
    texture: null,
    textureWidth: 0,
    textureHeight: 0,
    attributes: null,
    uniforms: null,
    modelMatrix: null
  };

  const touchControls = {
    moveX: 0,
    moveY: 0,
    run: false,
    blockPressed: false,
    joystickPointerId: null
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
        block: { frames: 2, speed: 0, holdFrame: 1 }
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
        block: { frames: 6, speed: 0, holdFrame: 0 }
      }
    },
    {
      id: "vermilion",
      name: "Vermilion",
      description: "Espadachim carmesim com golpes precisos e postura agressiva.",
      stats: { power: 8, speed: 7, defense: 6 },
      preview: "VermilionIdle.png",
      sprites: {
        idle: "VermilionIdle.png",
        walk: "VermilionWalk.png",
        run: "VermilionRun.png",
        jump: "VermilionJump.png",
        attack1: "VermilionAttack_1.png",
        attack2: "VermilionAttack_2.png",
        attack3: "VermilionAttack_3.png",
        hurt: "VermilionHurt.png",
        dead: "VermilionDead.png",
        block: "VermilionShield.png"
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
        block: { frames: 2, speed: 0, holdFrame: 1 }
      }
    },
    {
      id: "arcanist",
      name: "Arcanist",
      description: "Maga de fogo de medio alcance, com rajadas e projeteis arcanos.",
      stats: { power: 7, speed: 6, defense: 5 },
      preview: "ArcanistIdle.png",
      sprites: {
        idle: "ArcanistIdle.png",
        walk: "ArcanistWalk.png",
        run: "ArcanistRun.png",
        jump: "ArcanistJump.png",
        attack1: "ArcanistAttack_1.png",
        attack2: "ArcanistFireball.png",
        attack3: "ArcanistFlameJet.png",
        hurt: "ArcanistHurt.png",
        dead: "ArcanistDead.png",
        block: "ArcanistShield.png"
      },
      anim: {
        idle: { frames: 7, speed: 0.12 },
        walk: { frames: 6, speed: 0.14 },
        run: { frames: 8, speed: 0.18 },
        jump: { frames: 9, speed: 0.16 },
        attack1: { frames: 4, speed: 0.16 },
        attack2: { frames: 8, speed: 0.15 },
        attack3: { frames: 14, speed: 0.18 },
        hurt: { frames: 3, speed: 0.12 },
        dead: { frames: 6, speed: 0.09 },
        block: { frames: 6, speed: 0, holdFrame: 0 }
      }
    }
  ];

  characters.forEach((char) => {
    if (!char.sprites.dash) {
      char.sprites.dash = char.sprites.run || char.sprites.walk || char.sprites.idle;
    }

    if (!char.anim.dash) {
      const baseAnim = char.anim.run || char.anim.walk || char.anim.idle || { frames: 1, speed: 0.2 };
      char.anim.dash = {
        ...baseAnim,
        speed: Math.max((baseAnim.speed || 0.18) * 1.65, 0.28)
      };
    }
  });

const stage = {
  background: "mapa.png",
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT
};

  const backgroundCache = {
    canvas: null,
    mode: "",
    background: ""
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
      characterData: null,
      aiControlled: false,
      aiState: "idle",
      aiDecisionTimer: 0,
      aiActionTimer: 0,
      aiAttackCooldown: 0,
      aiJumpCooldown: 0,
      aiMoveSpeed: 0,
      aiStrafeBias: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashDirection: 0,
      airDashUsed: false,
      dashBurstTimer: 0
    };
  }

  const player = createFighter();
  const enemy = createFighter();

  function createAttackData(type, owner) {
    if (owner.characterId === "arcanist") {
      if (type === "attack1") {
        return { type, total: 28, activeStart: 10, activeEnd: 14, damage: 9, knockback: 3.2, range: 84 };
      }
      if (type === "attack2") {
        return { type, total: 52, activeStart: 16, activeEnd: 24, damage: 13, knockback: 4.0, range: 116 };
      }
      return { type, total: 76, activeStart: 20, activeEnd: 38, damage: 18, knockback: 5.0, range: 138 };
    }

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
  if (name !== "fight" && vrState.active) {
    endVrSession();
  }

  if (name !== "select") {
    stopCpuRoulette(name === "menu");
  } else {
    cpuSelection.lockedId = null;
    cpuSelection.previewId = null;
    syncSelectionActions();
    syncSelectionCardStates();
  }

  gameState.screen = name;
  clearKeys();
  stopRoundKoAudio();
  stopRoundIntroAudio();
  resetRoundIntro();
  syncBackgroundMusic();
  menuScreen.classList.toggle("active", name === "menu");
  selectScreen.classList.toggle("active", name === "select");
  fightScreen.classList.toggle("active", name === "fight");
  syncMobileUi();
  updateVrButtonState();
  focusGameSurface();
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

function getRoundIntroAudio(round) {
  if (round >= 3) return round3FightAudio;
  if (round === 2) return round2FightAudio;
  return round1FightAudio;
}

function stopRoundIntroAudio() {
  [round1FightAudio, round2FightAudio, round3FightAudio].forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  });
}

function attemptPlayAudio(audio, onBlocked = null) {
  if (!audio) return;

  try {
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (onBlocked) onBlocked();
      });
    }
  } catch {
    if (onBlocked) onBlocked();
  }
}

function focusGameSurface() {
  const screenToFocus =
    gameState.screen === "fight"
      ? fightScreen
      : gameState.screen === "select"
        ? selectScreen
        : menuScreen;

  try {
    window.focus();
  } catch {}

  try {
    screenToFocus?.focus({ preventScroll: true });
  } catch {}

  try {
    document.body?.focus({ preventScroll: true });
  } catch {}
}

function registerUserInteraction() {
  audioState.userActivated = true;
  focusGameSurface();

  if (gameState.screen === "menu" || gameState.screen === "select") {
    syncBackgroundMusic();
  }
}

function syncBackgroundMusic() {
  const shouldPlay = gameState.screen === "menu" || gameState.screen === "select";

  try {
    if (!shouldPlay) {
      themeAudio.pause();
      return;
    }

    attemptPlayAudio(themeAudio);
  } catch {}
}

function playRoundKoAudio() {
  try {
    roundKoAudio.pause();
    roundKoAudio.currentTime = 0;
    attemptPlayAudio(roundKoAudio);
  } catch {}
}

function playRoundIntroAudio(round) {
  const audio = getRoundIntroAudio(round);
  if (!audio) return false;

  stopRoundIntroAudio();

  try {
    audio.currentTime = 0;
    attemptPlayAudio(audio, () => {
      if (roundIntro.active && getRoundIntroAudio(roundIntro.round) === audio) {
        roundIntro.audioStarted = false;
      }
    });
    return true;
  } catch {}

  return false;
}

function playSwordSlashAudio() {
  const availableAudio =
    swordSlashAudioPool.find((audio) => audio.paused || audio.ended) ||
    swordSlashAudioPool[0];

  if (!availableAudio) return;

  try {
    availableAudio.currentTime = 0;
    attemptPlayAudio(availableAudio);
  } catch {}
}

function playMageFlameAudio() {
  const availableAudio =
    mageFlameAudioPool.find((audio) => audio.paused || audio.ended) ||
    mageFlameAudioPool[0];

  if (!availableAudio) return;

  try {
    availableAudio.currentTime = 0;
    attemptPlayAudio(availableAudio);
  } catch {}
}

function playSelectClickAudio() {
  if (!selectClickAudioPool.length) return;

  const availableAudio = selectClickAudioPool[selectClickAudioIndex % selectClickAudioPool.length];
  selectClickAudioIndex = (selectClickAudioIndex + 1) % selectClickAudioPool.length;

  try {
    availableAudio.pause();
    availableAudio.currentTime = 0;
    attemptPlayAudio(availableAudio);
  } catch {}
}

function getRoundKoDelayFrames() {
  const duration = Number.isFinite(roundKoAudio.duration) ? roundKoAudio.duration : 0;
  const fromAudio = duration > 0 ? Math.ceil(duration * 60) : 0;
  return Math.max(ROUND_END_AUDIO_FALLBACK_FRAMES, fromAudio);
}

function getRoundIntroDelayFrames(round) {
  const audio = getRoundIntroAudio(round);
  const duration = audio && Number.isFinite(audio.duration) ? audio.duration : 0;
  const fromAudio = duration > 0 ? Math.ceil(duration * 60) : 0;
  return fromAudio > 0 ? fromAudio + 2 : ROUND_INTRO_AUDIO_FALLBACK_FRAMES;
}

function resetRoundTransition() {
  roundTransition.active = false;
  roundTransition.timer = 0;
}

function resetRoundIntro() {
  roundIntro.active = false;
  roundIntro.timer = 0;
  roundIntro.round = gameState.round;
  roundIntro.audioStarted = false;
}

function beginRoundIntro() {
  roundIntro.active = true;
  roundIntro.round = gameState.round;
  roundIntro.timer = getRoundIntroDelayFrames(gameState.round);
  roundIntro.audioStarted = false;
  clearKeys();
  roundIntro.audioStarted = playRoundIntroAudio(gameState.round);
}

function isLikelyMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || "";
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

function shouldForceDesktopModeForKey(key) {
  return [
    "a",
    "d",
    "w",
    "s",
    "j",
    "k",
    "l",
    " ",
    "shift",
    "control",
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "escape",
    "enter"
  ].includes(key);
}

function isMobileViewport() {
  const hasTouch = navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
  const compactViewport =
    window.innerWidth <= 1024 ||
    window.innerHeight <= 820 ||
    Math.min(window.innerWidth, window.innerHeight) <= 768;

  if (!hasTouch || !compactViewport) {
    return false;
  }

  if (inputMode.forceDesktop) {
    return false;
  }

  return isLikelyMobileDevice() || inputMode.lastPointerType === "touch";
}

function isMobileFightControlsEnabled() {
  return mobileMode.active && gameState.screen === "fight";
}

function isLandscapeViewport() {
  return window.innerWidth > window.innerHeight;
}

function isShortMobileViewport() {
  return mobileMode.active && window.innerHeight <= 560;
}

function isMobilePerformanceMode() {
  return mobileMode.active;
}

function getTargetRenderScale() {
  if (!mobileMode.active) {
    return 1;
  }

  return isLandscapeViewport()
    ? MOBILE_FIGHT_RENDER_SCALE_LANDSCAPE
    : MOBILE_FIGHT_RENDER_SCALE_PORTRAIT;
}

function syncCanvasResolution(force = false) {
  const scale = getTargetRenderScale();
  const nextWidth = Math.max(1, Math.round(LOGICAL_WIDTH * scale));
  const nextHeight = Math.max(1, Math.round(LOGICAL_HEIGHT * scale));

  if (!force && renderState.width === nextWidth && renderState.height === nextHeight) {
    return;
  }

  renderState.scale = scale;
  renderState.width = nextWidth;
  renderState.height = nextHeight;
  canvas.width = nextWidth;
  canvas.height = nextHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function updateJoystickVisual() {
  if (!mobileJoystickThumb || !mobileJoystickArea) return;

  const limit = Math.min(mobileJoystickArea.clientWidth, mobileJoystickArea.clientHeight) * 0.24;
  const x = touchControls.moveX * limit;
  const y = touchControls.moveY * limit;
  mobileJoystickThumb.style.transform = `translate(${x}px, ${y}px)`;
  mobileJoystickArea.classList.toggle("active", touchControls.joystickPointerId !== null);
}

function resetTouchControls() {
  touchControls.moveX = 0;
  touchControls.moveY = 0;
  touchControls.run = false;
  touchControls.blockPressed = false;
  touchControls.joystickPointerId = null;
  updateJoystickVisual();
  [
    mobileJumpButton,
    mobileAttack1Button,
    mobileAttack2Button,
    mobileAttack3Button,
    mobileBlockButton,
    mobileDashButton,
    mobileMenuButton
  ].forEach((button) => button?.classList.remove("is-pressed"));
}

function syncMobileUi() {
  mobileMode.active = isMobileViewport();
  document.body.classList.toggle("mobile-device", mobileMode.active);
  document.body.classList.toggle("mobile-landscape", mobileMode.active && isLandscapeViewport());
  document.body.classList.toggle("mobile-short", isShortMobileViewport());
  document.body.classList.toggle("fight-touch-active", mobileMode.active && gameState.screen === "fight");
  syncCanvasResolution();

  if (mobileControls) {
    const visible = mobileMode.active && gameState.screen === "fight";
    mobileControls.classList.toggle("mobile-visible", visible);
    mobileControls.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  if (centerChip) {
    centerChip.textContent = mobileMode.active ? "Menu no botao" : "Esc para menu";
  }

  if (!mobileMode.active) {
    resetTouchControls();
  }
}

function updateTouchJoystickFromPointer(clientX, clientY) {
  if (!mobileJoystickArea) return;

  const rect = mobileJoystickArea.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const limit = Math.min(rect.width, rect.height) * 0.24;
  let dx = clientX - centerX;
  let dy = clientY - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance > limit && distance > 0) {
    const scale = limit / distance;
    dx *= scale;
    dy *= scale;
  }

  touchControls.moveX = Math.max(-1, Math.min(1, dx / limit));
  touchControls.moveY = Math.max(-1, Math.min(1, dy / limit));
  touchControls.run = Math.hypot(touchControls.moveX, touchControls.moveY) > 0.72;
  updateJoystickVisual();
}

function getPlayerInputState() {
  const touchLeft = isMobileFightControlsEnabled() && touchControls.moveX < -0.2;
  const touchRight = isMobileFightControlsEnabled() && touchControls.moveX > 0.2;
  const touchRun = isMobileFightControlsEnabled() && touchControls.run;

  return {
    left: keys["a"] || keys["arrowleft"] || touchLeft,
    right: keys["d"] || keys["arrowright"] || touchRight,
    running: keys["shift"] || touchRun
  };
}

function canUseTouchCombatAction() {
  return isMobileFightControlsEnabled() && !roundOver && !matchOver && !deathFlow.active && !roundIntro.active;
}

function triggerTouchCombatAction(action) {
  if (action === "menu") {
    if (!isMobileFightControlsEnabled()) return;
    playSelectClickAudio();
    setScreen("menu");
    return;
  }

  if (!canUseTouchCombatAction()) return;

  if (action === "jump") {
    triggerPlayerJump();
    return;
  }

  if (action === "dash") {
    triggerPlayerDashFromInput();
    return;
  }

  if (touchControls.blockPressed) return;

  if (action === "attack1" && canAttack(player)) startAttack(player, "attack1");
  if (action === "attack2" && canAttack(player)) startAttack(player, "attack2");
  if (action === "attack3" && canAttack(player)) startAttack(player, "attack3");
}

function clearKeys() {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });

  resetTouchControls();
}

function getCharacterById(id) {
  return characters.find((char) => char.id === id) || null;
}

function getCpuCandidateRoster() {
  return characters;
}

function getCpuSelectableCharacters() {
  return characters.filter((char) => char.id !== selectedCharacterId);
}

function syncSelectionCardStates() {
  const cpuPreviewId = getCpuPreviewCharacter()?.id || null;

  document.querySelectorAll(".character-card").forEach((card) => {
    const isSelected = card.dataset.id === selectedCharacterId;
    const isCpuPreview = cpuPreviewId && card.dataset.id === cpuPreviewId;

    card.classList.toggle("selected", isSelected);
    card.classList.toggle("cpu-preview", Boolean(isCpuPreview && !isSelected));
  });

  if (characterGrid) {
    characterGrid.classList.toggle("roulette-active", cpuSelection.spinning);
  }

  if (cpuShowcase) {
    cpuShowcase.classList.toggle("cpu-roulette", cpuSelection.spinning);
  }
}

function syncSelectionActions() {
  if (confirmSelectionBtn) {
    confirmSelectionBtn.disabled = !selectedCharacter || cpuSelection.spinning;
  }

  if (backToMenuBtn) {
    backToMenuBtn.disabled = cpuSelection.spinning;
  }
}

function stopCpuRoulette(clearLocked = false) {
  if (cpuSelection.timerId) {
    clearTimeout(cpuSelection.timerId);
    cpuSelection.timerId = null;
  }

  cpuSelection.spinning = false;
  cpuSelection.previewId = null;
  cpuRouletteStep = 0;

  if (clearLocked) {
    cpuSelection.lockedId = null;
  }

  syncSelectionActions();
  syncSelectionCardStates();
}

function applySelectedCharacter(char, playAudio = false) {
  if (!char || cpuSelection.spinning) return;

  if (playAudio) {
    playSelectClickAudio();
  }

  selectedCharacter = char;
  selectedCharacterId = char.id;
  cpuSelection.lockedId = null;
  cpuSelection.previewId = null;
  syncSelectionActions();
  syncSelectionCardStates();
  updateCharacterSelectShowcase();
}

function renderStatChips(container, stats) {
  if (!container) return;
  if (!stats) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <span>Poder ${stats.power}</span>
    <span>Velocidade ${stats.speed}</span>
    <span>Defesa ${stats.defense}</span>
  `;
}

function getPortraitFrame(char) {
  switch (char?.id) {
    case "specter":
      return { zoom: 2.4, offsetX: -8, offsetY: -26 };
    case "arcanist":
      return { zoom: 2.2, offsetX: 8, offsetY: -20 };
    case "vermilion":
      return { zoom: 2.05, offsetX: 6, offsetY: -22 };
    case "shinobi":
    default:
      return { zoom: 2.05, offsetX: 6, offsetY: -22 };
  }
}

function drawHudPortrait(canvasEl, char, facing = 1) {
  if (!canvasEl) return;

  const pctx = canvasEl.getContext("2d");
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const radius = 22;
  pctx.fillStyle = "rgba(5, 12, 20, 0.9)";
  pctx.beginPath();
  pctx.roundRect(2, 2, canvasEl.width - 4, canvasEl.height - 4, radius);
  pctx.fill();

  const frameGrad = pctx.createLinearGradient(0, 0, canvasEl.width, canvasEl.height);
  frameGrad.addColorStop(0, "rgba(255, 241, 201, 0.8)");
  frameGrad.addColorStop(1, "rgba(247, 185, 85, 0.24)");
  pctx.strokeStyle = frameGrad;
  pctx.lineWidth = 2;
  pctx.beginPath();
  pctx.roundRect(3, 3, canvasEl.width - 6, canvasEl.height - 6, radius - 2);
  pctx.stroke();

  const bgGrad = pctx.createRadialGradient(
    canvasEl.width / 2,
    canvasEl.height / 2 - 12,
    10,
    canvasEl.width / 2,
    canvasEl.height / 2 - 10,
    canvasEl.width * 0.62
  );
  bgGrad.addColorStop(0, "rgba(110, 215, 255, 0.28)");
  bgGrad.addColorStop(1, "rgba(110, 215, 255, 0)");
  pctx.fillStyle = bgGrad;
  pctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  if (!char) return;

  const img = assets[char.preview];
  const idleAnim = char.anim?.idle;
  if (!img || !idleAnim) return;

  const frameMeta = getAnimFrameMeta(idleAnim, idleAnim.holdFrame ?? 0);
  const portraitFrame = getPortraitFrame(char);
  const clipX = 4;
  const clipY = 4;
  const clipW = canvasEl.width - 8;
  const clipH = canvasEl.height - 8;
  const baseScale = Math.max(clipW / frameMeta.sw, clipH / frameMeta.sh);
  const scale = baseScale * portraitFrame.zoom;
  const destW = frameMeta.sw * scale;
  const destH = frameMeta.sh * scale;
  const destX = (canvasEl.width - destW) / 2 + portraitFrame.offsetX;
  const destY = (canvasEl.height - destH) / 2 + portraitFrame.offsetY;

  pctx.save();
  pctx.beginPath();
  pctx.roundRect(4, 4, canvasEl.width - 8, canvasEl.height - 8, radius - 2);
  pctx.clip();
  if (facing === -1) {
    pctx.translate(canvasEl.width, 0);
    pctx.scale(-1, 1);
  }
  pctx.drawImage(
    img,
    frameMeta.sx,
    frameMeta.sy,
    frameMeta.sw,
    frameMeta.sh,
    destX,
    destY,
    destW,
    destH
  );
  pctx.restore();
}

function refreshHudPortraits() {
  drawHudPortrait(playerPortraitCanvas, player.characterData, 1);
  drawHudPortrait(enemyPortraitCanvas, enemy.characterData, -1);
}

function syncFightHud() {
  const playerRatio = player.maxHealth ? (player.health / player.maxHealth) * 100 : 0;
  const enemyRatio = enemy.maxHealth ? (enemy.health / enemy.maxHealth) * 100 : 0;

  if (playerHealthBar) playerHealthBar.style.width = `${Math.max(0, playerRatio)}%`;
  if (enemyHealthBar) enemyHealthBar.style.width = `${Math.max(0, enemyRatio)}%`;
  if (playerHealthText) playerHealthText.textContent = `${player.health} / ${player.maxHealth}`;
  if (enemyHealthText) enemyHealthText.textContent = `${enemy.health} / ${enemy.maxHealth}`;
  refreshHudPortraits();
}

function drawQuestionMarkShowcase(previewCanvas) {
  if (!previewCanvas) return;

  const pctx = previewCanvas.getContext("2d");
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  const ring = pctx.createRadialGradient(
    previewCanvas.width / 2,
    previewCanvas.height / 2 - 10,
    12,
    previewCanvas.width / 2,
    previewCanvas.height / 2 - 10,
    previewCanvas.width * 0.34
  );
  ring.addColorStop(0, "rgba(255, 193, 104, 0.34)");
  ring.addColorStop(1, "rgba(255, 193, 104, 0)");
  pctx.fillStyle = ring;
  pctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

  pctx.strokeStyle = "rgba(255, 213, 146, 0.18)";
  pctx.lineWidth = 3;
  pctx.beginPath();
  pctx.arc(previewCanvas.width / 2, previewCanvas.height / 2 - 8, 70, 0, Math.PI * 2);
  pctx.stroke();

  pctx.textAlign = "center";
  pctx.textBaseline = "middle";
  pctx.fillStyle = "#ffe3a4";
  pctx.font = "900 170px 'Bebas Neue', Impact, sans-serif";
  pctx.fillText("?", previewCanvas.width / 2, previewCanvas.height / 2 + 8);

  pctx.fillStyle = "rgba(255, 244, 210, 0.85)";
  pctx.font = "700 20px 'Barlow', sans-serif";
  pctx.fillText("RIVAL ALEATORIO", previewCanvas.width / 2, previewCanvas.height - 52);
}

function getAnimFrameMeta(anim, frameValue = 0) {
  if (!anim) return null;

  const frameWidth = anim.frameWidth || FRAME_W;
  const frameHeight = anim.frameHeight || FRAME_H;
  const columns = anim.columns || anim.frames || 1;
  const startFrame = anim.startFrame || 0;
  const frame = startFrame + Math.min(Math.floor(frameValue), anim.frames - 1);

  return {
    sx: (frame % columns) * frameWidth,
    sy: Math.floor(frame / columns) * frameHeight,
    sw: frameWidth,
    sh: frameHeight
  };
}

function drawSpriteFrame(renderCtx, img, frameMeta, dx, dy, dw, dh, facing = 1) {
  if (!renderCtx || !img || !frameMeta) return;

  renderCtx.save();

  if (facing === -1) {
    renderCtx.translate(dx + dw, 0);
    renderCtx.scale(-1, 1);
    renderCtx.drawImage(img, frameMeta.sx, frameMeta.sy, frameMeta.sw, frameMeta.sh, 0, dy, dw, dh);
  } else {
    renderCtx.drawImage(img, frameMeta.sx, frameMeta.sy, frameMeta.sw, frameMeta.sh, dx, dy, dw, dh);
  }

  renderCtx.restore();
}

function drawDashTrail(fighter, img, frameMeta, dx, dy, dw, dh) {
  if (!isDashActive(fighter) && fighter.dashBurstTimer <= 0) return;

  const reducedEffects = isMobilePerformanceMode() || !vrState.active;
  const direction = fighter.dashDirection || fighter.facing || 1;
  const strength = Math.max(
    fighter.dashTimer / DASH_DURATION_FRAMES,
    fighter.dashBurstTimer / 6
  );
  const trailColor =
    fighter.characterId === "arcanist"
      ? "255, 152, 92"
      : fighter === player
        ? "110, 215, 255"
        : "255, 116, 110";

  ctx.save();
  ctx.globalCompositeOperation = reducedEffects ? "source-over" : "lighter";

  if (!reducedEffects) {
    const burstStrength = fighter.dashBurstTimer > 0 ? fighter.dashBurstTimer / 6 : 0;
    const coreX = direction === 1 ? dx + dw * 0.14 : dx + dw * 0.86;
    const burstGradient = ctx.createRadialGradient(
      coreX,
      dy + dh * 0.56,
      6,
      coreX,
      dy + dh * 0.56,
      42 + burstStrength * 36
    );
    burstGradient.addColorStop(0, `rgba(${trailColor}, ${0.24 + burstStrength * 0.2})`);
    burstGradient.addColorStop(0.55, `rgba(${trailColor}, ${0.11 * strength})`);
    burstGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = burstGradient;
    ctx.beginPath();
    ctx.ellipse(coreX, dy + dh * 0.56, 48 + burstStrength * 34, 18 + burstStrength * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const gradient = ctx.createLinearGradient(
    dx + (direction === 1 ? dw : 0),
    dy + dh * 0.48,
    dx - direction * ((reducedEffects ? 54 : 72) + strength * (reducedEffects ? 22 : 34)),
    dy + dh * 0.48
  );
  gradient.addColorStop(0, `rgba(${trailColor}, ${(reducedEffects ? 0.16 : 0.2) * strength})`);
  gradient.addColorStop(0.4, `rgba(${trailColor}, ${(reducedEffects ? 0.08 : 0.12) * strength})`);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(dx - 20, dy + dh * 0.24, dw + 40, dh * 0.48);

  if (!reducedEffects) {
    const groundY = dy + dh * 0.93;
    const floorGradient = ctx.createLinearGradient(
      dx + (direction === 1 ? dw * 0.2 : dw * 0.8),
      groundY,
      dx - direction * (88 + strength * 36),
      groundY
    );
    floorGradient.addColorStop(0, `rgba(${trailColor}, ${0.18 * strength})`);
    floorGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = floorGradient;
    ctx.fillRect(dx - 12, groundY - 6, dw + 24, 10);
  }

  const ghostCount = reducedEffects ? 2 : 4;
  for (let i = 1; i <= ghostCount; i++) {
    const ghostScale = 1 - i * 0.04;
    const ghostW = dw * ghostScale;
    const ghostH = dh * (1 - i * 0.02);
    const ghostX = dx - direction * i * (reducedEffects ? 14 + i * 4 : 18 + i * 6);
    const ghostY = dy + i * 1.5;
    ctx.globalAlpha = Math.max(0, ((reducedEffects ? 0.18 : 0.24) - i * 0.04) * strength);
    drawSpriteFrame(
      ctx,
      img,
      frameMeta,
      ghostX,
      ghostY,
      ghostW,
      ghostH,
      fighter.facing
    );
  }

  ctx.restore();
}

  function setState(fighter, newState, force = false) {
    if (fighter.state !== newState || force) {
      fighter.state = newState;
      fighter.frameIndex = 0;
      fighter.frameTick = 0;
      fighter.hitDone = false;
    }
  }

  function isDashActive(fighter) {
    return fighter.dashTimer > 0;
  }

  function cancelDash(fighter, preserveVelocity = false) {
    fighter.dashTimer = 0;
    fighter.dashDirection = 0;
    fighter.dashBurstTimer = 0;

    if (!preserveVelocity) {
      fighter.vx *= 0.4;
      if (Math.abs(fighter.vx) < 0.05) fighter.vx = 0;
    }
  }

  function canAttack(fighter) {
    return !fighter.isDead && !fighter.attackLocked && !fighter.isBlocking && !isDashActive(fighter) && !roundOver && !matchOver && !deathFlow.active && !roundIntro.active;
  }

  function resetDeathFlow() {
    deathFlow.active = false;
    deathFlow.winner = null;
    deathFlow.target = null;
    deathFlow.waitingForAnim = false;
    deathFlow.timer = 0;
  }

  function resetFighter(fighter, x, facing, data, aiControlled = false) {
    fighter.width = data.hitbox?.width || 56;
    fighter.height = data.hitbox?.height || 112;
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
  fighter.characterData = data;
  fighter.aiControlled = aiControlled;
  fighter.aiState = "idle";
  fighter.aiDecisionTimer = 0;
  fighter.aiActionTimer = 0;
  fighter.aiAttackCooldown = 0;
  fighter.aiJumpCooldown = 0;
  fighter.aiMoveSpeed = 0;
  fighter.aiStrafeBias = Math.random() < 0.5 ? -1 : 1;
  fighter.dashTimer = 0;
  fighter.dashCooldown = 0;
  fighter.dashDirection = 0;
  fighter.airDashUsed = false;
  fighter.dashBurstTimer = 0;
}

  function getEnemyCharacterForSelection() {
    return characters.find(c => c.id !== selectedCharacter.id) || characters[0];
  }

function startNewMatch(enemyCharacterOverride = null) {
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
  resetRoundIntro();
  stopRoundKoAudio();
  stopRoundIntroAudio();
  resetDeathFlow();

    const enemyCharacter = enemyCharacterOverride || getCpuMatchCharacter();
    cpuSelection.lockedId = enemyCharacter?.id || null;
    cpuSelection.previewId = cpuSelection.lockedId;

    resetFighter(player, 180, 1, selectedCharacter, false);
    resetFighter(enemy, 1040, -1, enemyCharacter, true);

    updateUI();
    setMessage(`Round ${gameState.round}`);
    setScreen("fight");
    beginRoundIntro();
  }

function nextRound() {
  roundOver = false;
  hitstop = 0;
  clearKeys();
  resetRoundTransition();
  resetRoundIntro();
  stopRoundKoAudio();
  stopRoundIntroAudio();
  resetDeathFlow();

    resetFighter(player, 180, 1, selectedCharacter, false);
    const enemyCharacter = characters.find(c => c.id === enemy.characterId) || getEnemyCharacterForSelection();
    resetFighter(enemy, 1040, -1, enemyCharacter, true);

    updateUI();
    setMessage(`Round ${gameState.round}`);
    beginRoundIntro();
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
        applySelectedCharacter(char, true);
      });

      characterGrid.appendChild(card);
      drawCharacterPreview(previewCanvas, char);
    });

    if (!selectedCharacter && characters.length > 0) {
      selectedCharacter = characters[0];
      selectedCharacterId = characters[0].id;
    }

    syncSelectionActions();
    syncSelectionCardStates();
    updateCharacterSelectShowcase();
  }

  function drawCharacterPreview(previewCanvas, char) {
    const pctx = previewCanvas.getContext("2d");
    pctx.imageSmoothingEnabled = false;

    const img = assets[char.preview];
    const previewAnim = char.anim?.idle;
    if (!img) return;
    if (!previewAnim) return;

    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pctx.fillStyle = "#0a1020";
    pctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    const frameMeta = getAnimFrameMeta(previewAnim, previewAnim.holdFrame ?? 0);
    const targetHeight = previewCanvas.height * 0.78;
    const scale = targetHeight / frameMeta.sh;
    const dw = frameMeta.sw * scale;
    const dh = frameMeta.sh * scale;

    drawSpriteFrame(
      pctx,
      img,
      frameMeta,
      previewCanvas.width / 2 - dw / 2,
      previewCanvas.height / 2 - dh / 2 + 10,
      dw,
      dh,
      1
    );
  }

  function getCpuPreviewCharacter() {
    const preferredId = cpuSelection.previewId || cpuSelection.lockedId;
    if (!preferredId) return null;
    return getCharacterById(preferredId);
  }

  function drawShowcaseCharacter(previewCanvas, char, facing = 1, elapsed = 0) {
    if (!previewCanvas) return;

    const pctx = previewCanvas.getContext("2d");
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (!char) {
      drawQuestionMarkShowcase(previewCanvas);
      return;
    }

    const img = assets[char.preview];
    const idleAnim = char.anim?.idle;
    if (!img) return;
    if (!idleAnim) return;

    const idleFrame = idleAnim.frames > 1
      ? Math.floor((elapsed * idleAnim.speed * 0.06) % idleAnim.frames)
      : idleAnim.holdFrame ?? 0;
    const frameMeta = getAnimFrameMeta(idleAnim, idleFrame);
    const targetHeight = previewCanvas.height * 0.78;
    const scale = targetHeight / frameMeta.sh;
    const dw = frameMeta.sw * scale;
    const dh = frameMeta.sh * scale;
    const dx = previewCanvas.width / 2 - dw / 2;
    const dy = previewCanvas.height / 2 - dh / 2 + 22;

    drawSpriteFrame(pctx, img, frameMeta, dx, dy, dw, dh, facing);
  }

  function updateCharacterSelectShowcase() {
  const playerChar = selectedCharacter || characters[0];
  const cpuChar = getCpuPreviewCharacter();

    if (playerSelectName) {
      playerSelectName.textContent = playerChar ? playerChar.name : "ESCOLHA";
    }

  if (enemySelectName) {
    enemySelectName.textContent = cpuChar ? cpuChar.name : "???";
  }

  if (playerSelectDesc) {
    playerSelectDesc.textContent = playerChar ? playerChar.description : "Selecione seu lutador para ver os detalhes.";
  }

  if (enemySelectDesc) {
    enemySelectDesc.textContent = cpuSelection.spinning
      ? "CPU escolhendo rival aleatoriamente..."
      : cpuChar
        ? cpuChar.description
        : "O rival da CPU sera revelado so depois do sorteio.";
  }

  renderStatChips(playerSelectStats, playerChar?.stats);
  renderStatChips(enemySelectStats, cpuChar?.stats);
  syncSelectionCardStates();
  syncSelectionActions();

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

function getCpuMatchCharacter() {
  const selectable = getCpuSelectableCharacters();
  if (selectable.length === 0) return selectedCharacter || characters[0];

  return getCharacterById(cpuSelection.lockedId) || selectable[0];
}

function runCpuSelectionRoulette() {
  if (!selectedCharacter || cpuSelection.spinning) return;

  const roster = getCpuCandidateRoster();
  const selectable = getCpuSelectableCharacters();
  if (roster.length === 0 || selectable.length === 0) {
    startNewMatch();
    return;
  }

  const currentCpu = getCpuPreviewCharacter();
  let cursor = Math.max(0, roster.findIndex((char) => char.id === currentCpu?.id));
  const finalChar = selectable[Math.floor(Math.random() * selectable.length)];
  const finalIndex = Math.max(0, roster.findIndex((char) => char.id === finalChar.id));
  const cycles = 2 + Math.floor(Math.random() * 2);
  let totalSteps = cycles * roster.length + ((finalIndex - cursor + roster.length) % roster.length);

  if (totalSteps <= 0) {
    totalSteps = roster.length;
  }

  cpuSelection.spinning = true;
  cpuSelection.lockedId = null;
  cpuSelection.previewId = currentCpu?.id || roster[0].id;
  cpuRouletteStep = 0;
  syncSelectionActions();
  syncSelectionCardStates();
  updateCharacterSelectShowcase();

  const spinStep = () => {
    if (!cpuSelection.spinning) return;

    cursor = (cursor + 1) % roster.length;
    cpuRouletteStep += 1;
    cpuSelection.previewId = roster[cursor].id;
    playSelectClickAudio();
    syncSelectionCardStates();
    updateCharacterSelectShowcase();

    if (cpuRouletteStep >= totalSteps) {
      cpuSelection.spinning = false;
      cpuSelection.lockedId = finalChar.id;
      cpuSelection.previewId = finalChar.id;
      cpuSelection.timerId = null;
      syncSelectionActions();
      syncSelectionCardStates();
      updateCharacterSelectShowcase();
      startNewMatch(finalChar);
      return;
    }

    const progress = cpuRouletteStep / totalSteps;
    const delay = Math.round(60 + progress * progress * 170);
    cpuSelection.timerId = setTimeout(spinStep, delay);
  };

  cpuSelection.timerId = setTimeout(spinStep, 100);
}

  function requestFullscreenGame() {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  function updateVrButtonState() {
    if (!vrToggleButton) return;

    vrToggleButton.classList.toggle("is-active", vrState.active);

    if (vrState.active) {
      vrToggleButton.disabled = false;
      vrToggleButton.textContent = "Sair RV";
      return;
    }

    if (!vrState.supportChecked) {
      vrToggleButton.disabled = true;
      vrToggleButton.textContent = "Verificando RV";
      return;
    }

    if (!vrState.supported) {
      vrToggleButton.disabled = true;
      vrToggleButton.textContent = "RV indisponivel";
      return;
    }

    if (gameState.screen !== "fight") {
      vrToggleButton.disabled = true;
      vrToggleButton.textContent = "RV no combate";
      return;
    }

    vrToggleButton.disabled = false;
    vrToggleButton.textContent = "Entrar RV";
  }

  async function detectVrSupport() {
    vrState.supportChecked = true;
    vrState.supported = false;

    if (!window.isSecureContext || !("xr" in navigator) || typeof navigator.xr?.isSessionSupported !== "function") {
      updateVrButtonState();
      return;
    }

    try {
      vrState.supported = await navigator.xr.isSessionSupported("immersive-vr");
    } catch {
      vrState.supported = false;
    }

    updateVrButtonState();
  }

  function createVrShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function createVrProgram(gl) {
    const vertexShader = createVrShader(
      gl,
      gl.VERTEX_SHADER,
      `
      attribute vec3 aPosition;
      attribute vec2 aUv;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uModelMatrix;
      varying vec2 vUv;

      void main() {
        vUv = aUv;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
      }
      `
    );
    const fragmentShader = createVrShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uTexture;

      void main() {
        gl_FragColor = texture2D(uTexture, vUv);
      }
      `
    );

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  function createVrScreenModelMatrix() {
    const screenWidth = 3.2;
    const screenHeight = screenWidth * (LOGICAL_HEIGHT / LOGICAL_WIDTH);

    return new Float32Array([
      screenWidth / 2, 0, 0, 0,
      0, screenHeight / 2, 0, 0,
      0, 0, 1, 0,
      0, 1.55, -2.5, 1
    ]);
  }

  function destroyVrRenderer() {
    const gl = vrState.gl;
    if (gl) {
      if (vrState.texture) gl.deleteTexture(vrState.texture);
      if (vrState.positionBuffer) gl.deleteBuffer(vrState.positionBuffer);
      if (vrState.uvBuffer) gl.deleteBuffer(vrState.uvBuffer);
      if (vrState.indexBuffer) gl.deleteBuffer(vrState.indexBuffer);
      if (vrState.program) gl.deleteProgram(vrState.program);
    }

    vrState.gl = null;
    vrState.layer = null;
    vrState.canvas = null;
    vrState.program = null;
    vrState.positionBuffer = null;
    vrState.uvBuffer = null;
    vrState.indexBuffer = null;
    vrState.texture = null;
    vrState.textureWidth = 0;
    vrState.textureHeight = 0;
    vrState.attributes = null;
    vrState.uniforms = null;
    vrState.modelMatrix = null;
  }

  function initVrRenderer(gl) {
    const program = createVrProgram(gl);
    if (!program) {
      throw new Error("Nao foi possivel criar o renderer RV.");
    }

    const positions = new Float32Array([
      -1, -1, 0,
       1, -1, 0,
       1,  1, 0,
      -1,  1, 0
    ]);
    const uvs = new Float32Array([
      0, 1,
      1, 1,
      1, 0,
      0, 0
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    const positionBuffer = gl.createBuffer();
    const uvBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const texture = gl.createTexture();

    if (!positionBuffer || !uvBuffer || !indexBuffer || !texture) {
      throw new Error("Nao foi possivel preparar os buffers RV.");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    vrState.program = program;
    vrState.positionBuffer = positionBuffer;
    vrState.uvBuffer = uvBuffer;
    vrState.indexBuffer = indexBuffer;
    vrState.texture = texture;
    vrState.attributes = {
      position: gl.getAttribLocation(program, "aPosition"),
      uv: gl.getAttribLocation(program, "aUv")
    };
    vrState.uniforms = {
      projection: gl.getUniformLocation(program, "uProjectionMatrix"),
      view: gl.getUniformLocation(program, "uViewMatrix"),
      model: gl.getUniformLocation(program, "uModelMatrix"),
      texture: gl.getUniformLocation(program, "uTexture")
    };
    vrState.modelMatrix = createVrScreenModelMatrix();
  }

  function updateVrTexture() {
    const gl = vrState.gl;
    const texture = vrState.texture;
    if (!gl || !texture) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (vrState.textureWidth !== canvas.width || vrState.textureHeight !== canvas.height) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      vrState.textureWidth = canvas.width;
      vrState.textureHeight = canvas.height;
      return;
    }

    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  function renderVrFrame(time, frame) {
    const session = frame.session;
    session.requestAnimationFrame(renderVrFrame);

    const pose = frame.getViewerPose(vrState.refSpace);
    if (!pose || !vrState.gl || !vrState.program || !vrState.layer) {
      return;
    }

    const gl = vrState.gl;
    updateVrTexture();

    gl.bindFramebuffer(gl.FRAMEBUFFER, vrState.layer.framebuffer);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.02, 0.04, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(vrState.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, vrState.positionBuffer);
    gl.enableVertexAttribArray(vrState.attributes.position);
    gl.vertexAttribPointer(vrState.attributes.position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vrState.uvBuffer);
    gl.enableVertexAttribArray(vrState.attributes.uv);
    gl.vertexAttribPointer(vrState.attributes.uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vrState.indexBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, vrState.texture);
    gl.uniform1i(vrState.uniforms.texture, 0);
    gl.uniformMatrix4fv(vrState.uniforms.model, false, vrState.modelMatrix);

    for (const view of pose.views) {
      const viewport = vrState.layer.getViewport(view);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      gl.uniformMatrix4fv(vrState.uniforms.projection, false, view.projectionMatrix);
      gl.uniformMatrix4fv(vrState.uniforms.view, false, view.transform.inverse.matrix);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
  }

  function handleVrSessionEnd() {
    vrState.active = false;
    vrState.session = null;
    vrState.refSpace = null;
    destroyVrRenderer();
    updateVrButtonState();
  }

  async function endVrSession() {
    if (!vrState.session) {
      handleVrSessionEnd();
      return;
    }

    const session = vrState.session;
    vrState.session = null;

    try {
      await session.end();
    } catch {}

    handleVrSessionEnd();
  }

  async function startVrSession() {
    if (!vrState.supported || vrState.active || gameState.screen !== "fight") {
      updateVrButtonState();
      return;
    }

    if (!window.isSecureContext || !navigator.xr) {
      vrState.supported = false;
      updateVrButtonState();
      return;
    }

    try {
      const xrCanvas = document.createElement("canvas");
      const gl =
        xrCanvas.getContext("webgl", { alpha: false, antialias: true, xrCompatible: true }) ||
        xrCanvas.getContext("experimental-webgl", { alpha: false, antialias: true, xrCompatible: true });

      if (!gl) {
        throw new Error("WebGL nao disponivel para RV.");
      }

      if (typeof gl.makeXRCompatible === "function") {
        await gl.makeXRCompatible();
      }

      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor"]
      });
      const layer = new XRWebGLLayer(session, gl, { alpha: false, antialias: true });

      session.addEventListener("end", handleVrSessionEnd);
      session.updateRenderState({ baseLayer: layer });

      let refSpace = null;
      try {
        refSpace = await session.requestReferenceSpace("local-floor");
      } catch {
        refSpace = await session.requestReferenceSpace("local");
      }

      vrState.session = session;
      vrState.refSpace = refSpace;
      vrState.gl = gl;
      vrState.layer = layer;
      vrState.canvas = xrCanvas;
      vrState.active = true;

      initVrRenderer(gl);
      updateVrButtonState();
      session.requestAnimationFrame(renderVrFrame);
    } catch {
      handleVrSessionEnd();
    }
  }

  function handleGameKeyDown(e) {
    if (e.__shadowProtocolHandled) return;
    e.__shadowProtocolHandled = true;

    const key = e.key.toLowerCase();
    const wasForcedDesktop = inputMode.forceDesktop;

    registerUserInteraction();

    if (shouldForceDesktopModeForKey(key)) {
      inputMode.forceDesktop = true;
      inputMode.lastPointerType = "keyboard";
      if (!wasForcedDesktop) {
        syncMobileUi();
      }
    }

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
      if (cpuSelection.spinning) {
        return;
      }

      if (key === "escape") {
        setScreen("menu");
        return;
      }

      if (key === "enter" && selectedCharacter) {
        runCpuSelectionRoulette();
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

      applySelectedCharacter(characters[nextIndex]);
      return;
    }

    // FIGHT
    if (gameState.screen !== "fight") return;
    if (roundOver || matchOver || deathFlow.active || roundIntro.active) return;

    if (key === "escape") {
      setScreen("menu");
      return;
    }

    if (!e.repeat && key === "control") {
      triggerPlayerDashFromInput();
      return;
    }

    if (
      (key === " " || key === "w" || key === "arrowup") &&
      player.onGround &&
      !player.attackLocked &&
      !player.isBlocking
    ) {
      triggerPlayerJump();
    }

    if (key === "j" && canAttack(player)) startAttack(player, "attack1");
    if (key === "k" && canAttack(player)) startAttack(player, "attack2");
    if (key === "l" && canAttack(player)) startAttack(player, "attack3");
  }

  function handleGameKeyUp(e) {
    if (e.__shadowProtocolHandled) return;
    e.__shadowProtocolHandled = true;

    const key = e.key.toLowerCase();
    keys[key] = false;
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
  }

  document.addEventListener("keydown", handleGameKeyDown, true);
  window.addEventListener("keydown", handleGameKeyDown);
  document.addEventListener("keyup", handleGameKeyUp, true);
  window.addEventListener("keyup", handleGameKeyUp);

  ["copy", "cut", "paste", "selectstart"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    });
  });

  window.addEventListener("blur", () => {
    clearKeys();
  });

  window.addEventListener("pointerdown", (event) => {
    registerUserInteraction();

    if (!event.pointerType) return;

    inputMode.lastPointerType = event.pointerType;

    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      if (!inputMode.forceDesktop) {
        inputMode.forceDesktop = true;
        syncMobileUi();
      }
      return;
    }

    if (event.pointerType === "touch" && inputMode.forceDesktop && isLikelyMobileDevice()) {
      inputMode.forceDesktop = false;
      syncMobileUi();
    }
  });

  if (mobileJoystickArea) {
    mobileJoystickArea.addEventListener("pointerdown", (event) => {
      if (!isMobileFightControlsEnabled()) return;
      if (touchControls.joystickPointerId !== null) return;
      event.preventDefault();
      touchControls.joystickPointerId = event.pointerId;
      mobileJoystickArea.setPointerCapture(event.pointerId);
      updateTouchJoystickFromPointer(event.clientX, event.clientY);
    });

    mobileJoystickArea.addEventListener("pointermove", (event) => {
      if (event.pointerId !== touchControls.joystickPointerId) return;
      event.preventDefault();
      updateTouchJoystickFromPointer(event.clientX, event.clientY);
    });

    const releaseJoystick = (event) => {
      if (event.pointerId !== touchControls.joystickPointerId) return;
      event.preventDefault();
      touchControls.joystickPointerId = null;
      touchControls.moveX = 0;
      touchControls.moveY = 0;
      touchControls.run = false;
      updateJoystickVisual();
    };

    mobileJoystickArea.addEventListener("pointerup", releaseJoystick);
    mobileJoystickArea.addEventListener("pointercancel", releaseJoystick);
    mobileJoystickArea.addEventListener("lostpointercapture", releaseJoystick);
  }

  function bindTouchButton(button, onPress, onRelease = null) {
    if (!button) return;

    const release = (event) => {
      button.classList.remove("is-pressed");
      if (onRelease) onRelease(event);
    };

    button.addEventListener("pointerdown", (event) => {
      if (!isMobileFightControlsEnabled()) return;
      event.preventDefault();
      button.classList.add("is-pressed");
      button.setPointerCapture(event.pointerId);
      onPress(event);
    });

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  }

  bindTouchButton(mobileJumpButton, () => {
    triggerTouchCombatAction("jump");
  });

  bindTouchButton(mobileAttack1Button, () => {
    triggerTouchCombatAction("attack1");
  });

  bindTouchButton(mobileAttack2Button, () => {
    triggerTouchCombatAction("attack2");
  });

  bindTouchButton(mobileAttack3Button, () => {
    triggerTouchCombatAction("attack3");
  });

  bindTouchButton(
    mobileBlockButton,
    () => {
      if (!isMobileFightControlsEnabled()) return;
      touchControls.blockPressed = true;
    },
    () => {
      touchControls.blockPressed = false;
    }
  );

  bindTouchButton(mobileDashButton, () => {
    triggerTouchCombatAction("dash");
  });

  bindTouchButton(mobileMenuButton, () => {
    triggerTouchCombatAction("menu");
  });

  function startAttack(fighter, type) {
    fighter.attackLocked = true;
    fighter.isBlocking = false;
    fighter.attackData = createAttackData(type, fighter);
    fighter.attackFrame = 0;
    fighter.hitDone = false;
    if (type === "attack1" || type === "attack2" || type === "attack3") {
      if (type === "attack1") {
        playSwordSlashAudio();
      } else if (fighter.characterId === "arcanist" && (type === "attack2" || type === "attack3")) {
        playMageFlameAudio();
      } else if (fighter.characterId !== "arcanist") {
        playSwordSlashAudio();
      }
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
      fighter.airDashUsed = false;
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

  function isTryingToCrossOver(a, b) {
    if (a.onGround && b.onGround) return false;

    const aCenterY = a.y + a.height / 2;
    const bCenterY = b.y + b.height / 2;
    const verticalGap = Math.abs(aCenterY - bCenterY);

    return verticalGap > 20;
  }

  function separateFighters() {
    const a = getRect(player);
    const b = getRect(enemy);

    if (!intersects(a, b)) return;
    if (isTryingToCrossOver(player, enemy) || isTryingToCrossOver(enemy, player)) return;

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
    return !fighter.isBlocking && !fighter.attackLocked && !fighter.isDead && fighter.hurtTimer <= 0 && !isDashActive(fighter);
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
      !isDashActive(player) &&
      player.onGround &&
      !deathFlow.active &&
      (keys["s"] || keys["arrowdown"] || touchControls.blockPressed);

    if (player.isBlocking) {
      player.vx *= 0.65;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
      setState(player, "block");
    }

    const dist = Math.abs(player.x - enemy.x);
    const shouldEnemyBlock =
      !enemy.isDead &&
      !enemy.attackLocked &&
      !isDashActive(enemy) &&
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
      cancelDash(player, true);
      player.vx *= 0.84;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
      return;
    }

    if (updateDashMovement(player, DASH_SPEED)) {
      return;
    }

    const { left, right, running } = getPlayerInputState();

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

  function triggerJump(fighter, horizontalBoost = 0) {
    if (!fighter.onGround || fighter.attackLocked || fighter.isBlocking || fighter.isDead || isDashActive(fighter)) return false;

    fighter.vy = JUMP_FORCE;
    fighter.vx += horizontalBoost;
    fighter.onGround = false;
    setState(fighter, "jump", true);
    return true;
  }

  function triggerPlayerJump() {
    const { left, right, running } = getPlayerInputState();
    const moveDir = (right ? 1 : 0) - (left ? 1 : 0);

    if (moveDir !== 0) {
      player.vx = moveDir * (running ? 4.2 : 3.2);
    }

    triggerJump(player);
  }

  function updateDashMovement(fighter, dashSpeed = DASH_SPEED) {
    if (fighter.dashCooldown > 0) {
      fighter.dashCooldown--;
    }

    if (fighter.dashBurstTimer > 0) {
      fighter.dashBurstTimer--;
    }

    if (!isDashActive(fighter)) {
      return false;
    }

    const dashProgress = fighter.dashTimer / DASH_DURATION_FRAMES;
    const activeDashSpeed = !fighter.onGround && fighter.airDashUsed ? AIR_DASH_SPEED : dashSpeed;
    fighter.vx = fighter.dashDirection * activeDashSpeed * (0.84 + dashProgress * 0.28);
    fighter.dashTimer--;
    setState(fighter, "dash");

    if (fighter.dashTimer <= 0) {
      fighter.dashTimer = 0;
      fighter.dashDirection = 0;
      fighter.vx *= 0.82;
    }

    return true;
  }

  function triggerDash(fighter, direction, dashSpeed = DASH_SPEED) {
    const canAirDash = fighter === player && !fighter.onGround && !fighter.airDashUsed;

    if (
      !direction ||
      fighter.isDead ||
      fighter.isBlocking ||
      fighter.attackLocked ||
      fighter.hurtTimer > 0 ||
      isDashActive(fighter) ||
      fighter.dashCooldown > 0 ||
      (!fighter.onGround && !canAirDash) ||
      roundOver ||
      matchOver ||
      deathFlow.active ||
      roundIntro.active
    ) {
      return false;
    }

    fighter.dashDirection = direction;
    fighter.dashTimer = DASH_DURATION_FRAMES;
    fighter.dashCooldown = DASH_COOLDOWN_FRAMES;
    fighter.dashBurstTimer = 6;
    fighter.vx = direction * (canAirDash ? AIR_DASH_SPEED : dashSpeed);

    if (canAirDash) {
      fighter.airDashUsed = true;
      fighter.vy = Math.min(fighter.vy * 0.25, 0.8);
    }

    setState(fighter, "dash", true);
    return true;
  }

  function triggerPlayerDashFromInput(direction = 0) {
    const { left, right } = getPlayerInputState();
    const intendedDirection = direction || (right ? 1 : 0) - (left ? 1 : 0) || player.facing;
    return triggerDash(player, intendedDirection, DASH_SPEED);
  }

  function approachValue(current, target, step) {
    if (current < target) return Math.min(current + step, target);
    if (current > target) return Math.max(current - step, target);
    return target;
  }

  function updateEnemyAI() {
    if (enemy.isDead || enemy.isBlocking || deathFlow.active) {
      cancelDash(enemy, true);
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
    const midRange = absDist >= 135 && absDist < 230;
    const far = absDist > 250;
    const moveDir = distX === 0 ? 0 : distX > 0 ? 1 : -1;

    if (enemy.aiDecisionTimer <= 0) {
      enemy.aiDecisionTimer = 18 + Math.floor(Math.random() * 26);

      if (playerAttacking && close && Math.random() < 0.44) {
        enemy.aiState = "retreat";
        enemy.aiActionTimer = 12 + Math.floor(Math.random() * 20);
        enemy.aiMoveSpeed = 0.95 + Math.random() * 0.18;
      } else if (veryClose && Math.random() < (lowHealth ? 0.55 : 0.3)) {
        enemy.aiState = "retreat";
        enemy.aiActionTimer = 12 + Math.floor(Math.random() * 18);
        enemy.aiMoveSpeed = 0.88 + Math.random() * 0.18;
      } else if (far) {
        enemy.aiState = Math.random() < 0.72 ? "approach" : "wait";
        enemy.aiActionTimer = 18 + Math.floor(Math.random() * 20);
        enemy.aiMoveSpeed = enemy.aiState === "approach"
          ? 1.12 + Math.random() * 0.16
          : 0;
      } else if (midRange) {
        const roll = Math.random();
        if (roll < 0.26) {
          enemy.aiState = "hold-range";
          enemy.aiActionTimer = 12 + Math.floor(Math.random() * 18);
          enemy.aiMoveSpeed = 0.78 + Math.random() * 0.08;
        } else if (roll < 0.42) {
          enemy.aiState = "wait";
          enemy.aiActionTimer = 10 + Math.floor(Math.random() * 18);
          enemy.aiMoveSpeed = 0;
        } else if (roll < 0.62) {
          enemy.aiState = "strafe";
          enemy.aiActionTimer = 12 + Math.floor(Math.random() * 16);
          enemy.aiMoveSpeed = 0.7 + Math.random() * 0.08;
          if (Math.random() < 0.5) enemy.aiStrafeBias *= -1;
        } else {
          enemy.aiState = "approach";
          enemy.aiActionTimer = 14 + Math.floor(Math.random() * 16);
          enemy.aiMoveSpeed = 0.98 + Math.random() * 0.12;
        }
      } else if (close) {
        const roll = Math.random();
        if (roll < 0.26) {
          enemy.aiState = "wait";
          enemy.aiActionTimer = 8 + Math.floor(Math.random() * 16);
          enemy.aiMoveSpeed = 0;
        } else if (roll < 0.52) {
          enemy.aiState = "strafe";
          enemy.aiActionTimer = 12 + Math.floor(Math.random() * 18);
          enemy.aiMoveSpeed = 0.64 + Math.random() * 0.08;
          if (Math.random() < 0.5) enemy.aiStrafeBias *= -1;
        } else if (roll < 0.7) {
          enemy.aiState = "retreat";
          enemy.aiActionTimer = 10 + Math.floor(Math.random() * 14);
          enemy.aiMoveSpeed = 0.84 + Math.random() * 0.12;
        } else {
          enemy.aiState = "pressure";
          enemy.aiActionTimer = 12 + Math.floor(Math.random() * 12);
          enemy.aiMoveSpeed = 0.96 + Math.random() * 0.12;
        }
      } else {
        enemy.aiState = Math.random() < 0.58 ? "approach" : "hold-range";
        enemy.aiActionTimer = 14 + Math.floor(Math.random() * 20);
        enemy.aiMoveSpeed = enemy.aiState === "approach"
          ? 1.02 + Math.random() * 0.14
          : 0.78 + Math.random() * 0.08;
      }
    }

    let targetVX = 0;

    if (enemy.aiState === "wait") {
      targetVX = 0;
    } else if (enemy.aiState === "hold-range") {
      const desiredDir = absDist < 170 ? -moveDir : moveDir;
      targetVX = desiredDir * enemy.aiMoveSpeed;
    } else if (enemy.aiState === "retreat") {
      targetVX = -moveDir * enemy.aiMoveSpeed;
    } else if (enemy.aiState === "strafe") {
      targetVX = enemy.aiStrafeBias * enemy.aiMoveSpeed;

      if (absDist > 170) {
        targetVX = moveDir * Math.max(enemy.aiMoveSpeed, 0.82);
      }
    } else if (enemy.aiState === "pressure") {
      targetVX = moveDir * enemy.aiMoveSpeed;
    } else {
      targetVX = moveDir * enemy.aiMoveSpeed;
    }

    const enemyAccel = enemy.onGround ? 0.12 : 0.06;
    enemy.vx = approachValue(enemy.vx, targetVX, enemyAccel);

    if (Math.abs(targetVX) < 0.01) {
      enemy.vx *= enemy.onGround ? 0.8 : 0.94;
    }

    if (Math.abs(enemy.vx) < 0.05) enemy.vx = 0;

    if (enemy.aiAttackCooldown <= 0 && close && enemy.onGround && !player.isDead) {
      const attackRoll = Math.random();

      if (veryClose && attackRoll < 0.05) {
        startAttack(enemy, lowHealth ? "attack2" : "attack1");
        enemy.aiAttackCooldown = 26 + Math.floor(Math.random() * 18);
        enemy.aiState = "wait";
        enemy.aiActionTimer = 12;
      } else if (absDist < 118 && attackRoll < 0.026) {
        startAttack(enemy, Math.random() < 0.24 ? "attack3" : "attack2");
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
    cancelDash(target, true);
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
      if (isDashActive(player)) setState(player, "dash");
      else if (!player.onGround) setState(player, "jump");
      else if (Math.abs(player.vx) > 2.8) setState(player, "run");
      else if (Math.abs(player.vx) > 0.15) setState(player, "walk");
      else setState(player, "idle");
    }

  if (!enemy.attackLocked && !enemy.isDead && !enemy.isBlocking && enemy.hurtTimer <= 0) {
    if (isDashActive(enemy)) setState(enemy, "dash");
    else if (!enemy.onGround) setState(enemy, "jump");
    else if (Math.abs(enemy.vx) > 0.22) setState(enemy, "walk");
    else setState(enemy, "idle");
  }
}

  function updateAnimation(fighter) {
    if (!fighter.animSet) return;

    const anim = fighter.animSet[fighter.state];
    if (!anim) return;

    if (fighter.state === "block") {
      fighter.frameIndex = anim.holdFrame ?? 0;
      fighter.frameTick = 0;
      return;
    }

    fighter.frameTick += anim.speed;

    if (fighter.frameTick >= 1) {
      fighter.frameTick = 0;
      fighter.frameIndex += 1;

      if (fighter.frameIndex >= anim.frames) {
        if (["idle", "walk", "run", "dash", "block"].includes(fighter.state)) {
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

  function rebuildBackgroundCache() {
    const mode = isMobilePerformanceMode() ? "mobile" : "desktop";
    const bg = assets[stage.background];

    if (
      backgroundCache.canvas &&
      backgroundCache.mode === mode &&
      backgroundCache.background === stage.background
    ) {
      return;
    }

    const cacheCanvas = document.createElement("canvas");
    cacheCanvas.width = LOGICAL_WIDTH;
    cacheCanvas.height = LOGICAL_HEIGHT;

    const cacheCtx = cacheCanvas.getContext("2d");
    cacheCtx.imageSmoothingEnabled = false;

    if (bg) {
      cacheCtx.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    } else {
      cacheCtx.fillStyle = "#0d1320";
      cacheCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }

    cacheCtx.fillStyle = "rgba(0,0,0,0.18)";
    cacheCtx.fillRect(0, FLOOR_Y, LOGICAL_WIDTH, LOGICAL_HEIGHT - FLOOR_Y);

    if (mode === "mobile") {
      cacheCtx.fillStyle = "rgba(0,0,0,0.16)";
      cacheCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    } else {
      const grad = cacheCtx.createRadialGradient(
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT / 2,
        120,
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT / 2,
        LOGICAL_WIDTH * 0.65
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.48)");
      cacheCtx.fillStyle = grad;
      cacheCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }

    backgroundCache.canvas = cacheCanvas;
    backgroundCache.mode = mode;
    backgroundCache.background = stage.background;
  }

  function drawBackground() {
    ctx.setTransform(renderState.scale, 0, 0, renderState.scale, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    rebuildBackgroundCache();

    if (backgroundCache.canvas) {
      ctx.drawImage(backgroundCache.canvas, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  function drawFighter(fighter) {
    if (!fighter.spriteSet || !fighter.animSet) return;

    const stateKey =
      fighter.state in fighter.spriteSet
        ? fighter.state
        : fighter.state === "dash"
          ? "run"
          : "idle";
    const img = assets[fighter.spriteSet[stateKey]];
    const anim =
      fighter.animSet[fighter.state] ||
      fighter.animSet[stateKey] ||
      fighter.animSet.idle;

    if (!img || !anim) return;

    const frameIndex = anim.frames > 1
      ? Math.min(Math.floor(fighter.frameIndex), anim.frames - 1)
      : anim.holdFrame ?? 0;
    const frameMeta = getAnimFrameMeta(anim, frameIndex);
    const drawHeight = fighter.characterData?.drawHeight || FRAME_H * SCALE;
    const scale = drawHeight / frameMeta.sh;
    const dashVisual = isDashActive(fighter) ? fighter.dashTimer / DASH_DURATION_FRAMES : 0;
    const stretchX = 1 + dashVisual * 0.16;
    const stretchY = 1 - dashVisual * 0.08;
    const dw = frameMeta.sw * scale * stretchX;
    const dh = frameMeta.sh * scale * stretchY;
    const dx = fighter.x - (dw - fighter.width) / 2 + fighter.dashDirection * dashVisual * 8;
    const dy = fighter.y - (dh - fighter.height) + dashVisual * 8;

    drawDashTrail(fighter, img, frameMeta, dx, dy, dw, dh);
    drawSpriteFrame(ctx, img, frameMeta, dx, dy, dw, dh, fighter.facing);
  }

  function drawHealthBars() {
    const barW = 360;
    const barH = 28;
    const topY = 26;
    const leftX = 28;
    const rightX = LOGICAL_WIDTH - barW - 28;

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

  function drawVrHud() {
    if (!vrState.active) return;

    const panelY = 18;
    const panelW = 338;
    const panelH = 94;
    const portraitSize = 68;
    const leftX = 20;
    const rightX = LOGICAL_WIDTH - panelW - 20;
    const barWidth = 226;
    const barHeight = 14;
    const playerRatio = player.maxHealth ? Math.max(0, player.health / player.maxHealth) : 0;
    const enemyRatio = enemy.maxHealth ? Math.max(0, enemy.health / enemy.maxHealth) : 0;

    ctx.save();
    ctx.fillStyle = "rgba(4, 10, 18, 0.76)";
    ctx.fillRect(leftX, panelY, panelW, panelH);
    ctx.fillRect(rightX, panelY, panelW, panelH);

    ctx.strokeStyle = "rgba(255, 241, 201, 0.24)";
    ctx.lineWidth = 2;
    ctx.strokeRect(leftX, panelY, panelW, panelH);
    ctx.strokeRect(rightX, panelY, panelW, panelH);

    if (playerPortraitCanvas) {
      ctx.drawImage(playerPortraitCanvas, leftX + 12, panelY + 12, portraitSize, portraitSize);
    }

    if (enemyPortraitCanvas) {
      ctx.drawImage(enemyPortraitCanvas, rightX + panelW - portraitSize - 12, panelY + 12, portraitSize, portraitSize);
    }

    ctx.fillStyle = "#9eb2c9";
    ctx.font = "700 14px Barlow, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("JOGADOR", leftX + 94, panelY + 24);

    ctx.fillStyle = "#fff1c9";
    ctx.font = "36px Bebas Neue, Impact, sans-serif";
    ctx.fillText(player.name || "PLAYER", leftX + 94, panelY + 58);

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(leftX + 94, panelY + 68, barWidth, barHeight);
    ctx.fillStyle = "#74f0cf";
    ctx.fillRect(leftX + 94, panelY + 68, barWidth * playerRatio, barHeight);
    ctx.fillStyle = "#d0d9e8";
    ctx.font = "700 16px Barlow, sans-serif";
    ctx.fillText(`${player.health} / ${player.maxHealth}`, leftX + 94, panelY + 92);

    ctx.textAlign = "right";
    ctx.fillStyle = "#9eb2c9";
    ctx.font = "700 14px Barlow, sans-serif";
    ctx.fillText("CPU", rightX + panelW - 94, panelY + 24);

    ctx.fillStyle = "#fff1c9";
    ctx.font = "36px Bebas Neue, Impact, sans-serif";
    ctx.fillText(enemy.name || "ENEMY", rightX + panelW - 94, panelY + 58);

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(rightX + 18, panelY + 68, barWidth, barHeight);
    ctx.fillStyle = "#ff8f7d";
    ctx.fillRect(rightX + 18 + barWidth * (1 - enemyRatio), panelY + 68, barWidth * enemyRatio, barHeight);
    ctx.fillStyle = "#d0d9e8";
    ctx.font = "700 16px Barlow, sans-serif";
    ctx.fillText(`${enemy.health} / ${enemy.maxHealth}`, rightX + panelW - 94, panelY + 92);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(4, 10, 18, 0.78)";
    ctx.fillRect(LOGICAL_WIDTH / 2 - 120, 16, 240, 92);
    ctx.strokeStyle = "rgba(255, 241, 201, 0.22)";
    ctx.strokeRect(LOGICAL_WIDTH / 2 - 120, 16, 240, 92);
    ctx.fillStyle = "#fff1c9";
    ctx.font = "40px Bebas Neue, Impact, sans-serif";
    ctx.fillText(`ROUND ${Math.min(gameState.round, 3)}`, LOGICAL_WIDTH / 2, 54);
    ctx.fillStyle = "#ffd98b";
    ctx.font = "700 24px Barlow, sans-serif";
    ctx.fillText(`${gameState.playerWins} x ${gameState.enemyWins}`, LOGICAL_WIDTH / 2, 82);
    ctx.fillStyle = "#9eb2c9";
    ctx.font = "700 14px Barlow, sans-serif";
    ctx.fillText("ESC para menu | RV experimental", LOGICAL_WIDTH / 2, 102);
    ctx.restore();
  }

function drawOverlayCard(title, subtitle, scoreText = "") {
    ctx.save();

    ctx.fillStyle = "rgba(3, 6, 14, 0.58)";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const w = 560;
    const h = 260;
    const x = LOGICAL_WIDTH / 2 - w / 2;
    const y = LOGICAL_HEIGHT / 2 - h / 2;

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
    ctx.fillText(title, LOGICAL_WIDTH / 2, y + 74);

    ctx.fillStyle = "#b8c7e6";
    ctx.font = "20px Arial";
    ctx.fillText(subtitle, LOGICAL_WIDTH / 2, y + 120);

    if (scoreText) {
      ctx.fillStyle = "#eaf2ff";
      ctx.font = "bold 30px Arial";
      ctx.fillText(scoreText, LOGICAL_WIDTH / 2, y + 170);
    }

    ctx.textAlign = "start";
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function drawRoundOverlay() {
    if (roundIntro.active) {
      drawOverlayCard(
        `ROUND ${Math.min(roundIntro.round, 3)}`,
        "A luta comeca quando o anuncio terminar."
      );
      return;
    }

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
      ctx.setTransform(renderState.scale, 0, 0, renderState.scale, 0, 0);
      ctx.textAlign = "center";
      ctx.fillStyle = "#8fd8ff";
      ctx.font = "18px Arial";
      ctx.fillText("Use o botao Revanche ou volte ao Menu", LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 74);
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
  drawFighter(player);
  drawFighter(enemy);
  drawVrHud();
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

    if (roundIntro.active) {
      const introAudio = getRoundIntroAudio(roundIntro.round);
      const audioStillPlaying =
        roundIntro.audioStarted &&
        introAudio &&
        !introAudio.paused &&
        !introAudio.ended &&
        introAudio.currentTime > 0;

      if (roundIntro.timer > 0) {
        roundIntro.timer--;
      }

      if (roundIntro.timer <= 0 && !audioStillPlaying) {
        roundIntro.active = false;
        roundIntro.audioStarted = false;
        stopRoundIntroAudio();
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
    registerUserInteraction();
    requestFullscreenGame();
  });
}

  menuScreen.addEventListener("pointerdown", (event) => {
    registerUserInteraction();
    if (gameState.screen !== "menu") return;
    if (event.target.closest("button")) return;
    setScreen("select");
  });

  backToMenuBtn.addEventListener("click", () => {
    registerUserInteraction();
    playSelectClickAudio();
    setScreen("menu");
  });

  confirmSelectionBtn.addEventListener("click", () => {
    registerUserInteraction();
    if (!selectedCharacter) return;
    playSelectClickAudio();
    runCpuSelectionRoulette();
  });

if (restartMatchBtn) {
  restartMatchBtn.addEventListener("click", () => {
    registerUserInteraction();
    if (!selectedCharacter) return;
    startNewMatch();
  });
}

if (backToMenuFromFightBtn) {
  backToMenuFromFightBtn.addEventListener("click", () => {
    registerUserInteraction();
    setScreen("menu");
  });
}

if (vrToggleButton) {
  vrToggleButton.addEventListener("click", async () => {
    registerUserInteraction();

    if (vrState.active) {
      await endVrSession();
      return;
    }

    await startVrSession();
  });
}

window.addEventListener("resize", syncMobileUi);
window.addEventListener("orientationchange", syncMobileUi);

(async function init() {
  try {
    [menuScreen, selectScreen, fightScreen, document.body].forEach((element) => {
      if (element) {
        element.tabIndex = -1;
      }
    });

    setMessage("Carregando assets...");
    await preloadAssets();
    renderCharacterCards();
    updateUI();
    syncMobileUi();
    syncCanvasResolution(true);
    await detectVrSupport();
    setScreen("menu");
    focusGameSurface();
    setMessage("Pronto.");
    requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Erro ao carregar o jogo.");
    }
  })();

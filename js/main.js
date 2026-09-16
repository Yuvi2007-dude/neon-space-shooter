const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let state = "START";
let score = 0, lives = 3, level = 1;
let highScore = Number(localStorage.getItem("highScore")) || 0;
let bullets = [], enemies = [], particles = [], keys = {};
let lastTime = 0, enemyTimer = 0, shootTimer = 0;
let soundOn = true, audio = null;

const player = {
    x: W / 2 - 30,
    y: H - 80,
    w: 60,
    h: 60,
    speed: 350
};

// Sound
function playSound(freq, duration = 0.05) {
    if (!soundOn) return;
    if (!audio) audio = new AudioContext();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
}

// Keyboard
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === " ") e.preventDefault();
    if (e.key.toLowerCase() === "p") pauseGame();
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// Start / Restart
function startGame() {
    state = "PLAYING";
    score = 0;
    lives = 3;
    level = 1;
    bullets = [];
    enemies = [];
    particles = [];
    enemyTimer = 0;
    shootTimer = 0;

    player.x = W / 2 - player.w / 2;
    player.y = H - 80;

    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("pauseScreen").classList.add("hidden");

    playSound(500);
    updateHUD();
}

function pauseGame() {
    if (state === "PLAYING") {
        state = "PAUSED";
        document.getElementById("pauseScreen").classList.remove("hidden");
    } else if (state === "PAUSED") {
        state = "PLAYING";
        document.getElementById("pauseScreen").classList.add("hidden");
    }
}

// Player movement + auto fire
function updatePlayer(dt) {
    if (keys["a"] || keys["arrowleft"])
        player.x -= player.speed * dt;

    if (keys["d"] || keys["arrowright"])
        player.x += player.speed * dt;

    if (keys["w"] || keys["arrowup"])
        player.y -= player.speed * dt;

    if (keys["s"] || keys["arrowdown"])
        player.y += player.speed * dt;

    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    shootTimer -= dt;

    if (shootTimer <= 0) {
        bullets.push({
            x: player.x + player.w / 2 - 3,
            y: player.y,
            w: 6,
            h: 15,
            speed: 600
        });

        shootTimer = 0.25;
        playSound(700, 0.03);
    }
}

// Enemies
function createEnemy() {
    enemies.push({
        x: Math.random() * (W - 40),
        y: -40,
        w: 40,
        h: 40,
        speed: 100 + level * 15
    });
}

function updateEnemies(dt) {
    enemyTimer -= dt;

    if (enemyTimer <= 0) {
        createEnemy();
        enemyTimer = Math.max(0.3, 1 - level * 0.05);
    }

    enemies.forEach(e => e.y += e.speed * dt);

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].y > H) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) gameOver();
        }
    }
}

// Bullets
function updateBullets(dt) {
    bullets.forEach(b => b.y -= b.speed * dt);
    bullets = bullets.filter(b => b.y > -20);
}

// Collision
function collision(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

// Particles
function createParticles(x, y) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x, y,
            dx: (Math.random() - 0.5) * 150,
            dy: (Math.random() - 0.5) * 150,
            life: 0.4
        });
    }
}

function updateParticles(dt) {
    particles.forEach(p => {
        p.x += p.dx * dt;
        p.y += p.dy * dt;
        p.life -= dt;
    });

    particles = particles.filter(p => p.life > 0);
}

// Collisions
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (collision(bullets[i], enemies[j])) {
                const e = enemies[j];

                createParticles(
                    e.x + e.w / 2,
                    e.y + e.h / 2
                );

                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
                playSound(200, 0.08);
                break;
            }
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (collision(player, enemies[i])) {
            createParticles(
                player.x + player.w / 2,
                player.y + player.h / 2
            );

            enemies.splice(i, 1);
            lives--;
            playSound(100, 0.12);

            if (lives <= 0) gameOver();
        }
    }
}

// Game update
function update(dt) {
    if (state !== "PLAYING") return;

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateParticles(dt);
    checkCollisions();

    level = Math.floor(score / 100) + 1;
    updateHUD();
}

// Draw aircraft
function drawPlayer() {
    ctx.save();

    ctx.translate(
        player.x + player.w / 2,
        player.y + player.h / 2
    );

    ctx.rotate(0);

    ctx.fillStyle = "#00ffff";
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-30, 30);
    ctx.lineTo(0, 15);
    ctx.lineTo(30, 30);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Draw game
function draw() {
    ctx.fillStyle = "#02030a";
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "white";

    for (let i = 0; i < 40; i++) {
        const x = (i * 137) % W;
        const y = (i * 83 + Date.now() * 0.02) % H;
        ctx.fillRect(x, y, 2, 2);
    }

    // Bullets
    ctx.fillStyle = "#ffff00";

    bullets.forEach(b =>
        ctx.fillRect(b.x, b.y, b.w, b.h)
    );

    // Enemies
    ctx.fillStyle = "#ff0055";

    enemies.forEach(e =>
        ctx.fillRect(e.x, e.y, e.w, e.h)
    );

    // Particles
    ctx.fillStyle = "white";

    particles.forEach(p =>
        ctx.fillRect(p.x, p.y, 3, 3)
    );

    drawPlayer();
}

// HUD
function updateHUD() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("level").textContent = level;
    document.getElementById("highScore").textContent = highScore;
}

// Game over
function gameOver() {
    state = "GAME_OVER";

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }

    document.getElementById("finalScore").textContent = score;
    document.getElementById("gameOverScreen").classList.remove("hidden");

    playSound(80, 0.2);
    updateHUD();
}

// Desktop buttons
document.getElementById("startButton")
    .addEventListener("click", startGame);

document.getElementById("restartButton")
    .addEventListener("click", startGame);

// Mobile controls
function holdButton(id, key) {
    const button = document.getElementById(id);

    button.addEventListener("pointerdown", () => {
        keys[key] = true;
    });

    button.addEventListener("pointerup", () => {
        keys[key] = false;
    });

    button.addEventListener("pointerleave", () => {
        keys[key] = false;
    });
}

holdButton("leftButton", "arrowleft");
holdButton("rightButton", "arrowright");
holdButton("upButton", "arrowup");
holdButton("downButton", "arrowdown");

// Mobile shoot
document.getElementById("shootButton")
    .addEventListener("pointerdown", () => {
        keys[" "] = true;
    });

document.getElementById("shootButton")
    .addEventListener("pointerup", () => {
        keys[" "] = false;
    });

// Sound ON/OFF
document.getElementById("soundButton")
    .addEventListener("click", () => {
        soundOn = !soundOn;

        document.getElementById("soundButton").textContent =
            soundOn ? "🔊 Sound ON" : "🔇 Sound OFF";
});

// Main game loop
function gameLoop(time) {
    let dt = (time - lastTime) / 1000;
    dt = Math.min(dt, 0.05);
    lastTime = time;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
updateHUD();
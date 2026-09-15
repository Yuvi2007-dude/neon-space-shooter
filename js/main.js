const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// Game variables
let state = "START";
let score = 0;
let lives = 3;
let level = 1;
let highScore = Number(localStorage.getItem("highScore")) || 0;

let bullets = [];
let enemies = [];

let keys = {};
let lastTime = 0;
let enemyTimer = 0;
let shootTimer = 0;


// Player
const player = {
    x: W / 2 - 20,
    y: H - 70,
    w: 40,
    h: 40,
    speed: 350
};


// Keyboard controls
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

    player.x = W / 2 - 20;
    player.y = H - 70;

    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("pauseScreen").classList.add("hidden");

    updateHUD();
}


// Pause
function pauseGame() {
    if (state === "PLAYING") {
        state = "PAUSED";
        document.getElementById("pauseScreen").classList.remove("hidden");
    }
    else if (state === "PAUSED") {
        state = "PLAYING";
        document.getElementById("pauseScreen").classList.add("hidden");
    }
}


// Player movement
function updatePlayer(dt) {

    if (keys["a"] || keys["arrowleft"])
        player.x -= player.speed * dt;

    if (keys["d"] || keys["arrowright"])
        player.x += player.speed * dt;

    if (keys["w"] || keys["arrowup"])
        player.y -= player.speed * dt;

    if (keys["s"] || keys["arrowdown"])
        player.y += player.speed * dt;

    // Keep player inside canvas
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    // Shooting
    shootTimer -= dt;

    if (keys[" "] && shootTimer <= 0) {
        bullets.push({
            x: player.x + 17,
            y: player.y,
            w: 6,
            h: 15,
            speed: 600
        });

        shootTimer = 0.25;
    }
}


// Create enemy
function createEnemy() {
    enemies.push({
        x: Math.random() * (W - 40),
        y: -40,
        w: 40,
        h: 40,
        speed: 100 + level * 15
    });
}


// Update bullets
function updateBullets(dt) {

    bullets.forEach(b => {
        b.y -= b.speed * dt;
    });

    bullets = bullets.filter(b => b.y > -20);
}


// Update enemies
function updateEnemies(dt) {

    enemyTimer -= dt;

    if (enemyTimer <= 0) {
        createEnemy();

        // Higher level = faster spawning
        enemyTimer = Math.max(0.3, 1 - level * 0.05);
    }

    enemies.forEach(e => {
        e.y += e.speed * dt;
    });


    // Enemies that reach bottom
    for (let i = enemies.length - 1; i >= 0; i--) {

        if (enemies[i].y > H) {

            enemies.splice(i, 1);

            lives--;

            if (lives <= 0)
                gameOver();
        }
    }
}


// Collision detection
function collision(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}


// Check all collisions
function checkCollisions() {

    // Bullet vs Enemy
    for (let i = bullets.length - 1; i >= 0; i--) {

        for (let j = enemies.length - 1; j >= 0; j--) {

            if (collision(bullets[i], enemies[j])) {

                bullets.splice(i, 1);
                enemies.splice(j, 1);

                score += 10;

                break;
            }
        }
    }


    // Player vs Enemy
    for (let i = enemies.length - 1; i >= 0; i--) {

        if (collision(player, enemies[i])) {

            enemies.splice(i, 1);

            lives--;

            if (lives <= 0)
                gameOver();
        }
    }
}


// Update game
function update(dt) {

    if (state !== "PLAYING")
        return;

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    checkCollisions();

    // Increase level every 100 points
    level = Math.floor(score / 100) + 1;

    updateHUD();
}


// Draw player
function drawPlayer() {

    ctx.fillStyle = "#00ffff";

    ctx.beginPath();

    ctx.moveTo(player.x + 20, player.y);
    ctx.lineTo(player.x, player.y + 40);
    ctx.lineTo(player.x + 20, player.y + 30);
    ctx.lineTo(player.x + 40, player.y + 40);

    ctx.closePath();

    ctx.fill();
}


// Draw bullets
function drawBullets() {

    ctx.fillStyle = "#ffff00";

    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
    });
}


// Draw enemies
function drawEnemies() {

    ctx.fillStyle = "#ff0055";

    enemies.forEach(e => {

        ctx.fillRect(
            e.x,
            e.y,
            e.w,
            e.h
        );

    });
}


// Draw background
function drawBackground() {

    ctx.fillStyle = "#02030a";

    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "white";

    for (let i = 0; i < 40; i++) {

        let x = (i * 137) % W;
        let y = (i * 83 + Date.now() * 0.02) % H;

        ctx.fillRect(x, y, 2, 2);
    }
}


// Draw everything
function draw() {

    drawBackground();
    drawPlayer();
    drawBullets();
    drawEnemies();
}


// Update HUD
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

        localStorage.setItem(
            "highScore",
            highScore
        );
    }

    document.getElementById("finalScore").textContent = score;

    document
        .getElementById("gameOverScreen")
        .classList.remove("hidden");

    updateHUD();
}


// Buttons
document
    .getElementById("startButton")
    .addEventListener("click", startGame);

document
    .getElementById("restartButton")
    .addEventListener("click", startGame);


// Main game loop
function gameLoop(time) {

    // Delta time
    let dt = (time - lastTime) / 1000;

    dt = Math.min(dt, 0.05);

    lastTime = time;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}


requestAnimationFrame(gameLoop);

updateHUD();
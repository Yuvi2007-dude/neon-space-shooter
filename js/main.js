// ============================================================
// NEON SPACE SHOOTER
// ============================================================
// Main game file
// Technologies:
// HTML5 Canvas
// Vanilla JavaScript
// Web Audio API
// localStorage
// ============================================================


// ============================================================
// 1. CANVAS SETUP
// ============================================================

const canvas = document.getElementById("gameCanvas");

const ctx = canvas.getContext("2d");

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;


// ============================================================
// 2. UI ELEMENTS
// ============================================================

const scoreElement = document.getElementById("score");

const livesElement = document.getElementById("lives");

const levelElement = document.getElementById("level");

const highScoreElement = document.getElementById("highScore");

const finalScoreElement = document.getElementById("finalScore");

const startScreen = document.getElementById("startScreen");

const pauseScreen = document.getElementById("pauseScreen");

const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");

const restartButton = document.getElementById("restartButton");

const soundButton = document.getElementById("soundButton");


// ============================================================
// 3. KEYBOARD INPUT
// ============================================================

const keys = {};

window.addEventListener("keydown", (event) => {

    keys[event.key.toLowerCase()] = true;

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === " "
    ) {
        event.preventDefault();
    }

    if (event.key.toLowerCase() === "p") {
        game.togglePause();
    }

});


window.addEventListener("keyup", (event) => {

    keys[event.key.toLowerCase()] = false;

});


// ============================================================
// 4. PLAYER CLASS
// ============================================================

class Player {

    constructor(game) {

        this.game = game;

        this.width = 40;

        this.height = 40;

        this.x = GAME_WIDTH / 2 - this.width / 2;

        this.y = GAME_HEIGHT - 80;

        this.speed = 350;

        this.lives = 3;

        this.shootCooldown = 0;

    }


    reset() {

        this.x = GAME_WIDTH / 2 - this.width / 2;

        this.y = GAME_HEIGHT - 80;

        this.lives = 3;

        this.shootCooldown = 0;

    }


    update(deltaTime) {

        let moveX = 0;

        let moveY = 0;


        // Keyboard movement

        if (keys["arrowleft"] || keys["a"]) {
            moveX -= 1;
        }

        if (keys["arrowright"] || keys["d"]) {
            moveX += 1;
        }

        if (keys["arrowup"] || keys["w"]) {
            moveY -= 1;
        }

        if (keys["arrowdown"] || keys["s"]) {
            moveY += 1;
        }


        // Normalize diagonal movement

        if (moveX !== 0 && moveY !== 0) {

            moveX *= 0.707;

            moveY *= 0.707;

        }


        // Apply movement

        this.x += moveX * this.speed * deltaTime;

        this.y += moveY * this.speed * deltaTime;


        // Keep player inside canvas

        this.x = Math.max(
            0,
            Math.min(GAME_WIDTH - this.width, this.x)
        );

        this.y = Math.max(
            0,
            Math.min(GAME_HEIGHT - this.height, this.y)
        );


        // Shooting cooldown

        this.shootCooldown -= deltaTime;


        // Space = shooting

        if (keys[" "] && this.shootCooldown <= 0) {

            this.shoot();

            this.shootCooldown = 0.25;

        }

    }


    shoot() {

        this.game.bullets.push(

            new Bullet(
                this.game,
                this.x + this.width / 2 - 3,
                this.y - 10
            )

        );

        playSound(600, 0.05);

    }


    takeDamage() {

        this.lives--;

        this.game.updateHUD();

        this.game.createExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2
        );

        playSound(120, 0.15);


        if (this.lives <= 0) {

            this.game.gameOver();

        }

    }


    draw() {

        ctx.save();

        ctx.translate(
            this.x + this.width / 2,
            this.y + this.height / 2
        );


        // Ship glow

        ctx.shadowBlur = 20;

        ctx.shadowColor = "#00eaff";


        // Ship body

        ctx.fillStyle = "#00eaff";

        ctx.beginPath();

        ctx.moveTo(0, -22);

        ctx.lineTo(-20, 20);

        ctx.lineTo(0, 12);

        ctx.lineTo(20, 20);

        ctx.closePath();

        ctx.fill();


        // Cockpit

        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(0, -3, 5, 0, Math.PI * 2);

        ctx.fill();


        // Engine

        ctx.fillStyle = "#ff7b00";

        ctx.beginPath();

        ctx.moveTo(-7, 15);

        ctx.lineTo(0, 28 + Math.random() * 8);

        ctx.lineTo(7, 15);

        ctx.closePath();

        ctx.fill();


        ctx.restore();

    }

}


// ============================================================
// 5. BULLET CLASS
// ============================================================

class Bullet {

    constructor(game, x, y) {

        this.game = game;

        this.x = x;

        this.y = y;

        this.width = 6;

        this.height = 15;

        this.speed = 600;

        this.markedForDeletion = false;

    }


    update(deltaTime) {

        this.y -= this.speed * deltaTime;


        if (this.y + this.height < 0) {

            this.markedForDeletion = true;

        }

    }


    draw() {

        ctx.save();

        ctx.shadowBlur = 15;

        ctx.shadowColor = "#00ffff";

        ctx.fillStyle = "#00ffff";

        ctx.fillRect(
            this.x,
            this.y,
            this.width,
            this.height
        );

        ctx.restore();

    }

}


// ============================================================
// 6. ENEMY CLASS
// ============================================================

class Enemy {

    constructor(game) {

        this.game = game;

        this.width = 40;

        this.height = 40;

        this.x =
            Math.random() *
            (GAME_WIDTH - this.width);

        this.y = -this.height;

        this.speed =
            100 +
            Math.random() * 80 +
            game.level * 15;

        this.markedForDeletion = false;

        this.rotation = Math.random() * Math.PI * 2;

    }


    update(deltaTime) {

        this.y += this.speed * deltaTime;

        this.rotation += deltaTime;


        // Enemy reached bottom

        if (this.y > GAME_HEIGHT) {

            this.markedForDeletion = true;

            this.game.player.takeDamage();

        }

    }


    draw() {

        ctx.save();

        ctx.translate(
            this.x + this.width / 2,
            this.y + this.height / 2
        );

        ctx.rotate(this.rotation);

        ctx.shadowBlur = 15;

        ctx.shadowColor = "#ff0055";

        ctx.fillStyle = "#ff0055";

        ctx.beginPath();

        ctx.moveTo(0, -20);

        ctx.lineTo(20, 0);

        ctx.lineTo(0, 20);

        ctx.lineTo(-20, 0);

        ctx.closePath();

        ctx.fill();


        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(-4, -4, 8, 8);

        ctx.restore();

    }

}


// ============================================================
// 7. PARTICLE CLASS
// ============================================================

class Particle {

    constructor(x, y, color = "#00eaff") {

        this.x = x;

        this.y = y;

        this.size = Math.random() * 4 + 2;

        this.speedX =
            (Math.random() - 0.5) * 200;

        this.speedY =
            (Math.random() - 0.5) * 200;

        this.life = 1;

        this.color = color;

    }


    update(deltaTime) {

        this.x += this.speedX * deltaTime;

        this.y += this.speedY * deltaTime;

        this.life -= deltaTime * 2;

    }


    draw() {

        ctx.save();

        ctx.globalAlpha = Math.max(0, this.life);

        ctx.fillStyle = this.color;

        ctx.fillRect(
            this.x,
            this.y,
            this.size,
            this.size
        );

        ctx.restore();

    }

}


// ============================================================
// 8. POWER-UP CLASS
// ============================================================

class PowerUp {

    constructor(game) {

        this.game = game;

        this.size = 25;

        this.x =
            Math.random() *
            (GAME_WIDTH - this.size);

        this.y = -this.size;

        this.speed = 100;

        this.markedForDeletion = false;

    }


    update(deltaTime) {

        this.y += this.speed * deltaTime;


        if (this.y > GAME_HEIGHT) {

            this.markedForDeletion = true;

        }

    }


    draw() {

        ctx.save();

        ctx.shadowBlur = 20;

        ctx.shadowColor = "#00ff66";

        ctx.fillStyle = "#00ff66";

        ctx.beginPath();

        ctx.arc(
            this.x + this.size / 2,
            this.y + this.size / 2,
            this.size / 2,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.shadowBlur = 0;

        ctx.fillStyle = "#000";

        ctx.font = "bold 16px Arial";

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";

        ctx.fillText(
            "+",
            this.x + this.size / 2,
            this.y + this.size / 2
        );

        ctx.restore();

    }

}


// ============================================================
// 9. GAME CLASS
// ============================================================

class Game {

    constructor() {

        this.state = "START";

        this.score = 0;

        this.level = 1;

        this.highScore =
            Number(localStorage.getItem("neonHighScore")) || 0;

        this.soundEnabled = true;

        this.spawnTimer = 0;

        this.powerUpTimer = 0;

        this.enemies = [];

        this.bullets = [];

        this.particles = [];

        this.powerUps = [];

        this.player = new Player(this);

        this.updateHUD();

    }


    start() {

        this.state = "PLAYING";

        this.score = 0;

        this.level = 1;

        this.spawnTimer = 0;

        this.powerUpTimer = 0;

        this.enemies = [];

        this.bullets = [];

        this.particles = [];

        this.powerUps = [];

        this.player.reset();

        startScreen.classList.add("hidden");

        pauseScreen.classList.add("hidden");

        gameOverScreen.classList.add("hidden");

        this.updateHUD();

        initAudio();

    }


    togglePause() {

        if (this.state === "PLAYING") {

            this.state = "PAUSED";

            pauseScreen.classList.remove("hidden");

        }

        else if (this.state === "PAUSED") {

            this.state = "PLAYING";

            pauseScreen.classList.add("hidden");

        }

    }


    gameOver() {

        this.state = "GAME_OVER";

        finalScoreElement.textContent = this.score;

        gameOverScreen.classList.remove("hidden");


        if (this.score > this.highScore) {

            this.highScore = this.score;

            localStorage.setItem(
                "neonHighScore",
                this.highScore
            );

        }

        this.updateHUD();

        playSound(80, 0.4);

    }


    update(deltaTime) {

        if (this.state !== "PLAYING") {
            return;
        }


        // Player

        this.player.update(deltaTime);


        // Spawn enemies

        this.spawnTimer -= deltaTime;

        if (this.spawnTimer <= 0) {

            this.enemies.push(new Enemy(this));

            this.spawnTimer =
                Math.max(
                    0.25,
                    0.9 - this.level * 0.04
                );

        }


        // Spawn power-ups

        this.powerUpTimer -= deltaTime;

        if (this.powerUpTimer <= 0) {

            if (Math.random() < 0.2) {

                this.powerUps.push(
                    new PowerUp(this)
                );

            }

            this.powerUpTimer = 10;

        }


        // Bullets

        this.bullets.forEach((bullet) => {

            bullet.update(deltaTime);

        });


        // Enemies

        this.enemies.forEach((enemy) => {

            enemy.update(deltaTime);

        });


        // Power-ups

        this.powerUps.forEach((powerUp) => {

            powerUp.update(deltaTime);

        });


        // Particles

        this.particles.forEach((particle) => {

            particle.update(deltaTime);

        });


        // Collision detection

        this.handleCollisions();


        // Remove deleted objects

        this.bullets =
            this.bullets.filter(
                (bullet) => !bullet.markedForDeletion
            );

        this.enemies =
            this.enemies.filter(
                (enemy) => !enemy.markedForDeletion
            );

        this.powerUps =
            this.powerUps.filter(
                (powerUp) => !powerUp.markedForDeletion
            );

        this.particles =
            this.particles.filter(
                (particle) => particle.life > 0
            );


        // Difficulty

        this.level =
            Math.floor(this.score / 100) + 1;

        this.updateHUD();

    }


    handleCollisions() {

        // Bullet vs Enemy

        this.bullets.forEach((bullet) => {

            this.enemies.forEach((enemy) => {

                if (
                    this.checkCollision(
                        bullet,
                        enemy
                    )
                ) {

                    bullet.markedForDeletion = true;

                    enemy.markedForDeletion = true;

                    this.score += 10;

                    this.createExplosion(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        "#ff0055"
                    );

                    playSound(180, 0.08);

                }

            });

        });


        // Player vs Enemy

        this.enemies.forEach((enemy) => {

            if (
                this.checkCollision(
                    this.player,
                    enemy
                )
            ) {

                enemy.markedForDeletion = true;

                this.player.takeDamage();

            }

        });


        // Player vs PowerUp

        this.powerUps.forEach((powerUp) => {

            if (
                this.checkCollision(
                    this.player,
                    powerUp
                )
            ) {

                powerUp.markedForDeletion = true;

                this.player.lives = Math.min(
                    5,
                    this.player.lives + 1
                );

                this.createExplosion(
                    powerUp.x,
                    powerUp.y,
                    "#00ff66"
                );

                playSound(800, 0.1);

                this.updateHUD();

            }

        });

    }


    checkCollision(a, b) {

        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );

    }


    createExplosion(x, y, color = "#00eaff") {

        for (let i = 0; i < 15; i++) {

            this.particles.push(
                new Particle(
                    x,
                    y,
                    color
                )
            );

        }

    }


    updateHUD() {

        scoreElement.textContent = this.score;

        livesElement.textContent = this.player.lives;

        levelElement.textContent = this.level;

        highScoreElement.textContent = this.highScore;

    }


    drawBackground() {

        ctx.fillStyle = "#02030a";

        ctx.fillRect(
            0,
            0,
            GAME_WIDTH,
            GAME_HEIGHT
        );


        // Stars

        ctx.fillStyle = "#ffffff";

        for (let i = 0; i < 60; i++) {

            const x = (i * 137) % GAME_WIDTH;

            const y =
                (i * 83 + Date.now() * 0.02) %
                GAME_HEIGHT;

            const size = (i % 3) + 1;

            ctx.globalAlpha =
                0.3 + (i % 4) * 0.15;

            ctx.fillRect(
                x,
                y,
                size,
                size
            );

        }

        ctx.globalAlpha = 1;

    }


    draw() {

        this.drawBackground();


        this.bullets.forEach((bullet) => {

            bullet.draw();

        });


        this.enemies.forEach((enemy) => {

            enemy.draw();

        });


        this.powerUps.forEach((powerUp) => {

            powerUp.draw();

        });


        this.particles.forEach((particle) => {

            particle.draw();

        });


        this.player.draw();

    }

}


// ============================================================
// 10. AUDIO SYSTEM
// ============================================================

let audioContext = null;


function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }

}


function playSound(frequency, duration) {

    if (!game.soundEnabled) {
        return;
    }

    initAudio();

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.frequency.value =
        frequency;

    oscillator.type = "square";


    gain.gain.setValueAtTime(
        0.05,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );


    oscillator.connect(gain);

    gain.connect(audioContext.destination);


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + duration
    );

}


// ============================================================
// 11. GAME CREATION
// ============================================================

const game = new Game();


// ============================================================
// 12. GAME LOOP + DELTA TIME
// ============================================================

let lastTime = 0;


function gameLoop(currentTime) {

    // Convert milliseconds to seconds

    const deltaTime =
        Math.min(
            (currentTime - lastTime) / 1000,
            0.05
        );


    lastTime = currentTime;


    // Update game logic

    game.update(deltaTime);


    // Draw everything

    game.draw();


    // Request next frame

    requestAnimationFrame(gameLoop);

}


requestAnimationFrame(gameLoop);


// ============================================================
// 13. BUTTON EVENTS
// ============================================================

startButton.addEventListener("click", () => {

    game.start();

});


restartButton.addEventListener("click", () => {

    game.start();

});


soundButton.addEventListener("click", () => {

    game.soundEnabled =
        !game.soundEnabled;


    soundButton.textContent =
        game.soundEnabled
            ? "🔊 Sound ON"
            : "🔇 Sound OFF";

});


// ============================================================
// 14. MOBILE TOUCH CONTROLS
// ============================================================

function setupTouchButton(buttonId, key) {

    const button =
        document.getElementById(buttonId);


    button.addEventListener("touchstart", (event) => {

        event.preventDefault();

        keys[key] = true;

    });


    button.addEventListener("touchend", (event) => {

        event.preventDefault();

        keys[key] = false;

    });

}


setupTouchButton("leftButton", "arrowleft");

setupTouchButton("rightButton", "arrowright");

setupTouchButton("upButton", "arrowup");

setupTouchButton("downButton", "arrowdown");

setupTouchButton("shootButton", " ");


// Also support mouse for testing desktop

function setupMouseButton(buttonId, key) {

    const button =
        document.getElementById(buttonId);


    button.addEventListener("mousedown", () => {

        keys[key] = true;

    });


    button.addEventListener("mouseup", () => {

        keys[key] = false;

    });


    button.addEventListener("mouseleave", () => {

        keys[key] = false;

    });

}


setupMouseButton("leftButton", "arrowleft");

setupMouseButton("rightButton", "arrowright");

setupMouseButton("upButton", "arrowup");

setupMouseButton("downButton", "arrowdown");

setupMouseButton("shootButton", " ");
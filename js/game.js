
//Storing KeyCodes for use with player input
const KeyCodeLeft = 37;
const KeyCodeRight = 39;
const KeyCodeSpace = 32;
const KeyCodeA = 65;
const KeyCodeD = 68;

//Dimensions of the game screen.
const GameWidth = 800;
const GameHeight = 600;

//Dimensions of the player and lasers
const PlayerWidth = 20;
const PlayerMaxSpeed = 600.0;
const LaserMaxSpeed = 500.0;
const LaserCooldown = 0.5;

//Enemy formation size and rate of fire
const EnemiesPerRow = 10;
const EnemyHorizontalPadding = 80;
const EnemyVerticalPadding = 70;
const EnemyVerticalSpacing = 80;
const EnemyCooldown = 4.0;


const GameState = {
  lastTime: Date.now(),
  leftPressed: false,
  rightPressed: false,
  spacePressed: false,
  playerX: 0,
  playerY: 0,
  playerCooldown: 0,
  lasers: [],
  enemies: [],
  enemyLasers: [],
  score: 0,
  gameOver: false
};

function rectsIntersect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function setPosition(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function clamp(v, min, max) {
    if (v < min) {
        return min;
    } else if (v > max) {
        return max;
    } else {
        return v;
    }
}

// Generates a random number between 0 and 1
function rand(min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
    return min + Math.random() * (max - min);
}

// Sets the player's ship location, the ship sprite and
function createPlayer(query) {
    //Sets the player's starting location
    GameState.playerX = GameWidth / 2;
    GameState.playerY = GameHeight - 50;
    //Sets the players sprite
    const player = document.createElement("img");
    player.src = "img/player-blue-1.png";
    player.className = "player";
    query.appendChild(player);
    setPosition(player, GameState.playerX, GameState.playerY);
}

//Destroys the player character and calls the game over state
function destroyPlayer(query, player) {
    query.removeChild(player);
    GameState.gameOver = true;
    const audio = new Audio("sound/sfx-lose.ogg");
    audio.play();
}

//Moves the player sprite when either right arrow key or left arrow key is pressed.
function updatePlayer(dt, querySelector) {
    if (GameState.leftPressed) {
        GameState.playerX -= dt * PlayerMaxSpeed;
    }
    if (GameState.rightPressed) {
        GameState.playerX += dt * PlayerMaxSpeed;
    }

    GameState.playerX = clamp(GameState.playerX, PlayerWidth, GameWidth - PlayerWidth);

    if (GameState.spacePressed && GameState.playerCooldown <= 0) {
        createLaser(querySelector, GameState.playerX, GameState.playerY);
        GameState.playerCooldown = LaserCooldown;
    }
    if (GameState.playerCooldown > 0) {
        GameState.playerCooldown -= dt;
    }

    const player = document.querySelector(".player");
    setPosition(player, GameState.playerX, GameState.playerY);
}

//Spawns a laser and for the player
function createLaser(query, x, y) {
    const element = document.createElement("img");
    element.src = "img/laser-blue-1.png";
    element.className = "laser";
    query.appendChild(element);
    const laser = { x, y, element };
    GameState.lasers.push(laser);
    const audio = new Audio("sound/sfx-laser1.ogg");
    audio.play();
    setPosition(element, x, y);
}

//Moves the players laser towards the enemies and checks for if the enemy is hit
function updateLasers(dt, querySelector) {
    const lasers = GameState.lasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y -= dt * LaserMaxSpeed;
        if (laser.y < 0) {
            destroyLaser(querySelector, laser);
        }
        setPosition(laser.element, laser.x, laser.y);
        const r1 = laser.element.getBoundingClientRect();
        const enemies = GameState.enemies;
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.isDead)
                continue;
            const r2 = enemy.element.getBoundingClientRect();
            if (rectsIntersect(r1, r2)) {
                // Enemy was hit
                destroyEnemy(querySelector, enemy);
                destroyLaser(querySelector, laser);
                GameState.score ++;
                break;
            }
        }
    }
    GameState.lasers = GameState.lasers.filter(e => !e.isDead);
}

//If it missed then delete the laser
function destroyLaser(querySelector, laser) {
    querySelector.removeChild(laser.element);
    laser.isDead = true;
}

//Creates the enemy and assigns it a sprite
function createEnemy(querySelector, x, y) {
    const element = document.createElement("img");
    element.src = "img/enemy-black-1.png";
    element.className = "enemy";
    querySelector.appendChild(element);
    const enemy = {x, y, cooldown: rand(0.5, EnemyCooldown), element};
    GameState.enemies.push(enemy);
    setPosition(element, x, y);
}

//Updates the enemy's movement and shooting cooldown
function updateEnemies(dt, query) {
    const dx = Math.sin(GameState.lastTime / 1000.0) * 50;
    const dy = Math.cos(GameState.lastTime / 1000.0) * 10;
    const enemies = GameState.enemies;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const x = enemy.x + dx;
        const y = enemy.y + dy;
        setPosition(enemy.element, x, y);
        enemy.cooldown -= dt;
        //Shoot a laser if cooldown allows it
        if (enemy.cooldown <= 0) {
            createEnemyLaser(query, x, y);
            enemy.cooldown = EnemyCooldown;
        }
    }
    GameState.enemies = GameState.enemies.filter(e => !e.isDead);
}

//Deals with the removal of enemies.
function destroyEnemy(query, enemy) {
    query.removeChild(enemy.element);
    enemy.isDead = true;
}

//Creates the enemy laser and assigns it a sprite
function createEnemyLaser(query, x, y) {
    const element = document.createElement("img");
    element.src = "img/laser-red-5.png";
    element.className = "enemy-laser";
    query.appendChild(element);
    const laser = { x, y, element };
    GameState.enemyLasers.push(laser);
    setPosition(element, x, y);
}

// Updates the enemy's laser position and checks if it has hit the player
function updateEnemyLasers(dt, query) {
    const lasers = GameState.enemyLasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y += dt * LaserMaxSpeed;
        if (laser.y > GameHeight) {
            destroyLaser(query, laser);
        }
        setPosition(laser.element, laser.x, laser.y);
        const r1 = laser.element.getBoundingClientRect();
        const player = document.querySelector(".player");
        const r2 = player.getBoundingClientRect();
        if (rectsIntersect(r1, r2)) {
             // Player was hit
            destroyPlayer(query, player);
            break;
        }
    }
    GameState.enemyLasers = GameState.enemyLasers.filter(e => !e.isDead);
}

//Initialisation function This starts the game
function init() {
    const query = document.querySelector(".game");
    createPlayer(query);

    const enemySpacing = (GameWidth - EnemyHorizontalPadding * 2) / (EnemiesPerRow - 1);
    for (let j = 0; j < 3; j++) {
        const y = EnemyVerticalPadding + j * EnemyVerticalSpacing;
        for (let i = 0; i < EnemiesPerRow; i++) {
            const x = i * enemySpacing + EnemyHorizontalPadding;
            createEnemy(query, x, y);
        }
    }
}

function playerHasWon() {
    return GameState.enemies.length === 0;
}

//Checks to see if the player has won/lost and updates the screen accordingly
function update() {
    const currentTime = Date.now();
    const dt = (currentTime - GameState.lastTime) / 1000.0;

    //Has the player lost?
    if (GameState.gameOver) {
        document.querySelector(".game-over").style.display = "block";
        return;
    }
    //Has the player won?
    if (playerHasWon()) {
        document.querySelector(".congratulations").style.display = "block";
        return;
    }

    const querySelector = document.querySelector(".game");
    updatePlayer(dt, querySelector);
    updateLasers(dt, querySelector);
    updateEnemies(dt, querySelector);
    updateEnemyLasers(dt, querySelector);

    GameState.lastTime = currentTime;
    window.requestAnimationFrame(update);
}

//Checks for if the player has pressed an input to begin movement
function onKeyDown(e) {
    if (e.keyCode === KeyCodeLeft || e.keyCode === KeyCodeA) {
        GameState.leftPressed = true;
    } else if (e.keyCode === KeyCodeRight || e.keyCode === KeyCodeD) {
        GameState.rightPressed = true;
    } else if (e.keyCode === KeyCodeSpace) {
        GameState.spacePressed = true;
    }
}

//Checks to see if the player has released an input to stop movement
function onKeyUp(e) {
    if (e.keyCode === KeyCodeLeft || e.keyCode === KeyCodeA) {
        GameState.leftPressed = false;
    } else if (e.keyCode === KeyCodeRight || e.keyCode === KeyCodeD) {
        GameState.rightPressed = false;
    } else if (e.keyCode === KeyCodeSpace) {
        GameState.spacePressed = false;
    }
}
//Starts the game
init();
//Listens for input from the player
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);

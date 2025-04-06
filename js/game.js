// Variabili globali
let canvas, ctx;
let bird, pipes, ground;
let score;
let gameState; // 'start', 'playing', 'gameOver'
let frameId;
let lastTime;
let pipeSpawnTimer;
let bestScore = 0; // Memorizza il punteggio migliore
let frameCount = 0; // Contatore per l'animazione

// Costanti
const GRAVITY = 0.5;
const FLAP_POWER = -8;
const PIPE_SPEED = 2;
const PIPE_SPAWN_INTERVAL = 1500; // millisecondi
const PIPE_GAP = 150;
const GROUND_HEIGHT = 80;
const BIRD_FRAMES = 3; // Numero di frame per l'animazione dell'uccello
const ANIMATION_SPEED = 5; // Velocità dell'animazione (frame ogni X frame di gioco)

// Inizializzazione del gioco
function init() {
    // Ottieni il canvas e il contesto
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Imposta le dimensioni del canvas
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Inizializza lo stato del gioco
    gameState = 'start';
    score = 0;
    
    // Carica il miglior punteggio dal localStorage
    const savedBestScore = localStorage.getItem('flappyBestScore');
    if (savedBestScore) {
        bestScore = parseInt(savedBestScore);
    }
    
    // Carica tutte le immagini
    loadBirdImages();
    loadPipeImages();
    loadGroundImage();
    
    // Aggiorna il display del miglior punteggio
    document.getElementById('best-score').textContent = bestScore;
    
    // Inizializza gli oggetti di gioco
    resetGame();
    
    // Aggiungi gli event listener
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleTouch);
    
    // Usa le immagini SVG come pulsanti
    document.getElementById('play-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);
    
    // Previeni lo scrolling su dispositivi mobili
    document.addEventListener('touchmove', function(e) {
        if (e.target == canvas) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Avvia il loop di gioco
    lastTime = 0;
    gameLoop(0);
}

// Resetta il gioco
function resetGame() {
    // Inizializza l'uccello
    bird = {
        x: canvas.width / 3,
        y: canvas.height / 2,
        width: 34,
        height: 24,
        velocity: 0,
        rotation: 0,
        frame: 0,  // Frame corrente dell'animazione
        frameCounter: 0  // Contatore per l'animazione
    };
    
    // Inizializza i tubi
    pipes = [];
    
    // Inizializza il terreno
    ground = {
        y: canvas.height - GROUND_HEIGHT,
        height: GROUND_HEIGHT,
        x: 0  // Posizione x per lo scrolling del terreno
    };
    
    // Resetta il punteggio
    score = 0;
    document.getElementById('score-display').textContent = score;
    document.getElementById('final-score').textContent = score;
    
    // Resetta il timer per la generazione dei tubi
    pipeSpawnTimer = 0;
    
    // Resetta il contatore dei frame
    frameCount = 0;
}

// Loop principale del gioco
function gameLoop(timestamp) {
    // Calcola il delta time
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Incrementa il contatore dei frame
    frameCount++;
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegna lo sfondo
    drawBackground();
    
    // Aggiorna e disegna in base allo stato del gioco
    if (gameState === 'playing') {
        // Aggiorna la posizione dell'uccello
        updateBird(deltaTime);
        
        // Aggiorna e genera i tubi
        updatePipes(deltaTime);
        
        // Aggiorna la posizione del terreno (scrolling)
        updateGround();
        
        // Controlla le collisioni
        checkCollisions();
        
        // Aggiorna il punteggio
        updateScore();
    }
    
    // Aggiorna l'animazione dell'uccello
    updateBirdAnimation();
    
    // Disegna l'uccello
    drawBird();
    
    // Disegna i tubi
    drawPipes();
    
    // Disegna il terreno
    drawGround();
    
    // Disegna il punteggio migliore nella schermata di game over
    if (gameState === 'gameOver') {
        drawBestScore();
    }
    
    // Richiedi il prossimo frame
    frameId = requestAnimationFrame(gameLoop);
}

// Gestione del click del mouse
function handleClick(event) {
    if (gameState === 'start') {
        startGame();
    } else if (gameState === 'playing') {
        flapBird();
    }
}

// Gestione del tocco
function handleTouch(event) {
    event.preventDefault();
    if (gameState === 'start') {
        startGame();
    } else if (gameState === 'playing') {
        flapBird();
    }
}

// Avvia il gioco
function startGame() {
    gameState = 'playing';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
}

// Riavvia il gioco
function restartGame() {
    resetGame();
    gameState = 'playing';
    document.getElementById('game-over-screen').classList.add('hidden');
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').classList.remove('hidden');
    
    // Riproduci un suono di game over (da implementare con gli asset)
    
    // Salva il punteggio migliore
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBestScore', bestScore.toString());
    }
    
    // Aggiorna il display del miglior punteggio
    document.getElementById('best-score').textContent = bestScore;
}

// Fai volare l'uccello
function flapBird() {
    bird.velocity = FLAP_POWER;
}

// Aggiorna la posizione dell'uccello
function updateBird(deltaTime) {
    // Applica la gravità
    bird.velocity += GRAVITY;
    
    // Aggiorna la posizione
    bird.y += bird.velocity;
    
    // Aggiorna la rotazione in base alla velocità
    bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1));
    
    // Impedisci all'uccello di uscire dallo schermo in alto
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }
    
    // Aggiungi un effetto di "rimbalzo" quando l'uccello colpisce il terreno
    if (bird.y + bird.height >= ground.y) {
        bird.y = ground.y - bird.height;
        bird.velocity = 0;
    }
}

// Aggiorna e genera i tubi
function updatePipes(deltaTime) {
    // Aggiorna il timer per la generazione dei tubi
    pipeSpawnTimer += deltaTime;
    
    // Genera un nuovo tubo se è passato abbastanza tempo
    if (pipeSpawnTimer >= PIPE_SPAWN_INTERVAL) {
        generatePipe();
        pipeSpawnTimer = 0;
    }
    
    // Aggiorna la posizione dei tubi
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= PIPE_SPEED;
        
        // Rimuovi i tubi che sono usciti dallo schermo
        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
            i--;
        }
    }
}

// Genera un nuovo tubo
function generatePipe() {
    // Calcola l'altezza casuale per il tubo inferiore
    const minHeight = 50;
    const maxHeight = canvas.height - GROUND_HEIGHT - PIPE_GAP - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    // Crea i tubi
    const pipe = {
        x: canvas.width,
        width: 52,
        scored: false,
        top: {
            y: 0,
            height: canvas.height - GROUND_HEIGHT - PIPE_GAP - height
        },
        bottom: {
            y: canvas.height - GROUND_HEIGHT - height,
            height: height
        }
    };
    
    // Aggiungi il tubo all'array
    pipes.push(pipe);
}

// Controlla le collisioni
function checkCollisions() {
    // Collisione con il terreno
    if (bird.y + bird.height >= ground.y) {
        bird.y = ground.y - bird.height;
        gameOver();
        return;
    }
    
    // Collisione con i tubi
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        
        // Controlla se l'uccello è nell'area del tubo (sull'asse x)
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width) {
            // Controlla la collisione con il tubo superiore
            if (bird.y < pipe.top.y + pipe.top.height) {
                gameOver();
                return;
            }
            
            // Controlla la collisione con il tubo inferiore
            if (bird.y + bird.height > pipe.bottom.y) {
                gameOver();
                return;
            }
        }
    }
}

// Aggiorna il punteggio
function updateScore() {
    for (let i = 0; i < pipes.length; i++) {
        // Se l'uccello ha superato un tubo e non è ancora stato conteggiato
        if (!pipes[i].scored && bird.x > pipes[i].x + pipes[i].width) {
            pipes[i].scored = true;
            score++;
            document.getElementById('score-display').textContent = score;
        }
    }
}

// Disegna lo sfondo
function drawBackground() {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Carica le immagini dell'uccello
const birdImages = [];
function loadBirdImages() {
    for (let i = 1; i <= BIRD_FRAMES; i++) {
        const img = new Image();
        img.src = `assets/images/bird/bird${i}.svg`;
        birdImages.push(img);
    }
}

// Disegna l'uccello
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    
    // Disegna l'uccello con l'immagine corrente dell'animazione
    if (birdImages.length > 0) {
        const currentImage = birdImages[bird.frame];
        if (currentImage.complete) {
            ctx.drawImage(currentImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        } else {
            // Fallback se l'immagine non è ancora caricata
            ctx.fillStyle = '#f8c548';
            ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
        }
    } else {
        // Fallback se le immagini non sono ancora caricate
        ctx.fillStyle = '#f8c548';
        ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
    }
    
    ctx.restore();
}

// Carica le immagini dei tubi
const pipeTopImage = new Image();
const pipeBottomImage = new Image();
function loadPipeImages() {
    pipeTopImage.src = 'assets/images/pipes/pipe-top.svg';
    pipeBottomImage.src = 'assets/images/pipes/pipe-bottom.svg';
}

// Disegna i tubi
function drawPipes() {
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        
        // Disegna il tubo superiore
        if (pipeTopImage.complete) {
            ctx.drawImage(pipeTopImage, pipe.x, pipe.top.y, pipe.width, pipe.top.height);
        } else {
            // Fallback se l'immagine non è ancora caricata
            ctx.fillStyle = '#74BF2E';
            ctx.fillRect(pipe.x, pipe.top.y, pipe.width, pipe.top.height);
        }
        
        // Disegna il tubo inferiore
        if (pipeBottomImage.complete) {
            ctx.drawImage(pipeBottomImage, pipe.x, pipe.bottom.y, pipe.width, pipe.bottom.height);
        } else {
            // Fallback se l'immagine non è ancora caricata
            ctx.fillStyle = '#74BF2E';
            ctx.fillRect(pipe.x, pipe.bottom.y, pipe.width, pipe.bottom.height);
        }
    }
}

// Carica l'immagine del terreno
const groundImage = new Image();
function loadGroundImage() {
    groundImage.src = 'assets/images/background/ground.svg';
}

// Disegna il terreno
function drawGround() {
    if (groundImage.complete) {
        // Disegna il terreno con pattern ripetuto
        const pattern = ctx.createPattern(groundImage, 'repeat-x');
        ctx.save();
        ctx.translate(ground.x, 0);
        ctx.fillStyle = pattern;
        ctx.fillRect(-ground.x, ground.y, canvas.width + ground.x, ground.height);
        ctx.restore();
    } else {
        // Fallback se l'immagine non è ancora caricata
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, ground.y, canvas.width, ground.height);
    }
}

// Avvia il gioco quando la pagina è caricata
window.addEventListener('load', init);

// Gestione del ridimensionamento della finestra
window.addEventListener('resize', function() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Aggiorna la posizione del terreno
    ground.y = canvas.height - GROUND_HEIGHT;
});

// Aggiorna l'animazione dell'uccello
function updateBirdAnimation() {
    // Aggiorna il contatore dei frame solo se il gioco è in esecuzione
    if (gameState === 'playing') {
        bird.frameCounter++;
        
        // Cambia il frame dell'animazione ogni ANIMATION_SPEED frame
        if (bird.frameCounter >= ANIMATION_SPEED) {
            bird.frame = (bird.frame + 1) % BIRD_FRAMES;
            bird.frameCounter = 0;
        }
    }
}

// Aggiorna la posizione del terreno (scrolling)
function updateGround() {
    // Sposta il terreno verso sinistra
    ground.x -= PIPE_SPEED;
    
    // Resetta la posizione quando il terreno è uscito dallo schermo
    if (ground.x <= -canvas.width) {
        ground.x = 0;
    }
}

// Disegna il punteggio migliore
function drawBestScore() {
    // Aggiorna il punteggio migliore se necessario
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBestScore', bestScore.toString());
    }
    
    // Aggiungi il punteggio migliore alla schermata di game over
    const bestScoreElement = document.getElementById('game-over-screen');
    if (bestScoreElement && !bestScoreElement.querySelector('.best-score')) {
        const bestScoreText = document.createElement('p');
        bestScoreText.className = 'best-score';
        bestScoreText.textContent = 'Miglior punteggio: ' + bestScore;
        bestScoreElement.insertBefore(bestScoreText, document.getElementById('restart-button'));
    } else if (bestScoreElement.querySelector('.best-score')) {
        bestScoreElement.querySelector('.best-score').textContent = 'Miglior punteggio: ' + bestScore;
    }
}

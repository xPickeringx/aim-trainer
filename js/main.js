const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let totalClicks = 0;
let timeLeft = 30;
let isGameActive = false;
let gameInterval, timerInterval;

const clickSoundSrc = "https://github.com/xPickeringx/aim-trainer/assets/audio/disparo.mp3";
const hitSoundSrc = "https://github.com/xPickeringx/aim-trainer/assets/audio/punto.mp3";

let clickSound, hitSound;

let targetImage = new Image();
targetImage.src = 'https://github.com/xPickeringx/aim-trainer/assets/visual/objetivo.jpg';

// Mostrar el modal de reglas al cargar la página
window.onload = function() {
  var rulesModal = new bootstrap.Modal(document.getElementById('rulesModal'), {
    keyboard: false
  });
  rulesModal.show();
};

// Preload de sonidos
function preloadSounds() {
    clickSound = new Audio(clickSoundSrc);
    clickSound.volume = 0.5;
    clickSound.preload = "auto";

    hitSound = new Audio(hitSoundSrc);
    hitSound.volume = 1.0;
    hitSound.preload = "auto";

    clickSound.load();
    hitSound.load();
}

preloadSounds();

let targets = [];

// Esta función verifica si el nuevo objetivo se superpone con los existentes
function checkOverlap(newTarget) {
    for (let i = 0; i < targets.length; i++) {
        let dx = newTarget.x - targets[i].x;
        let dy = newTarget.y - targets[i].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < newTarget.radius + targets[i].radius) {
            return true; // Hay colisión
        }
    }
    return false; // No hay colisión
}

// Modificar la función spawnTarget para evitar solapamientos
function spawnTarget() {
    const isHorizontal = Math.random() < 0.5;
    let newTarget;

    do {
        newTarget = {
            x: Math.random() * (canvas.width - 60) + 30,
            y: Math.random() * (canvas.height - 60) + 30,
            radius: 30,
            dx: isHorizontal ? (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3) : 0,
            dy: !isHorizontal ? (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3) : 0
        };
    } while (checkOverlap(newTarget));

    return newTarget;
}

function spawnTargets() {
    targets = [spawnTarget(), spawnTarget(), spawnTarget()];
}

function checkCollisions() {
    for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
            let dx = targets[i].x - targets[j].x;
            let dy = targets[i].y - targets[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < targets[i].radius * 2) {
                let tempDx = targets[i].dx;
                let tempDy = targets[i].dy;
                targets[i].dx = targets[j].dx;
                targets[i].dy = targets[j].dy;
                targets[j].dx = tempDx;
                targets[j].dy = tempDy;
            }
        }
    }
}

function updateTargets() {
    targets.forEach(target => {
        target.x += target.dx;
        target.y += target.dy;

        if (target.x - target.radius <= 0 || target.x + target.radius >= canvas.width) {
            target.dx *= -1;
        }
        if (target.y - target.radius <= 0 || target.y + target.radius >= canvas.height) {
            target.dy *= -1;
        }
    });

    checkCollisions();
}

function drawTargets() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    targets.forEach(target => {
        const distanceToCenter = Math.sqrt(
            (target.x - centerX) ** 2 + (target.y - centerY) ** 2
        );

        const sizeFactor = Math.min(2, Math.max(0.5, 1 + (distanceToCenter / canvas.width)));
        const newRadius = target.radius * sizeFactor;

        ctx.save();
        ctx.beginPath();
        ctx.arc(target.x, target.y, newRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(targetImage, target.x - newRadius, target.y - newRadius, newRadius * 2, newRadius * 2);
        ctx.restore();
    });
}

canvas.addEventListener("click", function(event) {
    if (!isGameActive) return;

    totalClicks++;

    clickSound.currentTime = 0;
    clickSound.play();

    const clickX = event.offsetX;
    const clickY = event.offsetY;

    let hitDetected = false;

    targets.forEach((target, index) => {
        const distance = Math.sqrt((clickX - target.x) ** 2 + (clickY - target.y) ** 2);
        if (distance < target.radius) {
            score++;
            document.getElementById("score").textContent = `Aciertos: ${score}`;
            targets[index] = spawnTarget();

            if (!hitDetected) {
                hitSound.currentTime = 0;
                hitSound.play();
                hitDetected = true;
            }
        }
    });

    updateAccuracy();
});

function updateAccuracy() {
    const accuracy = totalClicks > 0 ? ((score / totalClicks) * 100).toFixed(2) : 0;
    document.getElementById("accuracy").textContent = `Precisión: ${accuracy}%`;
}

function gameLoop() {
    updateTargets();
    drawTargets();
}

function startGame() {
    score = 0;
    totalClicks = 0;
    timeLeft = 60;
    document.getElementById("score").textContent = `Aciertos: ${score}`;
    document.getElementById("accuracy").textContent = `Precisión: 100%`;
    document.getElementById("timer").textContent = `Tiempo: ${timeLeft}`;
    isGameActive = true;

    spawnTargets();
    gameInterval = setInterval(gameLoop, 1000 / 60);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = `Tiempo: ${timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            isGameActive = false;

            const accuracy = totalClicks > 0 ? ((score / totalClicks) * 100).toFixed(2) : 0;

            addToLeaderboard(score, accuracy);

            document.getElementById("finalScore").textContent = `Aciertos: ${score}`;
            document.getElementById("finalAccuracy").textContent = `Precisión: ${accuracy}%`;

            var myModal = new bootstrap.Modal(document.getElementById('resultsModal'));
            myModal.show();
        }
    }, 1000);
}

document.getElementById("playAgainBtn").addEventListener("click", function() {
    saveFinalScore(score);
    startGame();
    var myModal = bootstrap.Modal.getInstance(document.getElementById('resultsModal'));
    myModal.hide();
});

document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("leaderboardBtn").addEventListener("click", showLeaderboard);


let leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [];

function showLeaderboard() {
    const leaderboardTableBody = document.querySelector("#leaderboardTable tbody");
    leaderboardTableBody.innerHTML = ""; // Limpiar tabla antes de actualizar

    if (leaderboardData.length === 0) {
        leaderboardTableBody.innerHTML = "<tr><td colspan='3'>No hay datos en el leaderboard</td></tr>";
    } else {
        leaderboardData.forEach(entry => {
            const row = document.createElement("tr");

            const rankCell = document.createElement("td");
            rankCell.textContent = entry.rank;
            row.appendChild(rankCell);

            const scoreCell = document.createElement("td");
            scoreCell.textContent = entry.score;
            row.appendChild(scoreCell);

            const accuracyCell = document.createElement("td");
            accuracyCell.textContent = entry.accuracy + "%";
            row.appendChild(accuracyCell);

            leaderboardTableBody.appendChild(row);
        });
    }

     // Mostrar modal y permitir que se cierre correctamente
     const leaderboardModal = new bootstrap.Modal(document.getElementById('leaderboardModal'), {
        keyboard: true,  // Permite cerrar con la tecla Esc
        backdrop: true   // Permite cerrar haciendo clic fuera del modal
    });
    leaderboardModal.show();
}
document.getElementById("leaderboardModal").addEventListener("hidden.bs.modal", function () {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open'); // Asegurar que no bloquea el scroll
});


function addToLeaderboard(score, accuracy) {
    // Asegurar que la precisión tenga solo 2 decimales
    const formattedAccuracy = parseFloat(accuracy).toFixed(2);

    // Crear un nuevo objeto para el puntaje
    const newEntry = {
        rank: leaderboardData.length + 1,
        score: score,
        accuracy: formattedAccuracy
    };
    leaderboardData.push(newEntry);

    // Ordenar por puntajes de mayor a menor
    leaderboardData.sort((a, b) => b.score - a.score);

    // Mantener solo los 5 mejores puntajes
    leaderboardData = leaderboardData.slice(0, 5);

    // Actualizar ranks después de ordenar
    leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1; // Recalcular las posiciones
    });
  // Guardar el nuevo leaderboard en localStorage
  localStorage.setItem('leaderboard', JSON.stringify(leaderboardData));
}

// Mostrar leaderboard cuando se hace clic en el botón
document.getElementById("leaderboardBtn").addEventListener("click", function() {
  showLeaderboard();  // Mostrar leaderboard al hacer clic
});

// Lógica de juego: agregar los datos del jugador al leaderboard al final
function saveFinalScore(score) {
  const accuracy = ((score / totalClicks) * 100).toFixed(2); // Calculando precisión
  addToLeaderboard(score, accuracy);
  showLeaderboard();
}

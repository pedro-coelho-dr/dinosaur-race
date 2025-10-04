import { loadGame, saveGame } from "../core/state.js";

let game = loadGame();
let pendingCheckpoint = null;

// RENDER TABULEIRO

function renderBoard() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.innerHTML = "";
    const pos = parseInt(cell.getAttribute("data-pos"), 10);
    if (!pos) return;

    const checkpoint = game.checkpoints.find(c => c.pos === pos);
    const row = Math.ceil(pos / 4);
    const arrow = checkpoint ? "↓" : row % 2 === 1 ? "→" : "←";
    cell.setAttribute("data-dir", arrow);
  });

  // Agrupa dinos por posição
  const grouped = {};
  game.dinos.forEach(dino => {
    if (!dino.pos || dino.pos <= 0 || dino.pos > 20) return;
    if (!grouped[dino.pos]) grouped[dino.pos] = [];
    grouped[dino.pos].push(dino);
  });

  // Renderiza tokens
  Object.entries(grouped).forEach(([pos, dinos]) => {
    const cell = document.querySelector(`.cell[data-pos="${pos}"]`);
    if (!cell) return;

    const count = dinos.length;
    const spread = 25;

    dinos.forEach((dino, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const offsetX = Math.cos(angle) * spread;
      const offsetY = Math.sin(angle) * spread;

      const token = document.createElement("div");
      token.className = "token";
      token.style.border = `3px solid ${getPlayerColor(dino.owner ?? 0)}`;
      token.innerHTML = `<img src="${dino.img}" alt="${dino.label}">`;

      token.style.position = "absolute";
      token.style.left = `calc(50% + ${offsetX}px)`;
      token.style.top = `calc(50% + ${offsetY}px)`;
      token.style.transform = "translate(-50%, -50%)";
      token.style.width = "95px";
      token.style.height = "95px";
      token.style.zIndex = 3;

      cell.appendChild(token);
    });
  });
}

function getPlayerColor(id) {
  const colors = ["#ff4c4c", "#4cff4c", "#4c4cff", "#ffd24c", "#ff66ff", "#66ffff"];
  return colors[id % colors.length];
}

// HEADER E LOG

function updateHeader() {
  const current = game.currentPlayer;
  const dino = game.currentDino;
  const el = document.getElementById("currentPlayer");
  el.textContent = `${current.name || "Bot"} (${dino?.label || "???"})`;
  el.style.color = getPlayerColor(current.id);
}

function logEvent(message) {
  const box = document.getElementById("logContainer");
  if (!box) return;
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  box.prepend(entry);
  if (box.childNodes.length > 30) box.removeChild(box.lastChild);
}

// RANKING
function updateRanking() {
  const list = document.getElementById("rankingList");
  if (!list) return;

  const ranked = [...game.players].sort((a, b) => {
    const dinoA = game.dinos.find(d => d.owner === a.id);
    const dinoB = game.dinos.find(d => d.owner === b.id);
    const finishedA = game.finishOrder.indexOf(a.id);
    const finishedB = game.finishOrder.indexOf(b.id);

    if (finishedA !== -1 && finishedB !== -1) return finishedA - finishedB;
    if (finishedA !== -1) return -1;
    if (finishedB !== -1) return 1;

    return (dinoB?.pos || 0) - (dinoA?.pos || 0);
  });

  list.innerHTML = ranked.map((p, i) => {
    const dino = game.dinos.find(d => d.owner === p.id);
    const pos = dino?.pos || 0;
    const icon = game.finishOrder.includes(p.id) ? "🏁" : "";
    const bet = p.bet || 0;
    const profit = p.profit ?? null;

    // Aposta
    let profitColor = "#ccc";
    let profitText = "";
    if (profit !== null && !p.isBot) {
      if (profit > 0) profitColor = "#00ff9d";
      else if (profit < 0) profitColor = "#ff5555";
      profitText = ` <span style="color:${profitColor}">(${profit >= 0 ? "+" : ""}${profit.toFixed(0)})</span>`;
    }

    return `
      <li style="color:${getPlayerColor(p.id)}">
        ${icon} <strong>${i + 1}º</strong> ${p.name}
        <span style="color:#fff;">(${dino?.label || "???"})</span> —
        <span style="color:#ffd24c;">Casa ${pos}</span>
        ${profitText}
      </li>
    `;
  }).join("");
}


// LÓGICA DE TURNO

function playTurn() {
  let result;

  if (pendingCheckpoint) {
    const dino = game.currentDino;
    result = game.resolveCheckpoint(dino, pendingCheckpoint);
    pendingCheckpoint = null;
  } else {
    result = game.playTurn();
    if (result && result.extra && result.checkpoint) pendingCheckpoint = result.checkpoint;
  }

  if (!result || !result.log) return;

  logEvent(result.log);

  if (!pendingCheckpoint) {
    const diceMatch = result.log.match(/tirou (\d+)/);
    document.getElementById("diceResult").textContent = diceMatch ? diceMatch[1] : "–";
  }

  saveGame(game);
  renderBoard();
  updateHeader();
  updateRanking();


  if (pendingCheckpoint) {
    if (game.currentPlayer.isBot && !game.finished) {
      setTimeout(playTurn, 800);
    } else {
      showEventCard(pendingCheckpoint);

    }
    return;
  }

  if (game.currentPlayer.isBot && !game.finished) {
    setTimeout(playTurn, 800);
  }
}

// CARD DE EVENTO
function showEventCard(checkpoint) {

  const existing = document.querySelector(".event-card");
  if (existing) existing.remove();

  const card = document.createElement("div");
  card.className = "event-card";


  const isForward = checkpoint.direction === "forward";
  const icon = isForward ? "⚡" : "💀";
  const color = isForward ? "#00ff9d" : "#ff4444";

  card.innerHTML = `
    <div class="event-card-inner" style="border-color:${color}">
      <h2 style="color:${color}">${icon} ${checkpoint.name}</h2>
      <p>${checkpoint.desc}</p>
      <p class="event-hint">${isForward ? 
        "Role o dado novamente para avançar!" : 
        "Role o dado novamente para recuar!"}</p>
      <button id="eventConfirm" class="btn-roll">🎲 Rolar Dado</button>
    </div>
  `;

  document.body.appendChild(card);

  const btn = card.querySelector("#eventConfirm");
  btn.addEventListener("click", () => {
    card.classList.add("fade-out");
    setTimeout(() => card.remove(), 400);
    playTurn(); 
  });
}


// BOTÕES 

// sair

document.getElementById("rollDice").addEventListener("click", handleRoll);
document.getElementById("resetBtn").addEventListener("click", resetGame);
document.getElementById("exitBtn").addEventListener("click", () => {
  if (confirm("Deseja sair da corrida e voltar à tela inicial?")) {
    window.location.href = "index.html";
  }
});

function handleRoll() {
  if (game.currentPlayer.isBot) return;
  playTurn();
}

// reset
function resetGame() {
  if (!confirm("Deseja realmente reiniciar a corrida?")) return;

  // Zera o estado do jogo
  game.dinos.forEach(d => (d.pos = 0));
  game.finishOrder = [];
  game.winner = null;
  game.finished = false;
  game.turn = 0;
  game.players.forEach(p => {
    p.profit = null;
    p.finishedAt = null;
    p.skipTurn = false;
  });
  pendingCheckpoint = null;

  // limpa interface
  document.getElementById("logContainer").innerHTML = "";
  document.getElementById("diceResult").textContent = "–";

  saveGame(game);

  renderBoard();
  updateHeader();
  updateRanking();

  logEvent("Corrida reiniciada! Todos os dinossauros voltaram ao início.");
}



// BOOT

renderBoard();
updateHeader();
updateRanking();
logEvent("Role um dado para começar!");

if (game.currentPlayer.isBot && !game.finished) {
  setTimeout(playTurn, 800);
}

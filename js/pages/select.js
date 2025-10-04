import { loadGame, saveGame, resetGame } from "../core/state.js";
import { DINOSAURS } from "../core/data.js";

let game = loadGame();
let currentPlayer = 0;

if (!game || !game.players || game.players.length === 0) {
  window.location.href = "index.html";
}


// Render Players
function renderPlayer() {
  const container = document.getElementById("players-container");
  const playerNumber = currentPlayer + 1;
  const player = game.players[currentPlayer];

  container.innerHTML = `
    <div class="banner-box">
      <img src="assets/dinosaurs_pen.webp" alt="Dinosaur Pen">

      <div class="player-overlay">
        <div class="player-title">Jogador ${playerNumber}</div>

        <div class="player-inputs">
          <label>Nome:</label>
          <input type="text" id="playerName" placeholder="Digite seu nome" value="${player.name || ""}">
          <label>Aposta:</label>
          <input type="number" id="playerBet" placeholder="Ex: 50" value="${player.bet || ""}" min="1">
        </div>

        <div class="dino-grid">
          ${DINOSAURS.map(d => {
            const taken = game.players.some(p => p.dinoId === d.id);
            return `
              <div class="dino-option ${taken ? "disabled" : ""}" data-id="${d.id}">
                <img src="${d.img}" alt="${d.label}">
                <p><strong>${d.label}</strong><br><em>${d.species}</em></p>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  // seleção de dinossauro
  document.querySelectorAll(".dino-option").forEach(el => {
    if (!el.classList.contains("disabled")) {
      el.addEventListener("click", () => {
        document.querySelectorAll(".dino-option").forEach(opt =>
          opt.classList.remove("selected")
        );
        el.classList.add("selected");
      });
    }
  });
}

function confirmPlayers() {
  const name = document.getElementById("playerName").value.trim();
  const bet = parseInt(document.getElementById("playerBet").value, 10);
  const selected = document.querySelector(".dino-option.selected");

  if (!name) {
    alert("Digite um nome válido!");
    return;
  }
  if (isNaN(bet) || bet <= 0) {
    alert("A aposta deve ser um número positivo!");
    return;
  }
  if (!selected) {
    alert("Escolha um dinossauro!");
    return;
  }

  const dinoId = selected.dataset.id;

  // Atualiza player
  const player = game.players[currentPlayer];
  player.name = name;
  player.bet = bet;
  player.dinoId = dinoId;

  // Atualiza dino
  const dino = game.dinos.find(d => d.id === dinoId);
  if (dino) dino.owner = currentPlayer;

  saveGame(game);

  // Avança ou vai para corrida
  currentPlayer++;
  if (currentPlayer < game.players.length) {
  renderPlayer();
  } else {
  // adiciona os bots
  game.addBots();
  saveGame(game);
  window.location.href = "race.html";
}

}

document.addEventListener("DOMContentLoaded", () => {
  renderPlayer();
  document.getElementById("confirmBtn").addEventListener("click", confirmPlayers);

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetGame();
      window.location.href = "index.html";
    });
  }
});

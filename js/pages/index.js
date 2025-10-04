import { initGame } from "../core/state.js";

function startGame() {
  const players = parseInt(document.getElementById("numPlayers").value, 10);
  initGame(players);
  window.location.href = "select.html";
}

window.startGame = startGame;

import Game from "../models/Game.js";

const STORAGE_KEY = "DINORACE_STATE";

export function initGame(numPlayers) {
  const game = new Game(numPlayers);
  saveGame(game);
  return game;
}

export function saveGame(game) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}

export function loadGame() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  const obj = JSON.parse(data);
  return Game.fromJSON(obj);
}

export function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
  return null;
}

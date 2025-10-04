import Player from "./Player.js";
import Dinosaur from "./Dinosaur.js";
import Checkpoint from "./Checkpoint.js";
import { DINOSAURS, CHECKPOINTS, TRACK_LENGTH } from "../core/data.js";

export default class Game {
  constructor(numPlayers) {
    this.numPlayers = numPlayers;

    // cria players humanos
    this.players = Array.from({ length: numPlayers }, (_, i) => new Player(i));

    // cria dinos
    this.dinos = DINOSAURS.map(d => new Dinosaur(d.id, d.label, d.species, d.img));

    // checkpoints
    this.checkpoints = CHECKPOINTS.map(
      c => new Checkpoint(c.pos, c.name, c.direction, c.desc)
    );

    this.turn = 0;
    this.finished = false;
    this.winner = null;
    this.finishOrder = [];
  }

  /** cria bots **/
  addBots() {
    this.dinos.forEach((dino) => {
      if (dino.owner === null) {
        const botId = this.players.length;
        const bot = new Player(botId, `Bot ${botId + 1}`);
        bot.isBot = true;
        bot.dinoId = dino.id;
        dino.owner = botId;
        this.players.push(bot);
      }
    });
  }

  get currentPlayer() {
    return this.players[this.turn];
  }

  get currentDino() {
    return this.dinos.find(d => d.owner === this.turn);
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  playTurn() {
    const player = this.currentPlayer;
    const dino = this.currentDino;
    if (!dino || player.hasFinished()) {
      this.nextTurn();
      return { log: null, extra: false };
    }

    const roll = this.rollDice();
    const oldPos = dino.pos || 0;
    dino.pos = (dino.pos || 0) + roll;
    let log = `${player.name} (${dino.label}) tirou ${roll} e foi de ${oldPos} → ${dino.pos}.`;

    // Fim 
    if (dino.pos > TRACK_LENGTH) {
      dino.pos = TRACK_LENGTH;
      this.registerFinish(player);
      this.nextTurn();
      return { log: log + " 🏁 Chegou no final!", extra: false };
    }

    // checkpoint 
    const checkpoint = this.checkpoints.find(c => c.pos === dino.pos);
    if (checkpoint) {
      log += ` Caiu em **${checkpoint.name}**: ${checkpoint.desc} Precisa rolar novamente (${checkpoint.direction}).`;
      return { log, extra: true, checkpoint };
    }

    // turno normal
    this.nextTurn();
    return { log, extra: false };
  }

  /** Efeito de checkpoint */
  resolveCheckpoint(dino, checkpoint) {
    const roll = Math.ceil(this.rollDice() / 2);
    const before = dino.pos;
    let log = "";

    if (checkpoint.direction === "forward") {
      dino.pos += roll;
      log = `Evento em **${checkpoint.name}**: ${checkpoint.desc} (rolou ${roll}) → avançou de ${before} para ${dino.pos}.`;
    } else if (checkpoint.direction === "backward") {
      dino.pos -= roll;
      if (dino.pos < 1) dino.pos = 1;
      log = `Evento em **${checkpoint.name}**: ${checkpoint.desc} (rolou ${roll}) → voltou de ${before} para ${dino.pos}.`;
    }

    if (dino.pos > TRACK_LENGTH) {
      dino.pos = TRACK_LENGTH;
      this.registerFinish(this.currentPlayer);
      this.nextTurn();
      log += " 🏁 Chegou no final!";
      return { log, extra: false };
    }

    this.nextTurn();
    return { log, extra: false };
  }

  /** Marca chegada e apostas */
  registerFinish(player) {
    if (!this.finishOrder.includes(player.id)) {
      this.finishOrder.push(player.id);
      player.finishedAt = this.finishOrder.length;

      // define vencedor
      if (this.finishOrder.length === 1) {
        this.winner = player.id;
      }

      // todos terminaram -> aplica resultado de apostas
      if (this.finishOrder.length === this.players.length) {
        this.finished = true;

        this.players.forEach(p => {
          if (p.isBot || !p.bet || p.bet <= 0) return;

          const place = this.finishOrder.indexOf(p.id) + 1;
          switch (place) {
            case 1:
              p.profit = p.bet * 2;
              break;
            case 2:
              p.profit = p.bet * 0.5;
              break;
            case 3:
            case 4:
              p.profit = 0;
              break;
            case 5:
              p.profit = -p.bet * 0.5;
              break;
            case 6:
              p.profit = -p.bet;
              break;
            default:
              p.profit = 0;
          }
        });
      }
    }
  }

  nextTurn() {
    if (this.finished) return;
    this.turn = (this.turn + 1) % this.players.length;
    while (this.players[this.turn].hasFinished() && !this.finished) {
      this.turn = (this.turn + 1) % this.players.length;
    }
  }

  autoPlay() {
    while (!this.finished && this.currentPlayer.isBot) {
      this.playTurn();
    }
  }

  toJSON() {
    return {
      numPlayers: this.numPlayers,
      players: this.players,
      dinos: this.dinos,
      turn: this.turn,
      finished: this.finished,
      winner: this.winner,
      finishOrder: this.finishOrder
    };
  }

  static fromJSON(data) {
    const game = new Game(data.numPlayers);
    game.players = data.players.map(
      p => Object.assign(new Player(p.id, p.name, p.bet, p.dinoId), p)
    );
    game.dinos = data.dinos.map(
      d => Object.assign(new Dinosaur(d.id, d.label, d.species, d.img), d)
    );
    game.turn = data.turn;
    game.finished = data.finished;
    game.winner = data.winner;
    game.finishOrder = data.finishOrder || [];
    return game;
  }
}

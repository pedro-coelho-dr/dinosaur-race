export default class Player {
  constructor(id, name = "", bet = 0, dinoId = null) {
    this.id = id;
    this.name = name;
    this.bet = bet;
    this.dinoId = dinoId;
    this.position = 0;
    this.skipTurn = false;
    this.finishedAt = null;
  }

  hasFinished() {
    return this.finishedAt !== null;
  }
}

export default class Checkpoint {
  constructor(pos, name, direction, desc) {
    this.pos = pos;
    this.name = name;
    this.direction = direction;
    this.desc = desc;
  }

  trigger(player) {
    return {
      player,
      pos: this.pos,
      direction: this.direction,
      desc: this.desc
    };
  }
}

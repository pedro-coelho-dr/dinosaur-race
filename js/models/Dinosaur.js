export default class Dinosaur {
  constructor(id, label, species, img) {
    this.id = id;
    this.label = label;
    this.species = species;
    this.img = img;
    this.pos = 0;
    this.owner = null;
  }
}

/**
 * Class to handle managing generations
 * and creating new players.
 */
class GeneticAlgorithm {
  perGeneration = 20;
  curGeneration = 0;
  lastGeneration = [];
  crossover = Math.floor(this.perGeneration * 0.3);

  constructor(tRexWrap) {
    this.tRexWrap = tRexWrap;
  }

  nextGeneration(xInitialPos = 0) {
    this.calculateFitness();

	  console.log(`Creating generation #${this.curGeneration + 1}`);

    const players = [];
    for (let index = 0; index < this.perGeneration; index++) {
      const trex = new TrexPlayer(
        this.tRexWrap.canvas,
        this.tRexWrap.spritePos,
        this.reproduceBrain()
      );
      trex.xInitialPos = xInitialPos;
      players.push(trex);
    }

    this.cleanUp();
    this.curGeneration++;
    this.lastGeneration = this.lastGeneration.slice(0, this.crossover);

    return players;
  }

  calculateFitness() {
    if (this.lastGeneration.length) {
      let sum = 0;

      for (const player of this.lastGeneration) {
        sum += player.score;
      }

      for (const player of this.lastGeneration) {
        player.fitness = player.score / sum;
      }

      console.log(
        `Average score for generation #${this.curGeneration} is ${Math.round(sum / this.lastGeneration.length)}`
      );

      this.lastGeneration.sort(this.compare);
    }
  }

  cleanUp() {
    if (this.lastGeneration.length) {
      for (let i = this.crossover; i < this.lastGeneration.length; i++) {
        this.lastGeneration[i].brain.dispose();
      }
    }
  }

  reproduceBrain() {
    if (this.lastGeneration.length) {
      const brainA = this.pickOne();
      const brainB = this.pickOne();
      const childBrain = brainA.crossover(brainB);
      childBrain.mutate(0.1);

      return childBrain;
    }
    return;
  }

  // Pick one parent probability according to normalized fitness
  pickOne() {
    let index = 0;
    let r = Math.random(1);
    while (r > 0) {
      r -= this.lastGeneration[index].fitness;
      index++;
    }
    index--;
    const player = this.lastGeneration[index];
    // console.log(
    //   `Player picked with score ${player.score} and fitness ${player.fitness}`
    // );
    return player.brain;
  }

  pickBest() {
    const sorted = this.lastGeneration.sort((a,b) => b.fitness - a.fitness);

    return sorted[0].brain;
  }

  compare(a, b) {
    if (a.fitness < b.fitness) {
      return 1;
    }
    if (a.fitness > b.fitness) {
      return -1;
    }
    return 0;
  }
}

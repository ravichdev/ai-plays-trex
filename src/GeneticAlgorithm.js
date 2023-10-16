/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
import TRexPlayer from './TRexPlayer';

/**
 * Class to handle managing generations
 * and creating new players.
 */
export default class GeneticAlgorithm {
  perGeneration = 20;

  curGeneration = 0;

  lastGeneration = [];

  // keep 20% of best players between generations
  crossover = Math.floor(this.perGeneration * 0.2);

  constructor(tRexWrap) {
    this.tRexWrap = tRexWrap;
  }

  nextGeneration(xInitialPos = 0) {
    this.calculateFitness();

    console.log(`Creating generation #${this.curGeneration + 1}`);

    const players = [];
    for (let index = 0; index < this.perGeneration; index++) {
      const trex = new TRexPlayer(
        this.tRexWrap.canvas,
        this.tRexWrap.spritePos,
        this.reproduceBrain(),
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
      const thisGeneration = this.lastGeneration.slice(this.crossover);

      for (const player of thisGeneration) {
        sum += player.score;
      }

      for (const player of thisGeneration) {
        player.fitness = player.score / sum;
      }

      const average = Math.round(sum / thisGeneration.length);
      thisGeneration.sort(this.compare);
      console.log(
        `Average score for generation #${this.curGeneration} is ${average}. High score is ${thisGeneration[0].score}`,
      );

      window.runner.highScores.push(thisGeneration[0].score);
      window.runner.averageScores.push(average);
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
      const brainA = this.pickBest();
      const brainB = this.pickBest(true);
      const childBrain = brainA.crossover(brainB);
      childBrain.mutate(0.05);

      return childBrain;
    }

    return null;
  }

  pickBest(rand = false) {
    const sorted = this.lastGeneration.sort(this.compare);

    // randomly pick a player ranking between 1 and 5
    if (rand) {
      const index = Math.round(Math.random() * (5 - 1) + 1);
      return sorted[index].brain;
    }

    // pick the best player
    return sorted[0].brain;
  }

  compare(a, b) {
    return b.fitness - a.fitness;
  }
}

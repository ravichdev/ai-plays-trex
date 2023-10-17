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
  // Set the nn models/players per generation
  perGeneration = 20;

  // Track the generation count
  curGeneration = 0;

  // Track all players from last generation
  lastGeneration = [];

  // keep 20% of best players between generations
  crossover = Math.floor(this.perGeneration * 0.2);

  constructor(tRexWrap) {
    this.tRexWrap = tRexWrap;
  }

  /**
   * Create a next generation of players
   */
  nextGeneration(xInitialPos = 0) {
    this.calculateFitness();

    console.log(`Creating generation #${this.curGeneration + 1}`);

    const players = [];
    // generate new players
    for (let index = 0; index < this.perGeneration; index++) {
      const trex = new TRexPlayer(
        this.tRexWrap.canvas, // the canvas ref
        this.tRexWrap.spritePos, // the sprite pos
        this.reproduceBrain(), // reproduce a new brain
      );
      trex.xInitialPos = xInitialPos;
      players.push(trex);
    }

    // cleanup used resources
    this.cleanUp();
    this.curGeneration++;

    // keep the best performing players across generations, limit them to the crossover limit
    this.lastGeneration = this.lastGeneration.slice(0, this.crossover);

    return players;
  }

  /**
   * Calculate fitness of each player in the generation
   */
  calculateFitness() {
    if (this.lastGeneration.length) {
      // pick only players from this generation
      const thisGeneration = this.lastGeneration.slice(this.crossover);

      // calculate player fitness
      const sum = thisGeneration.reduce((accumulator, object) => accumulator + object.score, 0);
      for (const player of thisGeneration) {
        player.fitness = player.score / sum;
      }

      // sort the players in desc order based on their fitness
      thisGeneration.sort(this.compare);

      // calculate average score
      const average = Math.round(sum / thisGeneration.length);
      console.log(
        `Average score for generation #${this.curGeneration} is ${average}. High score is ${thisGeneration[0].score}`,
      );

      // Set high and average scores for charting
      window.runner.highScores.push(thisGeneration[0].score);
      window.runner.averageScores.push(average);
    }
  }

  /**
   * Reproduce a brain by crossover of the best player and a random player
   * from the top 5, then mutate the brain
   */
  reproduceBrain() {
    if (this.lastGeneration.length) {
      // pick the best brain across generations
      const brainA = this.pickBest();

      // pick a random best player from top 5 players
      const brainB = this.pickBest(true);

      // create a child brain by crossover between best and the random best players
      const childBrain = brainA.crossover(brainB);

      // mutate the brain
      childBrain.mutate(0.1);

      // return the brain
      return childBrain;
    }

    return null;
  }

  /**
   * Pick the best brain so far or
   * pick a brain from the top 5 best brains.
   */
  pickBest(rand = false) {
    // Ensure the players are sorted based on their fitness
    const sorted = this.lastGeneration.sort(this.compare);

    // randomly pick a player ranking between 1 and 5
    if (rand) {
      const index = Math.round(Math.random() * (5 - 1) + 1);
      return sorted[index].brain;
    }

    // pick the best player, it's always the first player in the sorted list
    return sorted[0].brain;
  }

  /**
   * Cleanup all resources used by the last generation
   */
  cleanUp() {
    if (this.lastGeneration.length) {
      for (let i = this.crossover; i < this.lastGeneration.length; i++) {
        this.lastGeneration[i].brain.dispose();
      }
    }
  }

  /**
   * Compare the model performance using it's fitness
   */
  compare(a, b) {
    return b.fitness - a.fitness;
  }
}

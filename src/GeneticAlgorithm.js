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

    // cleanup used resources
    this.cleanUp();
    this.curGeneration++;

    // keep the best performing players across generations, limit them to the crossover limit
    this.lastGeneration = [];

    return players;
  }

  /**
   * Calculate fitness of each player in the generation
   */
  calculateFitness() {
    if (this.lastGeneration.length) {
      // calculate player fitness

      // sort the players in desc order based on their fitness

      // calculate average score

      // Set high and average scores for charting

    }
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
   * Reproduce a brain by crossover of the best player and a random player
   * from the top 5, then mutate the brain
   */
  reproduceBrain() {
    if (this.lastGeneration.length) {
      // pick the best brain across generations

      // pick a random best player from top 5 players

      // create a child brain by crossover between best and the random best players

      // mutate the brain

      // return the brain
    }

    return null;
  }

  /**
   * Pick the best brain so far or
   * pick a brain from the top 5 best brains.
   */
  pickBest(rand = false) {
    // randomly pick a player ranking between 1 and 5
    if (rand) {
    }

    // pick the best player
  }

  /**
   * Compare the model performance using it's fitness
   */
  compare(a, b) {
    return b.fitness - a.fitness;
  }
}

/**
 * Class to wrap all trex instances in a generation.
 */

import GeneticAlgorithm from './GeneticAlgorithm';

const { Trex } = window;

export default class TRexWrap {
  firstTrex = null;

  tRexs = [];

  crashedTrexs = [];

  constructor(canvas, spritePos) {
    this.canvas = canvas;
    this.spritePos = spritePos;
    this.ga = new GeneticAlgorithm(this);
    this.generateTrexs();
    // eslint-disable-next-line prefer-destructuring
    this.firstTrex = this.tRexs[0];
  }

  generateTrexs(xInitialPos) {
    this.tRexs = this.ga.nextGeneration(xInitialPos);
  }

  get playingIntro() {
    return this.firstTrex.playingIntro;
  }

  get config() {
    return this.firstTrex.config;
  }

  // eslint-disable-next-line grouped-accessor-pairs
  set playingIntro(value) {
    // eslint-disable-next-line no-return-assign, no-param-reassign
    this.tRexs.forEach((tRex) => (tRex.playingIntro = value));
  }

  get jumpCount() {
    return this.firstTrex.jumpCount;
  }

  get blinkCount() {
    return this.firstTrex.blinkCount;
  }
}

// If a method in the TrexWrap is triggered, iterate through all
// the trexs in the generation and invoke the method for each trex.
Object.keys(Trex.prototype).forEach(
  // eslint-disable-next-line no-return-assign, func-names
  (method) => (TRexWrap.prototype[method] = function (...args) {
    this.tRexs.forEach((tRex) => tRex[method](...args));
  }),
);

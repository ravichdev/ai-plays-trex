/**
 * Class to handle a trex decisions/movements.
 */

import NeuralNetwork from './NeuralNetwork';

const { Trex } = window;

export default class TRexPlayer extends Trex {
  constructor(canvas, spritePos, brain) {
    super(canvas, spritePos);

    // track the player's score and fitness
    this.score = 0;
    this.fitness = 0;

    // Player can be created with an existing neural network
    if (brain) {
      this.brain = brain;
    } else {
      // Create a new neural network
      this.brain = new NeuralNetwork();
    }
  }

  /**
   * Take an action based on the input data and the result from the model's prediction
   * this method is invoked for every frame update in the canvas element
   */
  act(data, currentSpeed) {
    // Make a prediction from the nn and get the results
    const results = this.brain.classify(data);

    if (!this.jumping && !this.ducking && results[0].label === 'jump') {
      // if the prediction is to jump, ensure we are not already jumping or ducking
      this.startJump(currentSpeed);
    } else if (results[0].label === 'duck') {
      // if the prediction is to duck
      if (this.jumping) {
        // if we are already jumping, try to drop
        this.setSpeedDrop();
      } else if (!this.jumping && !this.ducking) {
        // duck!
        this.setDuck(true);
      }
    }
  }
}

/**
 * Class to handle a trex decisions/movements.
 */
class TrexPlayer extends Trex {
  constructor(canvas, spritePos, brain) {
    super(canvas, spritePos);

    this.score = 0;
    this.fitness = 0;

    // Player can be created with an existing neural network
    if (brain) {
      this.brain = brain;
    } else {
      // Create a new neural network
      const options = {
        inputs: 7,
        outputs: ["jump", "duck", "na"],
        task: "classification",
        noTraining: true,
      };
      this.brain = ml5.neuralNetwork(options);
    }
  }

  act(data, currentSpeed) {
    const results = this.brain.classifySync(data);

    if (!this.jumping && !this.ducking && results[0].label === "jump") {
      this.startJump(currentSpeed);
    } else if (results[0].label === "duck") {
      if (this.jumping) {
        this.setSpeedDrop();
      } else if (!this.jumping && !this.ducking) {
        this.setDuck(true);
      }
    }
  }
}

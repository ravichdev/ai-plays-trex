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
				outputs: ['jump', 'duck', 'na'],
				task: 'classification',
				noTraining: true
			}
			this.brain = ml5.neuralNetwork(options);
		}
	}

	// Mutate the brain
	mutate() {
		// 10% mutation rate
		this.brain.mutate(0.1);
	}

	act(obstacle, currentSpeed) {
		const results = this.brain.classifySync(obstacle);

		if(['jump', 'duck'].includes(results[0].label)) {
			return results[0].label;
		}

		return '';
	}

	out(score) {
		this.score = score;
	}
}
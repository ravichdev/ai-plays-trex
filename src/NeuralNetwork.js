import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

const DEFAULTS = {
  inputs: 7,
  outputs: ['jump', 'duck', 'na'],
};

export default class NeuralNetwork {
  constructor(options) {
    this.options = {
      ...DEFAULTS,
      ...(options || {}),
    };

    this.model = tf.sequential();

    this.init();
  }

  init() {
    this.createAndCompileModel();
  }

  createAndCompileModel() {
    const { inputs, outputs, debug } = this.options;
    const inputShape = [Array.isArray(inputs) ? inputs.length : inputs];
    const outputUnits = Array.isArray(outputs) ? outputs.length : outputs;

    this.model.add(tf.layers.dense({ inputShape, units: 16, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: outputUnits, activation: 'softmax' }));

    this.model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: tf.train.sgd(0.1),
      metrics: ['accuracy'],
    });

    if (debug) {
      tfvis.show.modelSummary(
        {
          name: 'Model Summary',
        },
        this.model,
      );
    }
  }

  classify(input) {
    const { inputs, outputs } = this.options;
    if (typeof inputs === 'number' && input.length === inputs) {
      // eslint-disable-next-line no-param-reassign
      input = [input];
    }

    const formattedInput = tf.tensor(input);
    const output = tf.tidy(() => this.model.predict(formattedInput));
    const result = output.arraySync();

    output.dispose();

    const formatted = result.map((unformatted) => outputs.map((item, idx) => ({
      label: item,
      confidence: unformatted[idx],
    })).sort((a, b) => b.confidence - a.confidence));

    return formatted[0];
  }

  /**
   * Mutate a model with a given rate.
   * @param {number} rate
   */
  mutate(rate = 0.1) {
    tf.tidy(() => {
      const weights = this.model.getWeights();
      const mutatedWeights = [];
      // iterate through each weight
      for (let i = 0; i < weights.length; i += 1) {
        const tensor = weights[i];
        const { shape } = weights[i];
        const values = tensor.dataSync().slice();
        // Iterate through the values and randomly update some of them.
        for (let j = 0; j < values.length; j += 1) {
          if (Math.random() < rate) {
            // generate a random value using gaussian distribution and limit it between -1 and 1
            values[j] = Math.min(Math.max(values[j] + this.randomGaussian(), -1), 1);
          }
        }
        // create a new tensor with the updates weights
        const newTensor = tf.tensor(values, shape);
        mutatedWeights[i] = newTensor;
      }
      this.model.setWeights(mutatedWeights);
    });
  }

  crossover(other) {
    const nnCopy = this.copy();
    tf.tidy(() => {
      const weightsA = nnCopy.model.getWeights();
      const weightsB = other.model.getWeights();
      const childWeights = [];
      // Iterate through the tensors 
      for (let i = 0; i < weightsA.length; i += 1) {
        const tensorA = weightsA[i];
        const tensorB = weightsB[i];
        const { shape } = weightsA[i];
        const valuesA = tensorA.dataSync().slice();
        const valuesB = tensorB.dataSync().slice();
        // Iterate through the first model weights and randomly set some values from second model
        for (let j = 0; j < valuesA.length; j += 1) {
          if (Math.random() < 0.5) {
            valuesA[j] = valuesB[j];
          }
        }
        const newTensor = tf.tensor(valuesA, shape);
        childWeights[i] = newTensor;
      }
      nnCopy.model.setWeights(childWeights);
    });

    return nnCopy;
  }

  copy() {
    const nnCopy = new NeuralNetwork(this.options);
    return tf.tidy(() => {
      const weights = this.model.getWeights();
      const weightCopies = [];
      for (let i = 0; i < weights.length; i += 1) {
        weightCopies[i] = weights[i].clone();
      }
      nnCopy.model.setWeights(weightCopies);
      return nnCopy;
    });
  }

  // Src https://github.com/processing/p5.js/blob/master/src/math/random.js#L168
  // eslint-disable-next-line class-methods-use-this
  randomGaussian(mean = 0, sd = 1) {
    const randomFloat = (min = 0, max = 1) => (Math.random() * (max - min)) + min;

    let y1;
    let y2;
    let x1;
    let x2;
    let w;
    let previous;
    if (previous) {
      y1 = y2;
      previous = false;
    } else {
      do {
        x1 = randomFloat(0, 2) - 1;
        x2 = randomFloat(0, 2) - 1;
        w = (x1 * x1) + (x2 * x2);
      } while (w >= 1);
      w = Math.sqrt((-2 * Math.log(w)) / w);
      y1 = x1 * w;
      y2 = x2 * w;
      previous = true;
    }
    return (y1 * sd) + mean;
  }

  /**
   * dispose and release the memory for the model
   */
  dispose() {
    this.model.dispose();
  }
}

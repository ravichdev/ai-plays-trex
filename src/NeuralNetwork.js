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

    this.createAndCompileModel();
  }

  /**
   * Create and compile the neural network model.
   */
  createAndCompileModel() {
    // Read the inputs, outputs and reshape them
    const { inputs, outputs, debug } = this.options;
    const inputShape = [Array.isArray(inputs) ? inputs.length : inputs];
    const outputUnits = Array.isArray(outputs) ? outputs.length : outputs;

    // Create the model

    // Define the model layers

    // compile the model

    // Display model summary in debug mode
    if (debug) {
      tfvis.show.modelSummary(
        {
          name: 'Model Summary',
        },
        this.model,
      );
    }
  }

  /**
   * Classify the input data and return formatted results
   * sorted by highest to lowest confidence
   */
  classify(input) {
    const { inputs, outputs } = this.options;

    // Reshape the inputs if required
    if (typeof inputs === 'number' && input.length === inputs) {
      // eslint-disable-next-line no-param-reassign
      input = [input];
    }

    // create a tensor with the input data

    // invoke the model's predict method with the input

    // Convert the output as array and sipose the tf object

    // Sort the predictions by highest to lowest confidence and label them

    // return the result
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

  /**
   * Crossover the current nn model with a provided nn model.
   */
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

  /**
   * Create a copy of the current nn model
   */
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

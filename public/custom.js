//******************************************************************************
/**
 * T-rex game character.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} spritePos Positioning within image sprite.
 * @constructor
 */
class TrexWrap {
  firstTrex = null;
  tRexs = [];
  crashedTrexs = [];

  constructor(canvas, spritePos) {
    this.canvas = canvas;
    this.spritePos = spritePos;
    this.ga = new GeneticAlgorithm(this);
    this.generateTrexs();
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

  set playingIntro(value) {
    this
      .tRexs
      .forEach(tRex => tRex.playingIntro = value);
  }

  get jumpCount() {
    return this.firstTrex.jumpCount;
  }

  get blinkCount() {
    return this.firstTrex.blinkCount;
  }
}

Object
  .keys(Trex.prototype)
  .forEach(method => TrexWrap.prototype[method] = function (...args) {
    this
      .tRexs
      .forEach(tRex => tRex[method](...args));
  });

class CustomRunner extends Runner {
  bestDistance = 0;
  init() {
    super.init();
    this.tRex = new TrexWrap(this.canvas, this.spriteDef.TREX);
    window.map = p5.prototype.map;
  }

  isArcadeMode() {
    return true;
  }

  update() {
    this.updatePending = false;

    const now = getTimeStamp();
    let deltaTime = now - (this.time || now);

    this.time = now;

    if (this.playing) {
      this.clearCanvas();

      this
        .tRex
        .tRexs
        .forEach(tRex => {
          if (tRex.jumping) {
            tRex.updateJump(deltaTime);
          }
        });

      this.runningTime += deltaTime;
      const hasObstacles = this.runningTime > this.config.CLEAR_TIME;

      // First jump triggers the intro.
      if (this.tRex.firstTrex.jumpCount === 1 && !this.playingIntro) {
        this.playIntro();
      }

      // The horizon doesn't move until the intro is over.
      if (this.playingIntro) {
        this
          .horizon
          .update(0, this.currentSpeed, hasObstacles);
      } else {
        const showNightMode = this.isDarkMode ^ this.inverted;
        deltaTime = !this.activated
          ? 0
          : deltaTime;
        this
          .horizon
          .update(deltaTime, this.currentSpeed, hasObstacles, showNightMode);
      }

      this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;

      if (this.currentSpeed < this.config.MAX_SPEED) {
        this.currentSpeed += this.config.ACCELERATION;
      }

      const tRexs = this.tRex.tRexs;
      for (let index = 0; index < tRexs.length; index++) {
        let tRex = tRexs[index];

        let obstacle = this.horizon.obstacles[0];

        if (obstacle) {
          let obstacleBox = new CollisionBox(
            obstacle.xPos + 1,
            obstacle.yPos + 1,
            obstacle.typeConfig.width * obstacle.size - 2,
            obstacle.typeConfig.height - 2);

          const tRexBox = new CollisionBox(
            tRex.xPos + 1,
            tRex.yPos + 1,
            tRex.config.WIDTH - 2,
            tRex.config.HEIGHT - 2);

          let tRexYPos = runner.dimensions.HEIGHT - tRexBox.y - tRexBox.height;
          let obstacleYPos = runner.dimensions.HEIGHT - obstacleBox.y - obstacleBox.height;

          tRexYPos = tRexYPos < 0 ? 0 : tRexYPos;
          obstacleYPos = obstacleYPos < 0 ? 0 : obstacleYPos;

          const input = [
            // map(tRexBox.x, 0, runner.dimensions.WIDTH, 0, 1),
            // map(tRexBox.x + tRexBox.width, 0, runner.dimensions.WIDTH, 0, 1),
            map(tRexYPos, 0, runner.dimensions.HEIGHT, 0, 1),
            map(tRexYPos + tRexBox.height, 0, runner.dimensions.HEIGHT, 0, 1),
            map(obstacleBox.x, 0, runner.dimensions.WIDTH, 0, 1),
            map(obstacleBox.x + obstacleBox.width, 0, runner.dimensions.WIDTH, 0, 1),
            map(obstacleYPos, 0, runner.dimensions.HEIGHT, 0, 1),
            map(obstacleYPos + obstacleBox.height, 0, runner.dimensions.HEIGHT, 0, 1),
            map(this.currentSpeed, 5, 100, 0, 1)
          ];

          tRex.act(input, this.currentSpeed);
        }

        const collision = hasObstacles && checkForCollision(this.horizon.obstacles[0], tRex);

        if (collision) {
          tRex.update(100, Trex.status.CRASHED);
          tRex = tRexs.splice(index, 1).pop();
          index--;

          const distance = this.distanceMeter.getActualDistance(this.distanceRan);
          tRex.score = distance;
          this.tRex.ga.lastGeneration.push(tRex);

          if(this.distanceRan > this.bestDistance) {
            this.bestDistance = this.distanceRan;
            this.distanceMeter.setHighScore(this.bestDistance);
          }

          if(!tRexs.length) {
            this.stop();
            this.raqId = 0;
            this.tRex.generateTrexs(this.tRex.firstTrex.xInitialPos);
            this.restart();
          }
        }
      }

      const playAchievementSound = this
        .distanceMeter
        .update(deltaTime, Math.ceil(this.distanceRan));

      if (playAchievementSound) {
        this.playSound(this.soundFx.SCORE);
      }

      // Night mode.
      if (this.invertTimer > this.config.INVERT_FADE_DURATION) {
        this.invertTimer = 0;
        this.invertTrigger = false;
        this.invert(false);
      } else if (this.invertTimer) {
        this.invertTimer += deltaTime;
      } else {
        const actualDistance = this
          .distanceMeter
          .getActualDistance(Math.ceil(this.distanceRan));

        if (actualDistance > 0) {
          this.invertTrigger = !(actualDistance % this.config.INVERT_DISTANCE);

          if (this.invertTrigger && this.invertTimer === 0) {
            this.invertTimer += deltaTime;
            this.invert(false);
          }
        }
      }
    }

    if (this.playing || (!this.activated && this.tRex.tRexs && this.tRex.firstTrex.blinkCount < Runner.config.MAX_BLINK_COUNT)) {
      this
        .tRex
        .update(deltaTime);
      this.scheduleNextUpdate();
    }
  }
}

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

	act(data, currentSpeed) {
    const results = this.brain.classifySync(data);

    if(!this.jumping && !this.ducking && results[0].label === 'jump') {
      this.startJump(currentSpeed);
    }else if(results[0].label === 'duck') {
      if (this.jumping) {
        this.setSpeedDrop();
      } else if (!this.jumping && !this.ducking) {
        this.setDuck(true);
      }
    }
	}
}

class GeneticAlgorithm {
  perGeneration = 20;
  curGeneration = 0;
  lastGeneration = [];
  crossover = Math.floor(this.perGeneration * 0.3);

  constructor(tRexWrap) {
    this.tRexWrap = tRexWrap;
  }

  nextGeneration(xInitialPos = 0) {
    console.log(`Creating generation #${this.curGeneration + 1}`)
    this.calculateFitness();

    const players = [];
    for (let index = 0; index < this.perGeneration; index++) {
      const trex = new TrexPlayer(this.tRexWrap.canvas, this.tRexWrap.spritePos, this.reproduceBrain());
      trex.xInitialPos = xInitialPos;
      players.push(trex);
    }

    this.cleanUp();
    this.curGeneration++;
    this.lastGeneration = this.lastGeneration.slice(0, this.crossover);

    return players;
  }

  calculateFitness() {
    if(this.lastGeneration.length) {
      let sum = 0;

      for (const player of this.lastGeneration) {
        sum += player.score;
      }

      for (const player of this.lastGeneration) {
        player.fitness = player.score / sum;
      }

      console.log(`Average score is ${Math.round(sum/this.lastGeneration.length)}`);

      function compare( a, b ) {
        if ( a.fitness < b.fitness ){
          return 1;
        }
        if ( a.fitness > b.fitness ){
          return -1;
        }
        return 0;
      }

      this.lastGeneration.sort(compare);
      console.log('Total; brains ' + this.lastGeneration.length)
    }
  }

  cleanUp() {
    if(this.lastGeneration.length) {
      for(let i = this.crossover; i < this.lastGeneration.length; i++) {
        this.lastGeneration[i].brain.dispose();
      }
    }
  }

  reproduceBrain() {
    if(this.lastGeneration.length) {
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
    console.log(`Player picked with score ${player.score} and fitness ${player.fitness}`)
    return player.brain;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  window.runner = new CustomRunner('#runner');
});

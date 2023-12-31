/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
import Chart from 'chart.js/auto';
import TRexWrap from './TRexWrap';

// eslint-disable-next-line max-len
const {
  Runner, DistanceMeter, getTimeStamp, CollisionBox, Trex, checkForCollision,
} = window;

// eslint-disable-next-line max-len, no-mixed-operators
const map = (value, fromLow, fromHigh, toLow, toHigh) => (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;

/**
 * Class to handle multiple trex players.
 */
export default class CustomRunner extends Runner {
  bestDistance = 0;

  init() {
    super.init();
    this.tRex = new TRexWrap(this.canvas, this.spriteDef.TREX);
    this.highScores = [];
    this.averageScores = [];
    this.chart = document.getElementById('chart').getContext('2d');

    super.setArcadeModeContainerScale();

    const xPos = this.dimensions.WIDTH - (DistanceMeter.dimensions.DEST_WIDTH
      * (DistanceMeter.config.MAX_DISTANCE_UNITS + 1));

    this.textDimensions = {
      sWidth: 14,
      sHeight: 14,
      destX: 0,
      destY: 10,
      yPos: 15,
      xPosG: 654,
      xPosA: 680,
      xOffset: DistanceMeter.dimensions.WIDTH * 7,
      xPos: xPos - (DistanceMeter.config.MAX_DISTANCE_UNITS * 5)
      * DistanceMeter.dimensions.WIDTH,
    };
  }

  isArcadeMode() {
    return true;
  }

  setArcadeModeContainerScale() {
    return false;
  }

  playSound() {
    // do nothing
  }

  playIntro() {
    if (!this.activated && !this.crashed) {
      this.playingIntro = true;
      this.tRex.playingIntro = true;
      this.setPlayStatus(true);
      this.activated = true;
      this.startGame();
    } else if (this.crashed) {
      this.restart();
    }
  }

  update() {
    this.updatePending = false;

    const now = getTimeStamp();
    let deltaTime = now - (this.time || now);

    this.time = now;

    if (this.playing) {
      this.clearCanvas();

      this.tRex.tRexs.forEach((tRex) => {
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
        this.horizon.update(0, this.currentSpeed, hasObstacles);
      } else {
        // eslint-disable-next-line no-bitwise
        const showNightMode = this.isDarkMode ^ this.inverted;
        deltaTime = !this.activated ? 0 : deltaTime;
        this.horizon.update(
          deltaTime,
          this.currentSpeed,
          hasObstacles,
          showNightMode,
        );
      }

      this.distanceRan += (this.currentSpeed * deltaTime) / this.msPerFrame;

      if (this.currentSpeed < this.config.MAX_SPEED) {
        this.currentSpeed += this.config.ACCELERATION;
      }

      const { tRexs } = this.tRex;
      for (let index = 0; index < tRexs.length; index++) {
        let tRex = tRexs[index];

        const obstacle = this.horizon.obstacles[0];

        if (obstacle) {
          const obstacleBox = new CollisionBox(
            obstacle.xPos + 1,
            obstacle.yPos + 1,
            obstacle.typeConfig.width * obstacle.size - 2,
            obstacle.typeConfig.height - 2,
          );

          const tRexBox = new CollisionBox(
            tRex.xPos + 1,
            tRex.yPos + 1,
            tRex.config.WIDTH - 2,
            tRex.config.HEIGHT - 2,
          );

          let tRexYPos = this.dimensions.HEIGHT - tRexBox.y - tRexBox.height;
          let obstacleYPos = this.dimensions.HEIGHT - obstacleBox.y - obstacleBox.height;

          tRexYPos = tRexYPos < 0 ? 0 : tRexYPos;
          obstacleYPos = obstacleYPos < 0 ? 0 : obstacleYPos;

          const input = [
            map(tRexYPos, 0, this.dimensions.HEIGHT, 0, 1),
            map(tRexYPos + tRexBox.height, 0, this.dimensions.HEIGHT, 0, 1),
            map(obstacleBox.x, 0, this.dimensions.WIDTH, 0, 1),
            map(
              obstacleBox.x + obstacleBox.width,
              0,
              this.dimensions.WIDTH,
              0,
              1,
            ),
            map(obstacleYPos, 0, this.dimensions.HEIGHT, 0, 1),
            map(
              obstacleYPos + obstacleBox.height,
              0,
              this.dimensions.HEIGHT,
              0,
              1,
            ),
            map(this.currentSpeed, 4, 100, 0, 1),
          ];

          tRex.act(input, this.currentSpeed);
        }

        const collision = hasObstacles && checkForCollision(this.horizon.obstacles[0], tRex);

        if (collision) {
          tRex.update(100, Trex.status.CRASHED);
          tRex = tRexs.splice(index, 1).pop();
          index--;

          const distance = this.distanceMeter.getActualDistance(
            this.distanceRan,
          );
          tRex.score = distance;
          this.tRex.ga.lastGeneration.push(tRex);

          if (this.distanceRan > this.bestDistance) {
            this.bestDistance = this.distanceRan;
            this.distanceMeter.setHighScore(this.bestDistance);
          }

          if (!tRexs.length) {
            this.stop();
            this.raqId = 0;
            this.tRex.generateTrexs(this.tRex.firstTrex.xInitialPos);
            this.gameOverPanel = { reset: () => {} };
            this.restart();
            this.drawChart();
          }
        }
      }

      const playAchievementSound = this.distanceMeter.update(
        deltaTime,
        Math.ceil(this.distanceRan),
      );

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
        const actualDistance = this.distanceMeter.getActualDistance(
          Math.ceil(this.distanceRan),
        );

        if (actualDistance > 0) {
          this.invertTrigger = !(actualDistance % this.config.INVERT_DISTANCE);

          if (this.invertTrigger && this.invertTimer === 0) {
            this.invertTimer += deltaTime;
            this.invert(false);
          }
        }
      }

      this.drawGen();
      this.drawAlive();
    }

    if (
      this.playing
      || (!this.activated
        && this.tRex.tRexs
        && this.tRex.firstTrex.blinkCount < Runner.config.MAX_BLINK_COUNT)
    ) {
      this.tRex.update(deltaTime);
      this.scheduleNextUpdate();
    }
  }

  drawGen() {
    this.canvasCtx.save();

    this.canvasCtx.font = 'bold 12px "Press Start 2P"';
    this.canvasCtx.fillStyle = '#444';
    this.canvasCtx.fillText(`GENERATION:${this.tRex.ga.curGeneration}`, this.textDimensions.destX + 70, this.textDimensions.destY + 12);

    this.canvasCtx.restore();
  }

  drawAlive() {
    this.canvasCtx.save();

    this.canvasCtx.font = 'bold 12px "Press Start 2P"';
    this.canvasCtx.fillStyle = '#444';
    this.canvasCtx.fillText(`ALIVE:${this.tRex.tRexs.length}`, this.textDimensions.destX + 250, this.textDimensions.destY + 12);

    this.canvasCtx.restore();
  }

  drawNumber(number, startX) {
    const digits = String(number).split('');
    for (let i = 0; i < digits.length; i++) {
      this.drawDigit(i, parseInt(digits[i], 10), startX);
    }
  }

  /**
   * Draw a digit to canvas.
   * @param {number} digitPos Position of the digit.
   * @param {number} value Digit value 0-9.
   */
  drawDigit(digitPos, value, startX = 0) {
    const sourceWidth = DistanceMeter.dimensions.WIDTH;
    const sourceHeight = DistanceMeter.dimensions.HEIGHT;
    let sourceX = DistanceMeter.dimensions.WIDTH * value;
    let sourceY = 0;

    const targetX = startX + digitPos * DistanceMeter.dimensions.DEST_WIDTH;
    const targetY = this.textDimensions.destY;
    const targetWidth = DistanceMeter.dimensions.WIDTH;
    const targetHeight = DistanceMeter.dimensions.HEIGHT;

    sourceX += this.spriteDef.TEXT_SPRITE.x;
    sourceY += this.spriteDef.TEXT_SPRITE.y;

    this.canvasCtx.save();

    this.canvasCtx.translate(this.textDimensions.xPos, 0);

    this.canvasCtx.drawImage(
      Runner.imageSprite,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
    );

    this.canvasCtx.restore();
  }

  drawChart() {
    if (this.chartObject) {
      this.chartObject.destroy();
    }
    this.chartObject = new Chart(this.chart, {
      type: 'line',
      data: {
        labels: Array(this.highScores.length)
          .fill(null)
          .map((x, i) => i + 1),
        datasets: [
          {
            label: 'High Score',
            data: this.highScores,
            fill: false,
            borderColor: 'red',
            backgroundColor: 'red',
            borderDash: [3, 1],
            pointRadius: 1,
            pointHoverRadius: 3,
          },
          {
            label: 'Average Score',
            data: this.averageScores,
            fill: true,
            borderColor: '#2193EE',
            backgroundColor: '#2193EE',
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        events: [], // Bug on chartJS /issues/3753
        animation: false,
        responsive: true,
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Generation',
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Score',
            },
          },
        },
      },
    });
  }
}

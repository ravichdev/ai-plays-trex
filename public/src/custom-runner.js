/**
 * Class to handle multiple trex players.
 */
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
        const showNightMode = this.isDarkMode ^ this.inverted;
        deltaTime = !this.activated ? 0 : deltaTime;
        this.horizon.update(
          deltaTime,
          this.currentSpeed,
          hasObstacles,
          showNightMode
        );
      }

      this.distanceRan += (this.currentSpeed * deltaTime) / this.msPerFrame;

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
            obstacle.typeConfig.height - 2
          );

          const tRexBox = new CollisionBox(
            tRex.xPos + 1,
            tRex.yPos + 1,
            tRex.config.WIDTH - 2,
            tRex.config.HEIGHT - 2
          );

          let tRexYPos = runner.dimensions.HEIGHT - tRexBox.y - tRexBox.height;
          let obstacleYPos =
            runner.dimensions.HEIGHT - obstacleBox.y - obstacleBox.height;

          tRexYPos = tRexYPos < 0 ? 0 : tRexYPos;
          obstacleYPos = obstacleYPos < 0 ? 0 : obstacleYPos;

          const input = [
            // map(tRexBox.x, 0, runner.dimensions.WIDTH, 0, 1),
            // map(tRexBox.x + tRexBox.width, 0, runner.dimensions.WIDTH, 0, 1),
            map(tRexYPos, 0, runner.dimensions.HEIGHT, 0, 1),
            map(tRexYPos + tRexBox.height, 0, runner.dimensions.HEIGHT, 0, 1),
            map(obstacleBox.x, 0, runner.dimensions.WIDTH, 0, 1),
            map(
              obstacleBox.x + obstacleBox.width,
              0,
              runner.dimensions.WIDTH,
              0,
              1
            ),
            map(obstacleYPos, 0, runner.dimensions.HEIGHT, 0, 1),
            map(
              obstacleYPos + obstacleBox.height,
              0,
              runner.dimensions.HEIGHT,
              0,
              1
            ),
            map(this.currentSpeed, 5, 100, 0, 1),
          ];

          tRex.act(input, this.currentSpeed);
        }

        const collision =
          hasObstacles && checkForCollision(this.horizon.obstacles[0], tRex);

        if (collision) {
          tRex.update(100, Trex.status.CRASHED);
          tRex = tRexs.splice(index, 1).pop();
          index--;

          const distance = this.distanceMeter.getActualDistance(
            this.distanceRan
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
            this.restart();
          }
        }
      }

      const playAchievementSound = this.distanceMeter.update(
        deltaTime,
        Math.ceil(this.distanceRan)
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
          Math.ceil(this.distanceRan)
        );

        if (actualDistance > 0) {
          this.invertTrigger = !(actualDistance % this.config.INVERT_DISTANCE);

          if (this.invertTrigger && this.invertTimer === 0) {
            this.invertTimer += deltaTime;
            this.invert(false);
          }
        }
      }
    }

    if (
      this.playing ||
      (!this.activated &&
        this.tRex.tRexs &&
        this.tRex.firstTrex.blinkCount < Runner.config.MAX_BLINK_COUNT)
    ) {
      this.tRex.update(deltaTime);
      this.scheduleNextUpdate();
    }
  }
}

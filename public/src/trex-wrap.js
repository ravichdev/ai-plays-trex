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
  
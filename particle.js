function Particle() {
	this.pos = new p5.Vector(width / 2, 0);
	
	let vx = boardWidth * 0.025;
  this.vel = new p5.Vector(random(-vx, vx), 0);
	
  this.acc = new p5.Vector(0, 0);
	this.gravity = random(0.1, 0.5);
	this.spinRate = random(-25, 25);
	this.spin = 0
	
	colorMode(HSB, 360);
	this.color = color(random(360), 360, 360);
	colorMode(RGB, 255);
	
	this.move = function() {
		this.acc.add(new p5.Vector(0, this.gravity));
    this.vel.mult(0.97);
    
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
		
		this.spin += this.spinRate;
	}
	
	this.display = function() {
		push();
		
		stroke(this.color);
		strokeWeight(5);
		
		translate(this.pos.x, this.pos.y);
		rotate(radians(this.spin));
		scale(3, 0.7);
		
		point(0, 0);
		
		pop();
	}
	
	this.isOutOfBounds = function() {
		return (this.pos.y > height);
	}
}
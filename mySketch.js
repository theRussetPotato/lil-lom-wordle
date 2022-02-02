function setup() {
	let myCanvas = createCanvas(windowWidth, windowHeight);
	background(100);
	console.log(myCanvas.canvas);
}

function draw() {
	ellipse(mouseX, mouseY, 20, 20);
}
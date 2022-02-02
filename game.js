const WORD_LENGTH = 5;
const MAX_CHANCES = 6;
const DEBUG_WORD = null;  // Set as null to not use it.

const WRONG_LETTER = 0;
const BAD_SPOT_LETTER = 1;
const CORRECT_LETTER = 2;

const CELL_PADDING = 5;
const BUTTON_SIZE = 40;
const BUTTONS_BOTTOM_MARGIN = 20;
const PARTICLES_SPAWN_COUNT = 60;

const BACKGROUND_COLOR = "#000000";
const TITLE_COLOR = "#FFFFFF";
const WON_MSG_COLOR = "#FFFFFF";
const GAMEOVER_MSG_COLOR = "#C83232";
const CELL_COLOR = "#000000";
const CELL_BORDER_COLOR = "#323232";
const CELL_BORDER_HIGHLIGHT_COLOR = "#7D7D7D";
const CELL_BORDER_WRONG_COLOR = "#7D3232";
const LETTER_COLOR = "#FFFFFF";
const LETTER_WRONG_COLOR = "#323232";
const LETTER_BAD_SPOT_COLOR = "#B4B45A";
const LETTER_CORRECT_COLOR = "#55AA5F";
const BUTTON_TEXT_COLOR = "#FFFFFF";
const BUTTON_BACK_COLOR = "#7D7D7D";

var particlesTimer = 0;
var wonStreak = 0;
var won = false;
var gameOver = false;
var particles = [];
var guesses = [];
var buttons = {};
var buttonColors = {};
var theWord;
var cellSize;
var letterSize;
var boardWidth;
var boardHeight;
var header;
var tada;
var sadTrombone;

var otherValidWords = [
	"adieu",
	"mochi",
	"plonk"
];

function preload() {
	soundFormats("wav", "mp3");
	tada = loadSound("tada.wav");
	sadTrombone = loadSound("sadTrombone.mp3");
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	
	let storedWonStreak = getItem("wonStreak");
	if (storedWonStreak != null) {
		wonStreak = storedWonStreak;
	}
	
	header = height * 0.12;
	
	let keyboardHeight = BUTTON_SIZE * 3 + BUTTONS_BOTTOM_MARGIN + CELL_PADDING * MAX_CHANCES + header;
	cellSize = (height - keyboardHeight) / MAX_CHANCES;
	letterSize = cellSize * 0.8;
	boardWidth = WORD_LENGTH * (cellSize + CELL_PADDING);
	boardHeight = MAX_CHANCES * (cellSize + CELL_PADDING);
	
	createKeyboard();
	resetGame();
}

function draw() {
	background(BACKGROUND_COLOR);
	
	let titleSize = boardWidth * 0.13;
	noStroke();
	fill(TITLE_COLOR);
	textStyle(NORMAL);
	textSize(titleSize);
	textAlign(CENTER, TOP);
	text("Lil Potato's Wordle", width / 2, titleSize / 2);
	
	push();
	translate((width - boardWidth) / 2, header);
	
	textSize(letterSize);
	textAlign(LEFT, BASELINE);
	rectMode(CORNER);
	
	// Determine if active row has a valid word.
	let isValidWord = false;
	if (guesses[guesses.length - 1].length == WORD_LENGTH) {
		isValidWord = isWordValid(guesses[guesses.length - 1]);
	}
	
	for (let row = 0; row < MAX_CHANCES; row++) {
		let results = {};
		if (row < guesses.length - 1) {
			results = analyzeGuess(guesses[row]);
		}
		
		for (let column = 0; column < WORD_LENGTH; column++) {
			// Get this cell's letter.
			let letter = null;
			if (row < guesses.length && column < guesses[row].length) {
				letter = guesses[row][column];
			}
			
			// Default styling.
			fill(CELL_COLOR);
			stroke(CELL_BORDER_COLOR);

			if (row == guesses.length - 1) {  // Run on previous guesses.
				if (letter) {
					if (row == guesses.length - 1 && guesses[row].length == WORD_LENGTH && !isValidWord) {
						stroke(CELL_BORDER_WRONG_COLOR);  // Color borders to indicate that the word doesn't exist. 
					} else {
						stroke(CELL_BORDER_HIGHLIGHT_COLOR);
					}
				}
			} else {  // Run on current guess.
				if (Object.keys(results).length) {
					noStroke();
					
					let result = results[column];

					if (result == WRONG_LETTER) {
						fill(LETTER_WRONG_COLOR);
						if (buttonColors[letter] == undefined) {
							buttonColors[letter] = result;
							setButtonBackColor(buttons[letter], color(LETTER_WRONG_COLOR));
						}
					} else if (result == BAD_SPOT_LETTER) {
						fill(LETTER_BAD_SPOT_COLOR);
						if (buttonColors[letter] == undefined) {
							buttonColors[letter] = result;
							setButtonBackColor(buttons[letter], color(LETTER_BAD_SPOT_COLOR));
						}
					} else if (result == CORRECT_LETTER) {
						fill(LETTER_CORRECT_COLOR);
						if (buttonColors[letter] == undefined || buttonColors[letter] == BAD_SPOT_LETTER) {
							buttonColors[letter] = result;
							setButtonBackColor(buttons[letter], color(LETTER_CORRECT_COLOR));
						}
					}
				}
			}
			
			let x = column * cellSize + column * CELL_PADDING;
			let y = row * cellSize + row * CELL_PADDING;
			rect(x, y, cellSize, cellSize);
			
			if (letter) {
				fill(LETTER_COLOR);
				noStroke();
				text(
					letter, 
					x + cellSize / 2 - textWidth(letter) / 2, 
					y + cellSize / 2 + letterSize / 4);
			}
		}
	}
	
	pop();
	
	if (won) {
		displayCenterMessage(wonMessage, color(WON_MSG_COLOR));
	} else if (gameOver) {
		displayCenterMessage(`Oops!\nIt was '${theWord}'\n(cue sad trombone)`, color(GAMEOVER_MSG_COLOR));
	}
	
	for (let i = particles.length - 1; i > -1; i--) {
		particles[i].move();
		particles[i].display();
		if (particles[i].isOutOfBounds()) {
			particles.splice(i, 1);
		}
	}
	
	if (particlesTimer > 0) {
		particles.push(new Particle());
		particlesTimer--;
	}
}

function displayCenterMessage(msg, msgColor) {
	let headerTextSize = header * 0.3;
	
	noStroke();
	fill(0, 220);
	rectMode(CORNER);
	rect(0, 0, width, height);
	
	textSize(headerTextSize);
	textAlign(CENTER);
	textStyle(BOLD);
	rectMode(CENTER);
	fill(msgColor);
	text(msg, width / 2, height / 4, boardWidth);
}

function buttonPressed(letter) {
	submitLetter(letter);
}

function setButtonBackColor(button, buttonColor) {
	button.style("border-color", buttonColor);
	button.style("background-color", buttonColor);
}

function createKeyboard() {
	let allKeys = [
		["Enter", "z", "x", "c", "v", "b", "n", "m", "Del"],
		["a", "s", "d", "f", "g", "h", "j", "k", "l"],
		["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
	];
	
	for (let row = 0; row < allKeys.length; row++) {
		let totalWidth = allKeys[row].length * BUTTON_SIZE;

		for (let i = 0; i < allKeys[row].length; i++) {
			let offset = 0;
			if (allKeys[row][i] == "Enter") {
				offset = -30;
			}
			
			button = createButton(allKeys[row][i]);
			buttons[allKeys[row][i]] = button;
			button.position(
				width / 2 - totalWidth / 2 + i * BUTTON_SIZE + offset, 
				height - BUTTONS_BOTTOM_MARGIN - BUTTON_SIZE * (row + 1));
		}
	}
	
	for (let [key, button] of Object.entries(buttons)) {
		button.size(BUTTON_SIZE, BUTTON_SIZE);
		setButtonBackColor(button, color(BUTTON_BACK_COLOR));
		button.style("color", color(BUTTON_TEXT_COLOR));
		button.style("font-size", "20px");
		
		if (key == "Enter") {
			button.mousePressed(submitGuess);
		} else if (key == "Del") {
			button.mousePressed(deleteLetter);
		} else {
			button.mousePressed(function() { 
				buttonPressed(key);
			});
		}
	}
	
	buttons["Enter"].size(70, BUTTON_SIZE);
	buttons["Del"].size(70, BUTTON_SIZE);
}

function isWordValid(word) {
	return otherValidWords.includes(word) || RiTa.hasWord(word);
}

function analyzeGuess(guess) {
	let results = {};
	
	// Count how many characters appear in the word.
	let validLetters = {};

	for (let i = 0; i < theWord.length; i++) {
		let letter = theWord[i];
		if (letter in validLetters) {
			validLetters[letter]++;
		} else {
			validLetters[letter] = 1;
		}
	}

	for (let i = 0; i < guess.length; i++) {
		let letter = guess[i];

		if (letter == theWord[i]) {
			results[i] = CORRECT_LETTER
			validLetters[letter]--;
		}
	}

	for (let i = 0; i < guess.length; i++) {
		if (!(i in results)) {
			let letter = guess[i];
			let found = false;

			if (validLetters[letter] > 0) {
				for (let j = 0; j < theWord.length; j++) {
					if (i != j && letter == theWord[j]) {
						results[i] = BAD_SPOT_LETTER;
						validLetters[letter]--;
						found = true;
						break;
					}
				}
			}

			if (!found) {
				results[i] = WRONG_LETTER;
			}
		}
	}
	
	return results;
}

function pickRandomWord() {
	let newWord = null;
	
	while(newWord == null) {
		let word = RiTa.randomWord({
			minLength: WORD_LENGTH, 
			maxLength: WORD_LENGTH
		});
		
		if (!word.includes("'")) {
			newWord = word;
		}
	}

	if (DEBUG_WORD != null) {
		newWord = DEBUG_WORD;
	}
	
	return newWord;
}

function generateNewWonMessage() {
	let rules = {
		"start": `Holy $exclamation! Your current win streak is ${wonStreak}!`,
		"exclamation": "moly | guacamole | jeepers | Batman"
	}

	let rg = RiTa.grammar(rules);
	wonMessage = rg.expand();
}

function setupNewGuess() {
	guesses.push("");
}

function submitGuess() {
	if (won || gameOver) {
		return;
	}
	
	let guess = guesses[guesses.length - 1];
	if (guess.length != WORD_LENGTH) {
		return;
	}
	
	if (!isWordValid(guess)) {
		return
	}
	
	if (guess == theWord) {
		won = true;
		wonStreak++;
		storeItem("wonStreak", wonStreak);
		particlesTimer = PARTICLES_SPAWN_COUNT;
		generateNewWonMessage();
		tada.play();
	} else if (guesses.length == MAX_CHANCES) {
		gameOver = true;
		wonStreak = 0;
		storeItem("wonStreak", wonStreak);
		sadTrombone.play();
	}

	setupNewGuess();
}

function submitLetter(letter) {
	if (won || gameOver) {
		return;
	}
	
	if (guesses[guesses.length - 1].length < WORD_LENGTH) {
		guesses[guesses.length - 1] += letter;
	}
}

function deleteLetter() {
	if (won || gameOver) {
		return;
	}
	
	let guess = guesses[guesses.length - 1];
	if (guess.length > 0) {
		guesses[guesses.length - 1] = guess.slice(0, -1);
	}
}

function resetButtonBackColors() {
	for (let [key, button] of Object.entries(buttons)) {
		setButtonBackColor(button, color(BUTTON_BACK_COLOR));
	}
}

function resetGame() {
	won = false;
	gameOver = false;
	particlesTimer = 0;
	guesses = [];
	buttonColors = {}
	resetButtonBackColors();
	theWord = pickRandomWord();
	setupNewGuess();
}

function keyPressed() {	
	if (keyCode == DELETE || keyCode == BACKSPACE) {
		deleteLetter();
	} else if (keyCode == ENTER || keyCode == RETURN) {
		submitGuess();
	}
}

function keyTyped() {
	if (won || gameOver) {
		return;
	}
	
	if (!key || key == "Enter" || key.match(/[a-z]/i) == null) {
		return;
	}
	submitLetter(key.toLowerCase());
}

function mouseClicked() {
	if (mouseY > buttons["q"].position().y) {
		return;
	}
	
	if (won || gameOver) {
		resetGame();
	}
}
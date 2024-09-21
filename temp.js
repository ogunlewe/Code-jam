let randomNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

console.log("Welcome to the Number Guessing Game!");
console.log("I'm thinking of a number between 1 and 100.");
console.log("Use the guess(number) function to make a guess.");

function guess(number) {attempts++;
    
    if (isNaN(number)) {
        return "Please enter a valid number.";
    } else if (number < randomNumber) {
        return "Too low! Try again.";
    } else if (number > randomNumber) {
        return "Too high! Try again.";
    } else {
        let message = `Congratulations! You guessed the number in ${attempts} attempts!`;
        resetGame();
        return message;
    }
}

function resetGame() {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    console.log("New game started! I'm thinking of a new number between 1 and 100.");
}

console.log("Game is ready! Make your first guess using guess(number)");

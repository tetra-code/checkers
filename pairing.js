// module for creating game objects and game pairs
// game state: 0 means finished, 1 means singleplayer, 2 means multiplayer
const pairing = function(gameId) {
    this.gameId = gameId;
    this.player1 = null;
    this.player2 = null;
    this.state = 0;
};

module.exports = pairing;

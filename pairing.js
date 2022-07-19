// module for creating game objects and game pairs
// game state: 0 means finished, 1 means singleplayer, 2 means multiplayer
const pairing = function(gameId) {
    this.gameId = gameId;
    this.player1 = null;
    this.player2 = null;
    this.state = 0;
};

// // if player1 is null then
// pairing.prototype.addPlayer = (player) => {
//     if (this.player2 !== null) {
//         return new Error("Invalid call. This pairing is full");
//     }
//     if (this.player1 === null) {
//         this.player1 = player;
//         return "Added player1";
//     }
//     this.player2 = player;
//     return "Added player2";
// };

module.exports = pairing;

// module for creating multiplayer game pairs
const pairing = function() {
    this.player1 = null;
    this.player2 = null;
    this.player1Connection = null;
    this.player2Connection = null;
};

// if player1 is null then
pairing.prototype.addPlayerAndConnection = (player, connection) => {
    if (this.player2 !== null) {
        return new Error("Invalid call. This pairing is full");
    }
    if (this.player1 === null) {
        this.player1 = player;
        this.player1Connection = connection;
        return "Added player1";
    }
    this.player2 = player;
    this.player2Connection = connection;
    return "Added player2";
};

module.exports = pairing;
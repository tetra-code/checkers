/**
 * Setup for http and WS connection.
 */
const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3000;
const socketio = require('socket.io');
const pairing = require('./pairing');
const games = [];
const users = {};
let alreadyCreatedMultiGame = false;

/**
 * Endpoints
 */
app.use(express.static(`${__dirname}/public`, {
    extensions:['html']
}));

app.get('/', (req, res) => {
    res.sendFile('splash.html', { root: "./public" });
});

app.get('/play/*', (req, res) => {
    res.sendFile('game.html', { root: "./public" });
});

//default route error handling
app.get('/*', (req, res) => {
    res.status(404).send("Not found");
});

/**
 * Utilities
 */
// every 10 seconds remove finished games in array
const cleanUp = () => {
    setInterval(() => {
        games.filter(g => g.state !== 0);
    }, 3000);
};

// generates unique game ID for url and socket rooms for multiplayer and client id
const guid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

// utility to generate empty game objects for singleplayer
const createSingleGame = (clientID) => {
    const game = new pairing();
    game.gameId = guid();
    game.state = 1;
    game.player1 = clientID;
    games.push(game);
    console.log("created singleplayer game")
    return game.gameId;
};

// utility to generate empty game objects for singleplayer
const createMultiGame = (socket, clientID) => {
    const game = new pairing();
    game.gameId = guid();
    game.state = 2;
    game.player1 = clientID;
    games.push(game);
    socket.join(game.gameId);
    console.log("generated new multiplayer game");
    return game;
};

// utility to check game the given gameID
const checkGame = (clientID) => {
    let game;
    for (let i = 0; i < games.length; i++) {
        game = games[i];
        if (game.player1 === clientID || game.player2 === clientID) {
            game.state = 0;
            console.log("removed game object");
        }
    }
};

// utility to check or generate empty game objects for multiplayer
const checkForMultiGame = (socket, clientID) => {
    // looks for already created multiplayer game needing a second player
    let game;
    for (let i = 0; i < games.length; i++) {
        game = games[i];
        if (game.state === 2 && game.player1 === clientID) {
            alreadyCreatedMultiGame = true;
            console.log("already generated game")
            return game;
        }
        if (game.state === 2 && game.player2 === null) {
            game.player2 = clientID;
            socket.join(game.gameId);
            console.log("found a multiplayer game pair")
            return game;
        } 
    }
    return;
};

/**
 * Creating server and establishing ws connection
 */
const server = http.createServer(app);
const io = socketio(server);

// at every WS connection, check if local session already has a client id.
io.on("connection", (socket) => {
    let clientID = guid();
    // by default send clientID to all new connections
    socket.emit('clientID', clientID);
    console.log("Sent ID to " + socket.id)

    socket.on('setID', () => {
        console.log("Client has set the Id")
        users[socket.id] = clientID;
    });

    socket.on('existsID', (id) => {
        clientID = id;
        console.log("Client already has ID");
        users[socket.id] = clientID;
    });

    socket.on("singleplayer", () => {
        //before creating singlegame, check if multiplayer game has 
        //already been created by same user
        const game = checkForMultiGame(socket, clientID);
        if (game !== undefined && alreadyCreatedMultiGame) {
            game.state === 0;
            console.log("deleting game")
        }
        const gameId = createSingleGame(clientID);
        socket.emit("start", gameId);
    });

    socket.on("multiplayer", () => {
        //once you generate multiplayer game, make the multiplayer game button unclickable
        let game = checkForMultiGame(socket, clientID);
        if (game === undefined) {
            game = createMultiGame(socket, clientID);
        }
        if (game.player2 !== null) {
            io.to(game.gameId).emit("start", game.gameId);
        }
    });

    socket.on("disconnect", (reason) => {
        // when moving to /play, all clients are programmed to disconnect manually.
        // this returns the reason as 'client namespace disconnect' which
        // distinguishes from 'transport close'
        console.log(`Disconnected due to ${reason}`);
        if (reason === "transport close") {
            // player left mid game or connection lost
            // if it created a game, set it to 0
            const clientID = users[socket.id];
            checkGame(clientID);
            delete users[socket.id];
            console.log("removed from users object");
        }
    });
    //below broadcasts to all connected sockets
    // io.emit("new user just connected");
});

server.on("error", (err) => {
    console.error(err);
});

server.listen(port, () => {
    console.log(`Server connected to port ${port}`);
})

cleanUp();

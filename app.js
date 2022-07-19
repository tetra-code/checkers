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
app.get('*', (req, res) => {
    res.status(404).send("Not found");
});

/**
 * Utilities
 */
// every 10 seconds remove finished games in array
const cleanUp = () => {
    setInterval(() => {
        games.filter(g => g.state !== 0);
    }, 10000);
};

// generates unique game ID for url and socket rooms for multiplayer
const guid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

// utility to generate empty game objects for singleplayer
const createSingleGame = (socket) => {
    const game = new pairing();
    game.gameId = guid();
    game.state = 1;
    game.player1 = socket.id;
    games.push(game);
    console.log("created singleplayer game")
    return game.gameId;
};

// utility to check or generate empty game objects for multiplayer
const checkForMultiGame = (socket) => {
    // looks for already created multiplayer game needing a second player
    let game;
    for (let i = 0; i < games.length; i++) {
        game = games[i];
        if (game.state === 2 && game.player2 === null) {
            game.player2 = socket.id;
            socket.join(game.gameId);
            console.log("found a multiplayer game pair")
            return game;
        }
    }
    // otherwise, generates new multiplayer game object and waits for another user
    game = new pairing();
    game.gameId = guid();
    game.state = 2;
    game.player1 = socket.id;
    games.push(game);
    socket.join(game.gameId);
    console.log("generated new multiplayer game");
    return game;
};

// utility to check whether user has already created a multiplayer game
// only activated if user wants to switch from multiplayer mode to singleplayer mode
// if there is, this game object state is set to 0 to be removed by the 'cleanup' function
const checkIfAlreadyCreatedMultiGame = (socket) => {
    let game;
    for (let i = 0; i < games.length; i++) {
        game = games[i];
        if (game.state === 2 && game.player1 === socket.id) {
            game.state === 0;
            console.log("already created multiplayer game")
            return;
        }
        console.log("No multiplayer game created");
    };
}

/**
 * Creating server and establishing ws connection
 */
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
    socket.on("Hello from client", () => {
        console.log("Received message from client");
    });

    socket.on("singleplayer", () => {
        checkIfAlreadyCreatedMultiGame(socket);
        const gameId = createSingleGame(socket);
        socket.emit("start", gameId);
    });

    socket.on("multiplayer", () => {
        //once you generate multiplayer game, make the multiplayer game button unclickable
        const game = checkForMultiGame(socket);
        if (game.player2 !== null) {
            io.to(game.gameId).emit("start", game.gameId);
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

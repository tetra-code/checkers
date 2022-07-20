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

//=================Utilities=====================//

// every 3 seconds remove finished games in array
const cleanUp = () => {
    setInterval(() => {
        games.filter(g => g.state !== 0);
    }, 3000);
};

// generates unique game ID for url, socket rooms for multiplayer and client ID
const guid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

// generates empty game objects for singleplayer
const createSingleGame = (clientID) => {
    const game = new pairing(guid());
    game.state = 1;
    game.player1 = clientID;
    games.push(game);
    return game.gameId;
};

// generates empty game objects for multiplayer
const createMultiGame = (socket, clientID) => {
    const game = new pairing(guid());
    game.state = 2;
    game.player1 = clientID;
    games.push(game);
    socket.join(game.gameId);
    // socket.leave(socket.id);
    socket.emit('color', 'white');
    return game;
};

// check and remove game using the clientID or gameID
const removeGame = (id) => {
    let game;
    for (let i = 0; i < games.length; i++) {
        game = games[i];
        if (game.player1 === id || game.player2 === id || game.gameId === id) {
            game.state = 0;
            console.log("removed game object");
        }
    }
};

// check or generate empty game objects for multiplayer and subscribe them to
// new socket rooms
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
            socket.emit('color', 'black');
            return game;
        } 
    }
    return;
};

const findGame = (id) => {
    let game;
    for (let i = 0; i < games.length; i++) {
        game = games[i];
        if (game.gameId === id) {
            return game;
        }
    }
    return;
}

//===================Creating servers and requests handling==================//
const server = http.createServer(app);
const io = socketio(server);

// at every WS connection, check if local session already has a client id.
io.on("connection", (socket) => {
    let clientID = guid();
    // by default send clientID to all new connections
    socket.emit('clientID', clientID);

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
            // removeGame(game.gameId)
            console.log("deleting game")
        }
        const gameId = createSingleGame(clientID);
        socket.emit("start", gameId);
    });

    socket.on("multiplayer", () => {
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
        // distinguishes from connection loss 'transport close'
        if (reason === "transport close") {
            delete users[socket.id];
            const url = socket.handshake.headers.referer;
            let id;
            // remove games associated with the lost user
            if (!url.includes('/play/')) {
                id = users[socket.id];
            } else {
                id = url.split('/play/')[1];
            }
            removeGame(id);
        }
    });

    socket.on("game_move", (payload) => {
        //use the id from senders URL to transmit to only those related in the socket room
        const gameId = socket.handshake.headers.referer.split('/play/')[1];
        io.to(gameId).emit('game_move', payload);
    });

    socket.on("join_game", (gameID) => {
        // all game sockets leave their default room and join the game socket room using gameID
        socket.join(gameID);
        socket.leave(socket.id);
    });
});

server.on("error", (err) => {
    console.error(err);
});

server.listen(port, () => {
    console.log(`Server connected to port ${port}`);
})

cleanUp();

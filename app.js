const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3000;
const socketio = require('socket.io');
// const { server } = require('websocket');
const pairing = require('./pairing');
let games = [];

app.use(express.static('./public'));

app.get('/', (req, res) => {
    res.send("Hello World")
    // res.sendFile('splash.html', { root: "./public" });
});

app.get('/play', (req, res) => {
    res.send("Let's play checkers")
    // res.sendFile('game.html'), { root: "./public" };
});



const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
    socket.emit("Hello from server");

    socket.on("Hello from client", () => {
        console.log("Received message from client");
    });
});


server.on("error", (err) => {
    console.error(err);
});

server.listen(port, () => {
    console.log(`Server connected to port ${port}`);
})

const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3000;
const socketio = require('socket.io');
const pairing = require('./pairing');
let games = [];

// app.use(express.static('./public'));
app.use(express.static(`${__dirname}/public`, {
    extensions:['html']
}));

app.get('/', (req, res) => {
    res.send("Splash screen");
    // res.sendFile('splash.html', { root: "./public" });
});

app.get('/play', (req, res) => {
    res.send("Game screen");
    // res.sendFile('game.html'), { root: "./public" };
});

//default route error handling
app.get('*', (req, res) => {
    res.status(404).send("Not found");
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

const wsProtocol = location.protocol.includes('https') ? 'wss:' : 'ws:';
const socket = io(`${wsProtocol}//${location.host}`);
let gameId;

const singleplayerBtn = document.getElementById('singleplayer');
const multiplayerBtn = document.getElementById('multiplayer');
const howToPlayBtn = document.getElementById('howToPlayBtn');

// default msg type 'connect'
socket.on('connect', () => {
    console.log(socket.id);
});

// default msg type 'disconnect'
socket.on('disconnect', () => {
    console.log("disconnected from server");
});

// go to 'play' screen when received start msg
socket.on('start', (gameId) => {
    setTimeout(() => {
        window.location.href = `/play/${gameId}`
    }, 2000);
});

// custom msg type
socket.emit("Hello from client");

//add event listeners
singleplayerBtn.addEventListener("click", () => {
    socket.emit("singleplayer");
});

multiplayerBtn.addEventListener("click", () => {
    socket.emit("multiplayer");
})

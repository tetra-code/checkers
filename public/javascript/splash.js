const wsProtocol = location.protocol.includes('https') ? 'wss:' : 'ws:';
const socket = io(`${wsProtocol}//${location.host}`);

const singleplayerBtn = document.getElementById('singleplayer');
const multiplayerBtn = document.getElementById('multiplayer');
const howToPlayBtn = document.getElementById('howToPlayBtn');

let gameId;
let userId = sessionStorage.getItem('id');

// default msg type 'connect'
socket.on('connect', () => {
    console.log("connected to server");
});

// checks for client ID in sesion storage
socket.on('clientID', (clientID) => { 
    console.log(userId);
    if (userId === null) {
        sessionStorage.setItem('id', clientID);
        socket.emit("setID")
    } else {
        socket.emit("existsID", userId);
    }
});

//player1 is white, playey2 is black
socket.on('color', (color) => {
    console.log(color);
    sessionStorage.setItem('color', color);
});

// go to 'play' screen when received start msg
socket.on('start', (gameId) => {
    // manually disconnect to indicate it connection wasn't unintentionally closed
    socket.disconnect();
    setTimeout(() => {
        window.location.href = `/play/${gameId}`;
    }, 2000);
});

//add event listeners
singleplayerBtn.addEventListener("click", () => {
    sessionStorage.setItem('game_mode', 'singleplayer');
    socket.emit("singleplayer");
});

multiplayerBtn.addEventListener("click", () => {
    sessionStorage.setItem('game_mode', 'multiplayer');
    socket.emit("multiplayer");
})

const wsProtocol = location.protocol.includes('https') ? 'wss:' : 'ws:';
const socket = io(`${wsProtocol}//${location.host}`);

const singleplayerBtn = document.getElementById('singleplayer');
const multiplayerBtn = document.getElementById('multiplayer');
const howToPlayBtn = document.getElementById('howToPlayBtn');
const description = document.getElementById('description');

let gameId;
let userId = sessionStorage.getItem('id');

//==================Utility methods======================//
// function openHowToPlay(data){
//     if(data == null) return;
//     data.classList.add('active');
//     overlay.classList.add('active');
// }


//===================Websocket handlers and methods============///

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
    description.innerText = "Game is about to begin. Have fun!"
    socket.disconnect();
    setTimeout(() => {
        window.location.href = `/play/${gameId}`;
    }, 2000);
});

socket.on('standby', (message) => {
    description.innerText = message;
})

singleplayerBtn.addEventListener("click", () => {
    sessionStorage.setItem('game_mode', 'singleplayer');
    socket.emit("singleplayer");
});

multiplayerBtn.addEventListener("click", () => {
    sessionStorage.setItem('game_mode', 'multiplayer');
    socket.emit("multiplayer");
})

// howToPlayBtn.addEventListener('click', ()=>{
//     const data = document.querySelector(howToPlayBtn.dataset.target);
//     openHowToPlay(data);
// })
const wsProtocol = location.protocol.includes('https') ? 'wss:' : 'ws';
const socket = new WebSocket(`${wsProtocol}//${location.host}`);

socket.on("Hello from server", () => {
    console.log("Received message from server")
});

socket.emit("Hello from client");

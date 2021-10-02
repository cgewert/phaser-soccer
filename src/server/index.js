/*
 *  Server Application for Phaser-Soccer.
 *  https://github.com/cgewert/phaser-soccer
 */
const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.on("error", (err) => {
    console.log(`ERROR: ${err}`);
});

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.get('/socket.io.js', (req, res) => {
    res.sendFile(`${__dirname}/node_modules/socket.io/client-dist/socket.io.js`);
});

io.on('connection', (socket) => {
    console.log('Player connected!');
    socket.on('disconnect', () => {
        console.log('Player disconnected...');
    });
    socket.on('hello', (payload) => {
        console.log(payload);
    });
    socket.on('chat', (payload) => {
        console.log("Player chatted: " + payload);
        // Broadcasting chat to all other players
        io.emit('broadcast', payload);
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
const ws = require('ws')

const wss = new ws.WebSocketServer({ port: 8080 })

wss.on('connection', function connection(socket) {
    console.log('Client connected!')

    socket.on('close', () => {
        console.log('Client disconnected!')
    })
})
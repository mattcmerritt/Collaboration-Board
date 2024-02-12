const ws = require('ws')

const wss = new ws.WebSocketServer({ port: 8080 })

console.log('Started server on port 8080')

wss.on('connection', function connection(socket) {
    console.log('Client connected!')

    socket.on('message', (data) => {
        console.log(`Message received from client: "${data}"`)

        socket.send(`Server received: ${data}`)
    })

    socket.on('close', () => {
        console.log('Client disconnected!')
    })
})
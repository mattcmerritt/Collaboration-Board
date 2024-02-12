const ws = require('ws')

const wss = new ws.WebSocketServer({ port: 8080 })

console.log('Started server on port 8080')

wss.on('connection', function connection(socket) {
    console.log('Client connected!')

    socket.on('message', (data) => {
        data = JSON.parse(data)
        
        console.log(`Message received from ${data.user} client: "${data.message}"`)

        socket.send(JSON.stringify({
            'user': data.user,
            'message': `Server received from ${data.user}: ${data.message}`
        }))
    })

    socket.on('close', () => {
        console.log('Client disconnected!')
    })
})
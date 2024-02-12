const ws = require('ws')

const wss = new ws.WebSocketServer({ port: 8080 })

console.log('Started server on port 8080')

wss.on('connection', function connection(socket) {
    console.log('Client connected!')

    socket.on('message', (data) => {
        data = JSON.parse(data)
        
        console.log(`Message received from ${data.user}'s client: "${data.message}"`)

        wss.clients.forEach(function each(client) {
            if (client.readyState === ws.WebSocket.OPEN) {
                client.send(JSON.stringify({
                    'user': data.user,
                    'message': data.message
                }))
            } 
        })
    })

    socket.on('close', () => {
        console.log('Client disconnected!')
    })
})
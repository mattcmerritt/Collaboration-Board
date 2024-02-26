const ws = require('ws')
const pg = require('pg')
const dotenv = require('dotenv').config()

const wss = new ws.WebSocketServer({ port: 8080 })

console.log('Started server on port 8080')

const client = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

// example database connection
// console.log('Verifying that the database is working:')
// client.connect().then(() => {
//     client.query('SELECT NOW()').then((result) => {
//         console.log(result.rows)
//     })
// })

// verifying that necessary tables already exist
client.connect()
client.query("SELECT EXISTS ( SELECT FROM pg_tables WHERE tablename = 'messages' )").then((result) => {
    console.log(result.rows)
})

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
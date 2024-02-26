const ws = require('ws')
const pg = require('pg')
const dotenv = require('dotenv').config()

const wss = new ws.WebSocketServer({ port: 8080 })

console.log('Started server on port 8080')

const database_client = new pg.Client({
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
database_client.connect()
database_client.query("SELECT EXISTS ( SELECT FROM pg_tables WHERE tablename = 'messages' )").then((result) => {
    if (result.rows[0]['exists']) {
        console.log('Messages table successfully found!')
    }
    else {
        console.log('Messages table could not be found, creating it now!')
        database_client.query("CREATE TABLE messages ( username varchar, message varchar, time_sent timestamp )")
        console.log('Messages table created!')
    }
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
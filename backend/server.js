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
        database_client.query("CREATE TABLE messages ( username varchar, message varchar, conversation varchar, time_sent timestamp )")
        console.log('Messages table created!')
    }
})


// system for keeping track of what users are currently typing in the application
const typing_users = []
let still_typing_users = []

function updateTypingUserList() {
    // go through the list of users that are marked as typing
    for (let i = 0; i < typing_users.length; i++) {
        // ensure that each user has sent a message in this time frame
        if (still_typing_users.find((element) => typing_users[i] === element) === undefined) {
            // remove the user from the tracked user list
            const removed_users = typing_users.splice(i, 1);
            
            // the server needs to tell all the clients that this user is no longer talking
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'user typing',
                        'users': typing_users,
                        'typing': false
                    }))
                } 
            })

            console.log(`Typing:\t\tUser ${removed_users[0]} is no longer typing.`)
        }
    }

    // clear out the list of typing users for the next time window
    still_typing_users = []
}

setInterval(updateTypingUserList, 1000)

// websocket server responses and listeners
wss.on('connection', function connection(socket) {
    console.log('Client:\t\tNew client connected!')

    // load messages from default conversation
    const conversation = 'default'
    database_client.query("SELECT * FROM messages WHERE conversation=$1 ORDER BY time_sent", [conversation]).then((result) => {
        // send message history to new client
        socket.send(JSON.stringify({
            'ws_msg_type': 'chat history',
            'conversation': conversation,
            'messages': result.rows
        }))
    })
    console.log('Chat:\t\tSent previous message log.')

    socket.on('message', (data) => {
        data = JSON.parse(data)

        // sending different information back to the clients depending on what was received
        if (data.ws_msg_type === 'chat message') {
            console.log(`Chat:\t\tMessage received from ${data.user}'s client for ${data.conversation}: "${data.message}"`)

            // adding a message to the database
            database_client.query("INSERT INTO messages (username, message, conversation, time_sent) VALUES ($1, $2, $3, NOW())", [data.user, data.message, data.conversation])
            console.log('Chat:\t\tMessage logged in database.')

            // sending the message over to all active clients
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'chat message',
                        'user': data.user,
                        'message': data.message,
                        'conversation': data.conversation
                    }))
                } 
            })
            console.log('Chat:\t\tMessage sent out to all connected clients.')
        }
        else if (data.ws_msg_type === 'user typing') {
            // if the user is not currently marked as typing
            if (typing_users.find((element) => element === data.user) === undefined) {
                // add user to lists in memory
                typing_users.push(data.user)
                // mark that the user is typing this frame
                still_typing_users.push(data.user)
                
                // indicating that a user is typing on clients by sending new list
                wss.clients.forEach(function each(client) {
                    if (client.readyState === ws.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            'ws_msg_type': 'user typing',
                            'users': typing_users,
                            'typing': true
                        }))
                    }
                })
                console.log(`Typing:\t\tReceived that ${data.user} is typing.`)
            }
            else {
                // mark that the user is typing this frame
                still_typing_users.push(data.user)
            }
        }
        else if (data.ws_msg_type === 'chat history') {
            database_client.query("SELECT * FROM messages WHERE conversation=$1 ORDER BY time_sent", [data.conversation]).then((result) => {
                // send message history to new client
                socket.send(JSON.stringify({
                    'ws_msg_type': 'chat history',
                    'conversation': data.conversation,
                    'messages': result.rows
                }))
            })
            console.log(`Chat:\t\tSent previous message log for ${data.conversation}.`)
        }
    })

    socket.on('close', () => {
        console.log('Client:\t\tOne client disconnected!')
    })
})
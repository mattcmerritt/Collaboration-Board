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

database_client.connect()

// verifying that necessary tables already exist
const tables = [
    {
        table: 'messages',
        schema: 'username varchar, message varchar, conversation varchar, time_sent timestamp'
    },
    {
        table: 'columns',
        schema: 'id int, name varchar'
    },
    {
        table: 'cards',
        schema: 'id int, name varchar, columnNumber int'
    }
]
// checking for the tables
for (const table of tables) {
    database_client.query("SELECT EXISTS ( SELECT FROM pg_tables WHERE tablename = $1 )", [table['table']]).then((result) => {
        if (result.rows[0]['exists']) {
            console.log(`${table['table']} table successfully found!`)
        }
        else {
            console.log(`${table['table']} table could not be found, creating it now!`)
            const query = `CREATE TABLE ${table['table']} ( ${table['schema']} )`
            database_client.query(query)
            console.log(`${table['table']} table created!`)
        }
    })
}

// system for keeping track of what users are currently typing in the application
// currently store objects of form {name: string, conversation: string}
const typing_users = []
let still_typing_users = []

function updateTypingUserList() {
    // go through the list of users that are marked as typing
    for (let i = 0; i < typing_users.length; i++) {
        // ensure that each user has sent a message in this time frame
        if (still_typing_users.find((element) => typing_users[i].name === element.name && typing_users[i].convesation === element.conversation) === undefined) {
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
    console.log('Chat:\t\tSent previous message log to new connection.')

    socket.on('message', (data) => {
        data = JSON.parse(data)

        // sending different information back to the clients depending on what was received
        if (data.ws_msg_type === 'chat message') {
            console.log(`Chat:\t\tMessage received from ${data.user}'s client for ${data.conversation}: "${data.message}"`)

            // adding a message to the database
            database_client.query("INSERT INTO messages (username, message, conversation, time_sent) VALUES ($1, $2, $3, NOW()) RETURNING *", [data.user, data.message, data.conversation]).then((result) => {
                console.log('Chat:\t\tMessage logged in database.')

                // sending the message over to all active clients
                wss.clients.forEach(function each(client) {
                    if (client.readyState === ws.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            'ws_msg_type': 'chat message',
                            'user': data.user,
                            'message': data.message,
                            'conversation': data.conversation,
                            'timestamp': result.rows[0].time_sent
                        }))
                    } 
                })
                console.log('Chat:\t\tMessage sent out to all connected clients.')
            })
        }
        else if (data.ws_msg_type === 'user typing') {
            // creating the user object from this message
            const typing_user = {
                name: data.user,
                conversation: data.conversation
            }
            // if the user is not currently marked as typing
            if (typing_users.find((element) => element.name === typing_user.name && element.conversation === typing_user.conversation) === undefined) {
                // add user to lists in memory
                typing_users.push(typing_user)
                // mark that the user is typing this frame
                still_typing_users.push(typing_user)
                
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
                still_typing_users.push(typing_user)
            }
        }
        else if (data.ws_msg_type === 'chat history') {
            database_client.query("SELECT * FROM messages WHERE conversation=$1 ORDER BY time_sent", [data.conversation]).then((result) => {
                // indicating that a user is typing on clients by sending new list
                socket.send(JSON.stringify({
                    'ws_msg_type': 'chat history',
                    'conversation': data.conversation,
                    'messages': result.rows
                }))
            })
            console.log(`Chat:\t\tSent previous message log for ${data.conversation}.`)
        }
        // ----------------- ----------------------------- -----------------
        // ----------------- KANBAN FUNCTIONALITY MESSAGES -----------------
        // ----------------- ----------------------------- -----------------
        else if (data.ws_msg_type === 'add column') {
            database_client.query("INSERT INTO columns (id, name) VALUES ($1, $2)", [data.id, data.name])
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'add column',
                        'id': data.id,
                        'name': data.name
                    }))
                }
            })
            console.log(`Columns:\t\tAdded column ${data.id}: ${data.name}.`)
        }
        else if (data.ws_msg_type === 'update column') {
            database_client.query("UPDATE columns SET name=$1 WHERE id=$2", [data.name, data.id])
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'update column',
                        'column': data.id,
                        'name': data.name
                    }))
                }
            })
            console.log(`Columns:\t\tUpdated column ${data.id} to now say ${data.name}.`)
        }
        else if (data.ws_msg_type === 'add card') {
            database_client.query("INSERT INTO cards (id, name, columnNumber) VALUES ($1, $2, $3)", [data.id, data.name, data.column])
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'add card',
                        'id': data.id,
                        'name': data.name,
                        'column': data.column
                    }))
                }
            })
            console.log(`Cards:\t\tAdded card ${data.id}: ${data.name} in ${data.column}.`)
        }
        else if (data.ws_msg_type === 'update card') {
            database_client.query("UPDATE cards SET name=$1 WHERE id=$2", [data.name, data.id])
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'update card',
                        'id': data.id,
                        'name': data.name,
                        'column': data.column
                    }))
                }
            })
            console.log(`Cards:\t\tUpdated card ${data.id} to now say ${data.name} in column ${data.column}.`)
        }
        else if (data.ws_msg_type === 'move card') {
            database_client.query("UPDATE cards SET columnNumber=$1 WHERE id=$2", [data.column, data.id])
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'move card',
                        'id': data.id,
                        'name': data.name,
                        'column': data.column
                    }))
                }
            })
            console.log(`Cards:\t\tMoved card ${data.id} with ${data.name} into column ${data.column}.`)
        }
        else if (data.ws_msg_type === 'remove card') {
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'ws_msg_type': 'remove card',
                        'id': data.id,
                        'name': data.name,
                        'column': data.column
                    }))
                }
            })
            console.log(`Cards:\t\tRemoved card ${data.id} with ${data.name} from column ${data.column}.`)
        }
        else if (data.ws_msg_type === 'load columns') {
            database_client.query("SELECT * FROM columns ORDER BY id").then((result) => {
                socket.send(JSON.stringify({
                    'ws_msg_type': 'load columns',
                    'columns': result.rows
                }))
            })
            console.log(`Chat:\t\tSent previous columns.`)
        }
        else if (data.ws_msg_type === 'load cards') {
            database_client.query("SELECT * FROM cards WHERE columnNumber=$1 ORDER BY id", [data.column]).then((result) => {
                socket.send(JSON.stringify({
                    'ws_msg_type': 'load cards',
                    'cards': result.rows,
                    'column': data.column
                }))
            })
            console.log(`Chat:\t\tSent previous cards for column ${data.column}.`)
        }
    })

    socket.on('close', () => {
        console.log('Client:\t\tOne client disconnected!')
    })
})
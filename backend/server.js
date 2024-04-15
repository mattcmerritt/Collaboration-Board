const ws = require('ws')
const mongo = require('mongodb')
const dotenv = require('dotenv').config()

const wss = new ws.WebSocketServer({port: 8080})
console.log('Started server on port 8080')

const databaseClient = new mongo.MongoClient(process.env.DB_CONNECTION_STRING)
const cardsCollection = databaseClient.db('board').collection('cards')
const columnsCollection = databaseClient.db('board').collection('columns')

// system for keeping track of what users are currently typing in the application
// currently store objects of form: { userName: string, cardId: number }
const typingUsers = []
let stillTypingUsers = []

function updateTypingUserList() {
    // go through the list of users that are marked as typing
    for (let i = 0; i < typingUsers.length; i++) {
        // ensure that each user has sent a message in this time frame
        if (stillTypingUsers.find((element) => element.userName === typingUsers[i].userName && element.cardId === typingUsers[i].cardId) === undefined) {
            // remove the user from the tracked user list
            const removedUsers = typingUsers.splice(i, 1);
            
            // the server needs to tell all the clients that this user is no longer talking
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'user typing',
                        'typingUsers': typingUsers,
                        'isTyping': false
                    }))
                } 
            })

            console.log(`Typing:\t\tUser ${removedUsers[0].name} is no longer typing.`)
        }
    }

    // clear out the list of typing users for the next time window
    stillTypingUsers = []
}

// regularly update the typing user list
setInterval(updateTypingUserList, 1000)

// ----------------- ------------------------- -----------------
// ----------------- WEBSOCKET SERVER MESSAGES -----------------
// ----------------- ------------------------- -----------------
wss.on('connection', function connection(socket) {
    console.log('Client:\t\tNew client connected!')

    socket.on('close', () => {
        console.log('Client:\t\tOne client disconnected!')
    })

    socket.on('message', async (data) => {
        data = JSON.parse(data)

        // ----------------- ----------------------------- -----------------
        // ----------------- KANBAN FUNCTIONALITY MESSAGES -----------------
        // ----------------- ----------------------------- -----------------

        // ----------------- Columns -----------------
        if (data.messageType === 'add column') {
            const newColumn = await columnsCollection.insertOne({ id : data.columnId, name : data.columnName })
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'add column',
                        'column': newColumn
                    }))
                }
            })
            console.log(`Columns:\t\tAdded column ${data.columnId}: ${data.columnName}.`)
        }
        else if (data.messageType === 'update column') {
            const newColumn = await columnsCollection.updateOne( 
                { id : data.columnId },
                { $set : { name : data.columnName } }
            )
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'update column',
                        'column' : newColumn
                    }))
                }
            })
            console.log(`Columns:\t\tUpdated column ${data.columnId} to now say ${data.columnName}.`)
        }
        // ----------------- Cards -----------------
        else if (data.messageType === 'add card') {
            const cardName = data.cardName === undefined ? 'New Card' : data.cardName
            const newCard = await cardsCollection.insertOne({ id : data.cardId, name : cardName, content : '', column : data.columnId, checkList : [], chatLog : [] })
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'add card',
                        'card': newCard
                    }))
                }
            })
            console.log(`Cards:\t\tAdded card ${data.cardId}: ${cardName} in ${data.columnId}.`)
        }
        else if (data.messageType === 'update card name') {
            const newCard = await cardsCollection.updateOne(
                { id : data.cardId },
                { $set : { name : data.cardName } }
            )
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'update card name',
                        'card': newCard
                    }))
                }
            })
            console.log(`Cards:\t\tUpdated card ${data.cardId} to now say ${data.cardName}.`)
        }
        else if (data.messageType === 'update card column') {
            const newCard = await cardsCollection.updateOne(
                { id : data.cardId },
                { $set : { column : data.columnId } }
            )
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'update card column',
                        'card': newCard
                    }))
                }
            })
            console.log(`Cards:\t\tMoved card ${data.cardId} into column ${data.columnId}.`)
        }
        else if (data.messageType === 'update card chat') {
            console.log(`Chat:\t\tMessage received from ${data.userName}'s client for card ${data.cardId}: "${data.message}"`)
            // adding a message to the database
            const newCard = await cardsCollection.updateOne(
                { id: data.cardId },
                { $push : { chatLog : { name : data.userName, message : data.message } } }
            )
            // sending the message over to all active clients
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType' : 'update card chat',
                        'card' : newCard
                    }))
                }
            })
            console.log(`Chat:\t\tMessage on ${data.cardId} sent out to all connected clients.`)
        }
        else if (data.messageType === 'update card content') {
            const newCard = await cardsCollection.updateOne(
                { id : data.cardId },
                { $set : { content : data.cardContent } }
            )
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'update card content',
                        'card': newCard
                    }))
                }
            })
            console.log(`Cards:\t\tUpdated card ${data.cardId} to now contain ${data.cardContent}.`)
        }
        // ----------------- Loading -----------------
        else if (data.messageType === 'load columns') {
            const columns = await columnsCollection.find({})
            socket.send(JSON.stringify({
                'messageType': 'load columns',
                'columns': columns
            }))
            console.log(`Chat:\t\tSent previous columns.`)
        }
        else if (data.messageType === 'load cards') {
            const cards = await cardsCollection.find({ columnId : data.columnId })
            socket.send(JSON.stringify({
                'messageType': 'load cards',
                'cards': cards
            }))
            console.log(`Chat:\t\tSent previous cards for column ${data.columnId}.`)
        }
        // ----------------- Typing updates -----------------
        else if (data.messageType === 'user typing') {
            // creating the user object from this message
            const typingUser = {
                userName: data.userName,
                cardId: data.cardId
            }

            // if the user is not currently marked as typing
            if (typingUsers.find((element) => element.userName === typingUser.userName && element.cardId === typingUser.cardId) === undefined) {
                // add user to lists in memory
                typingUsers.push(typingUser)
                // mark that the user is typing this frame
                stillTypingUsers.push(typingUser)
                
                // indicating that a user is typing on clients by sending new list
                wss.clients.forEach(function each(client) {
                    if (client.readyState === ws.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            'messageType': 'user typing',
                            'typingUsers': typingUsers,
                            'isTyping' : true
                        }))
                    }
                })
                console.log(`Typing:\t\tReceived that ${data.userName} is typing.`)
            }
            else {
                // mark that the user is typing this frame
                stillTypingUsers.push(typingUser)
            }
        }
    })
})
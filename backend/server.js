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
                if (client.readyState === ws.WebSocket.OPEN) {
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
            const result = await columnsCollection.insertOne({ id : data.columnId, name : data.columnName })
            const newColumn = await columnsCollection.findOne({ _id : result.insertedId })
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'add column',
                        'column': newColumn
                    }))
                }
            })
            console.log(`Columns:\tAdded column ${data.columnId}: ${data.columnName}.`)
        }
        else if (data.messageType === 'update column') {
            const result = await columnsCollection.updateOne( 
                { id : data.columnId },
                { $set : { name : data.columnName } }
            )
            const newColumn = await columnsCollection.findOne({ id : data.columnId })
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'update column',
                        'column' : newColumn
                    }))
                }
            })
            console.log(`Columns:\tUpdated column ${data.columnId} to now say ${data.columnName}.`)
        }
        // ----------------- Cards -----------------
        else if (data.messageType === 'add card') {
            const cardName = data.cardName === undefined ? 'New Card' : data.cardName
            const result = await cardsCollection.insertOne({ id : data.cardId, name : cardName, content : '', column : data.columnId, order : data.cardOrder, checkList : [], chatLog : [] })
            const newCard = await cardsCollection.findOne({ _id : result.insertedId })
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
            const result = await cardsCollection.updateOne(
                { id : data.cardId },
                { $set : { name : data.cardName } }
            )
            const newCard = await cardsCollection.findOne({ id : data.cardId })
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
            // retrieve the original card information (used for fixing the column)
            const oldCard = await cardsCollection.findOne({ id : data.cardId })
            // determine what the cards are in the new column (used for order)
            // TODO: have the desired order passed in as a parameter
            const cursor = await cardsCollection.find({ column : data.columnId })
            const cards = await cursor.toArray()
            // updating the card to appear at the new order and column
            const result = await cardsCollection.updateOne(
                { id : data.cardId },
                { $set : { column : data.columnId, order : cards.length } }
            )
            const newCard = await cardsCollection.findOne({ id : data.cardId })
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'update card column',
                        'card': newCard
                    }))
                }
            })

            // also update the order of all the cards in the previous column
            const oldColumnCursor = await cardsCollection.find({ column : oldCard.column })
            const oldColumnCards = await oldColumnCursor.toArray()
            oldColumnCards.sort((a, b) => a.order - b.order)
            for (let i = 0; i < oldColumnCards.length; i++) {
                if (oldColumnCards[i].order > oldCard.order) {
                    await cardsCollection.updateOne(
                        { id : oldColumnCards[i].id },
                        { $set : { order : oldColumnCards[i].order - 1 } }
                    )
                }
            }

            // fetching update versions and reloading column
            const oldColumnCursorUpdated = await cardsCollection.find({ column : data.columnId })
            const oldColumnCardsUpdated = await oldColumnCursorUpdated.toArray()
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'load cards',
                        'cards': oldColumnCardsUpdated
                    }))
                }
            })
            console.log(`Cards:\t\tMoved card ${data.cardId} into column ${data.columnId} (new order of ${cards.length}).`)
        }
        else if (data.messageType === 'update card chat') {
            console.log(`Chat:\t\tMessage received from ${data.userName}'s client for card ${data.cardId}: "${data.message}"`)
            // adding a message to the database
            const result = await cardsCollection.updateOne(
                { id: data.cardId },
                { $push : { chatLog : { name : data.userName, message : data.message, timestamp : new Date() } } }
            )
            const newCard = await cardsCollection.findOne({ id : data.cardId })
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
            const result = await cardsCollection.updateOne(
                { id : data.cardId },
                { $set : { content : data.cardContent } }
            )
            const newCard = await cardsCollection.findOne({ id : data.cardId })
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
        else if (data.messageType === 'update card order') {
            // retrieve all of the existing cards in this column
            const cursor = await cardsCollection.find({ column : data.columnId })
            const cards = await cursor.toArray()
            // calculate the direction elements should move in
            cards.sort((a, b) => a.order - b.order)
            const movingCard = cards.find((cardObject) => cardObject.id === data.cardId)
            const delta = movingCard.order - data.cardOrder
            const movingForward = delta < 0
            const movingBackward = delta > 0
            const notMoving = delta === 0        
            if (notMoving || data.cardOrder == cards.length || data.cardOrder < 0) {
                console.log(`Cards:\t\tRequested bad card order update, but no changes made.`)
            }  
            // increment the order of all cards based on the movement direction
            else if (movingBackward) {
                // update surrounding cards
                for (let i = data.cardOrder; i < movingCard.order; i++) {
                    await cardsCollection.updateOne(
                        { id : cards[i].cardId },
                        { $set : { order : cards[i].order + 1 } }
                    )
                }
                // move the card to the target location
                await cardsCollection.updateOne(
                    { id : movingCard.cardId },
                    { $set : { order : data.cardOrder } }
                )
                // refetching the cards with updated orders
                const newCursor = await cardsCollection.find({ column : data.columnId })
                const newCards = await newCursor.toArray()
                // sending back to clients
                wss.clients.forEach(function each(client) {
                    if (client.readyState === ws.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            'messageType': 'update card order',
                            'cards': newCards
                        }))
                    }
                })
                console.log(`Cards:\t\tCard at ${data.cardId} moved to ${data.cardOrder}.`)
            }
            else if (movingForward) {
                // update surrounding cards
                for (let i = movingCard.order + 1; i <= data.cardOrder; i++) {
                    await cardsCollection.updateOne(
                        { id : cards[i].cardId },
                        { $set : { order : cards[i].order - 1 } }
                    )
                }
                // move the card to the target location
                await cardsCollection.updateOne(
                    { id : movingCard.cardId },
                    { $set : { order : data.cardOrder } }
                )
                // refetching the cards with updated orders
                const newCursor = await cardsCollection.find({ column : data.columnId })
                const newCards = await newCursor.toArray()
                // sending back to clients
                wss.clients.forEach(function each(client) {
                    if (client.readyState === ws.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            'messageType': 'update card order',
                            'cards': newCards
                        }))
                    }
                })
                console.log(`Cards:\t\tCard at ${data.cardId} moved to ${data.cardOrder}.`)
            }
        }
        else if (data.messageType === 'add card task') {
            const result = await cardsCollection.updateOne(
                { id : data.cardId },
                { $push : { checkList : { content : "", completed : false } } }
            )
            const newCard = await cardsCollection.findOne({ id : data.cardId })
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'add card task',
                        'card': newCard
                    }))
                }
            })
            console.log(`Cards:\t\tUpdated card ${data.cardId} to now have new task.`)
        }
        else if (data.messageType === 'update card task') {
            const result = await cardsCollection.updateOne(
                { id : data.cardId },
                { $set : { [`checkList.${data.taskIndex}`] : { content : data.taskContent, completed : data.taskCompletion } } }
            )
            const newCard = await cardsCollection.findOne({ id : data.cardId })
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'messageType': 'add card task',
                        'card': newCard
                    }))
                }
            })
            console.log(`Cards:\t\tUpdated card ${data.cardId}'s task[${data.taskIndex}] to be ${data.taskCompletion} with description ${data.taskContent}.`)
        }
        // ----------------- Loading -----------------
        else if (data.messageType === 'load columns') {
            const cursor = await columnsCollection.find()
            const columns = await cursor.toArray()
            socket.send(JSON.stringify({
                'messageType': 'load columns',
                'columns': columns
            }))
            console.log(`Loading:\tSent previous columns.`)
        }
        else if (data.messageType === 'load cards') {
            const cursor = await cardsCollection.find({ column : data.columnId })
            const cards = await cursor.toArray()
            socket.send(JSON.stringify({
                'messageType': 'load cards',
                'cards': cards
            }))
            console.log(`Loading:\tSent previous cards for column ${data.columnId}.`)
        }
        else if (data.messageType === 'load card') {
            const card = await cardsCollection.findOne({ id : data.cardId })
            socket.send(JSON.stringify({
                'messageType': 'load card',
                'card': card
            }))
            console.log(`Loading:\t\tSent previous card ${data.cardId}.`)
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
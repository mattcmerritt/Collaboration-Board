# Collaboration-Board

Developed by Matthew Merritt and Michael Merritt for CSC575.

This application takes the cards and columns used in a Kanban board for organizing tasks and adds the functionality of a real-time chat application to each card. This effectively streamlines the process of working in scrum and agile development teams, minimizing the number of places that developers need to look when being brought onto new tasks. Additionally, by keeping conversation attached to the task, developers can easily stay focused on their work items.

## Installation

To get started, clone the repository and open a terminal in the root folder (`Collaboration-Board`) of the project.

### Requirements

Assumes that you have [Node](https://nodejs.org/en/download) and [MongoDB Community Edition](https://www.mongodb.com/try/download/community) installed. Also requires that ports 8080 (frontend) and 3000 (backend) are free on localhost.

Confirmed working on Windows x86-64 with Node v20.11.0 and MongoDB Community Edition v7.0.8.

### Tech Stack

Different technologies are used for the frontend and backend components of the application.

#### Backend Tech Stack
- Primarily done in JavaScript 
- Manages a WebSocketServer for all of the connected clients to constantly receive updates
- Connects to a MongoDB instance to store the cards and chat messages for returning users

#### Frontend Tech Stack
- Primarily done in React using Next.js
- Leverages WebSockets to monitor changes made to columns, cards, and chat messages

### Backend Setup

- Navigate to the `backend` directory.
- Run the following:
```
npm install
```

- Launch MongoDBCompass and perform the initial database setup:
    - Connect to a new MongoDB instance, and save the connection string.
    - Create a new database called `board` on the MongoDB instance.
    - In the `board` database, add collections called `cards` and `columns`.

- Create `.env` file using sample as a basis:
    ```
    # mongo connection information
    DB_CONNECTION_STRING='<REMOVED>'
    ```

- Once package install is completed, run the following:
```
npm run start
```

### Frontend Setup

- Navigate to the `frontend` directory.
- Run the following commands in order:
```
npm install
```
```
npm run build
```
```
npm run start
```
- Visit [localhost:3000](localhost:3000).

## Development Notes

The application depends heavily on communication done over Websockets to keep all clients up to date. The backend manages the Websocket Server, and the frontend creates a Websocket to connect to the server. 

The following requests can be made between applications to achieve the results indicated in the names:
- `add column`
- `update column`
- `add card`
- `update card name`
- `update card column`
- `update card chat`
- `update card content`
- `update card order`
- `load columns`
- `load cards`
- `user typing`

With these requests, the parameters should use the following fields depending on what is receiving the message:

```ts
// WEB SOCKET SERVER MESSAGE PARAMS (MESSAGES TO THE BACKEND)
type WSSPARAMS = {
    messageType: string

    cardId: number
    cardName: string
    cardContent: string
    cardOrder: number

    columnName: string
    columnId: number

    userName: string
    message: string
}

// WEB SOCKET MESSAGE PARAMS (MESSAGES TO THE FRONTEND)
type WSPARAMS = {
    messageType : string

    card : Card
    column : Column

    columns : Column[]
    cards : Card[]

    typingUsers? : {
        userName : string
        cardId: number
    }
    isTyping : boolean
}
```
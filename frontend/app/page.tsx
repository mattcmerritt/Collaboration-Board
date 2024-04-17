'use client'

import { useState, useEffect, useRef } from 'react'
import KanbanColumn from "./KanbanColumn.tsx"
import ChatPage from "./ChatPage.tsx"
import { Card, Column, TypingUser } from "./Types.ts"
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export default function Home() {
  // state variables
  const [columns, setColumns] = useState([] as Column[])
  const [columnCount, setColumnCount] = useState(1)
  const [cardCount, setCardCount] = useState(1)
  const [conversation, setConversation] = useState(0)
  const [cardActive, setCardActive] = useState(false)
  const [activeCardName, setActiveCardName] = useState('default')

  // set up the websocket as some sort of React Hook and Effect so other React Components can use it
  const ws = useRef(null as unknown as WebSocket)
  useEffect(() => {
    // if doing a demo for multiple machines, switch this to an IP address
    const socket = new WebSocket("ws://localhost:8080")
    socket.addEventListener("open", () => {
      console.log("Connected to websocket server.")

      // send request to load all the columns
      ws.current.send(JSON.stringify({
        "messageType": "load columns"
      }))
    })

    socket.addEventListener("message", (e : MessageEvent) => {
      // parsing all the possible elements from the message data
      const message : {
        messageType : string, 
        card? : Card
        column? : Column
        cards? : Card[]
        columns? : Column[]
        typingUsers? : TypingUser[]
        isTyping? : boolean
      } = JSON.parse(e.data)
      
      // if a column is added, render it
      if (message.messageType === 'add column') {
        setColumns(c => c.concat(message.column!))
        setColumnCount(c => c + 1)
      }
      // if a column is renamed, update it
      else if (message.messageType === 'update column') {
        const input : HTMLInputElement | null = document.getElementById("column-title-" + message.column!.id) as HTMLInputElement
        input.value = message.column!.name
      }
      // if columns are loaded, show all
      else if (message.messageType === 'load columns') {
        if (message.columns!.length > 0) {
          setColumns(message.columns!)
          setColumnCount(message.columns!.length + 1) // +1 to avoid duplicate column on reload
  
          // TODO: runs too early for the columns to listen for it
          //  current work around is a 1ms delay, but better solutions should be achievable
          // load each column's cards too
          setTimeout(() => {
            for (const col of message.columns!) {
              socket.send(JSON.stringify({
                "messageType": "load cards",
                "columnId": col.id
              }))
            }
          }, 1)
        }
      }
    })

    ws.current = socket

    return () => socket.close()
  }, [])

  // chat modal JSX component
  const chatPage = <ChatPage ws={ws.current} conversation={conversation} activeCardName={activeCardName} onCardHide={() => setCardActive(false)}/>

  function addColumn() {
    ws.current.send(JSON.stringify({
      "messageType": "add column",
      "columnId": columnCount,
      "columnName": "New Column"
    }))
  }

  function displayColumns() {
    const columnComponents : JSX.Element[] = []

    // TODO: ws check or query to make sure we have all the cards
    const columnsToDisplay : Column[] = columns

    if (columnsToDisplay) {
      columns?.forEach(col => {
        columnComponents.push(
          <KanbanColumn 
            key={col.id}
            colNum={col.id}
            colCount={columnCount}
            cardCount={cardCount}
            name={col.name}
            ws={ws.current}
            incrementCardCount={() => setCardCount(c => c + 1)}
            setConversation={(value : number) => setConversation(value)}
            onCardActivate={() => setCardActive(true)}
            setActiveCardName={(name : string) => setActiveCardName(name)}
          />
        )
      })
    }

    return columnComponents
  }

  function displayCardModal() {
    if (cardActive) {
      return chatPage
    }
    else {
      return
    }
  }

  return (
    <div id="content">
      <h1 className="py-5 flex bg-blue-500 items-center justify-center text-3xl">Collaboration Board</h1>

      <DndProvider backend={HTML5Backend}>
        <div id="board" className="flex bg-blue-300">
          {displayColumns()}
          <button className="flex-initial grow-0 shrink-0 w-64 h-8 m-2 px-1 flex-initial bg-blue-400 rounded-lg" onClick={addColumn}>Add Column</button>
        </div>
      </DndProvider>

      {displayCardModal()}
    </div>
  )
}
'use client'

import Image from "next/image"
import { useState, useEffect, useRef } from 'react'
import KanbanColumn from "./KanbanColumn.tsx"
import ChatPage from "./ChatPage.tsx"
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export default function Home() {
  type Column = {
    id : number
    name : string
  }

  // state variables
  const [columns, setColumns] = useState([] as Column[])
  const [columnCount, setColumnCount] = useState(1)
  const [cardCount, setCardCount] = useState(1)
  const [conversation, setConversation] = useState('default')
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
        "ws_msg_type": "load columns"
      }))
    })

    socket.addEventListener("message", (e : MessageEvent) => {
      // parsing all the possible elements from the message data
      const message : {
        ws_msg_type : string, 
        id : number,
        name : string,
        column : number,
        columns : Column[]
      } = JSON.parse(e.data)
      
      // if a column is added, render it
      if (message.ws_msg_type === 'add column') {
        // TODO: change this to message.id instead of the length workaround
        setColumns(c => c.concat({id : c.length + 1, name : message.name}))
        setColumnCount(c => c + 1)
      }
      // if a column is renamed, update it
      else if (message.ws_msg_type === 'update column') {
        const input : HTMLInputElement | null = document.getElementById("column-title-" + message.column) as HTMLInputElement
        input.value = message.name
      }
      // if columns are loaded, show all
      else if (message.ws_msg_type === 'load columns') {
        const dbCols = message.columns
        if (dbCols.length > 0) {
          setColumns(dbCols)
          setColumnCount(dbCols.length)
  
          // TODO: runs too early for the columns to listen for it
          //  current work around is a 1ms delay, but better solutions should be achievable
          // load each column's cards too
          setTimeout(() => {
            for (const dbCol of dbCols) {
              socket.send(JSON.stringify({
                "ws_msg_type": "load cards",
                "column": dbCol.id
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
      "ws_msg_type": "add column",
      "id": columnCount,
      "name": ""
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
            setConversation={(value : string) => setConversation(value)}
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
      <h1 className="bg-blue-500 text-3xl">Collaboration Board</h1>
      <button className="m-2 ring-2 ring-gray-950" onClick={addColumn}>Add Column</button>

      <DndProvider backend={HTML5Backend}>
        <div id="board" className="flex bg-blue-300">
          {displayColumns()}
        </div>
      </DndProvider>

      {displayCardModal()}
    </div>
  )
}
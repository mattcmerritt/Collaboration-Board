'use client'

import Image from "next/image"
import { useState, useEffect, useRef } from 'react'
import KanbanColumn from "./KanbanColumn.tsx"
import ChatPage from "./ChatPage.tsx"

export default function Home() {
  type Column = {
    id : number
  }

  // state variable for card id
  const colCountRef = useRef(1)

  function increaseColCount() {
    colCountRef.current = colCountRef.current + 1
  }

  // set up the websocket as some sort of React Hook and Effect so other React Components can use it
  const ws = useRef(null as unknown as WebSocket)
  useEffect(() => {
    // if doing a demo for multiple machines, switch this to an IP address
    const socket = new WebSocket("ws://localhost:8080")
    socket.addEventListener("open", () => {
      console.log("Connected to websocket server.")
    })

    socket.addEventListener("message", (e : MessageEvent) => {
      // parsing all the possible elements from the message data
      const message : {
        ws_msg_type : string, 
        id : number,
        name : string,
        column : number
      } = JSON.parse(e.data)
      
      // if a column is added, render it
      if (message.ws_msg_type === 'add column') {
        setColumns(c => c.concat({id:colCountRef.current}))
        increaseColCount()
      }
      // if a column is renamed, update it
      else if (message.ws_msg_type === 'update column') {
        const input : HTMLInputElement | null = document.getElementById("column-title-" + message.id) as HTMLInputElement
        input.value = message.name
      }
    })

    ws.current = socket

    return () => socket.close()
  }, [])

  // state variable for card id
  const [cardCount, setCardCount] = useState(1)
  const [columns, setColumns] = useState([] as Column[])

  function increaseCardCount() {
    setCardCount(c => c + 1)
  }

  function addColumn() {
    ws.current.send(JSON.stringify({
      "ws_msg_type": "add column",
      "id": colCountRef.current,
      "name": ""
    }))
  }

  // END OF STATE STUFF

  function displayColumns() {
    const columnComponents : JSX.Element[] = []

    // TODO: ws check or query to make sure we have all the cards
    const columnsToDisplay : Column[] = columns

    if (columnsToDisplay) {
      columns?.forEach(col => {
        columnComponents.push(
          <KanbanColumn 
            colNum={col.id}
            cardCount={cardCount}
            onCardCountIncrease={increaseCardCount}
            ws={ws.current}
            colCount={colCountRef.current}
          />
        )
      })
    }

    return columnComponents
  }

  return (
    <div id="content">
      <h1 className="bg-blue-500 text-3xl">Collaboration Board</h1>
      <button className="m-2 ring-2 ring-gray-950" onClick={addColumn}>Add Column</button>

      <div id="board" className="flex bg-blue-300">
        {displayColumns()}
      </div>

      <ChatPage ws={ws.current} />
    </div>
  )
}
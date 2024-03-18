'use client'

import Image from "next/image"
import { useState, useEffect, useRef } from 'react'
import KanbanColumn from "./KanbanColumn.tsx"
import ChatPage from "./ChatPage.tsx"

export default function Home() {
  // card hook?
  const [col, setCol] = useState("")

  function handleColChange() {
    console.log("Something changed with the column")
  }

  // set up the websocket as some sort of React Hook and Effect so other React Components can use it
  const ws = useRef(null as unknown as WebSocket)
  useEffect(() => {
    // if doing a demo for multiple machines, switch this to an IP address
    const socket = new WebSocket("ws://localhost:8080")
    socket.addEventListener("open", () => {
      console.log("Connected to websocket server.")
    })

    ws.current = socket

    return () => socket.close()
  }, [])

  // END OF STATE STUFF

  const [columns, setColumns] = useState([] as string[])

  function addColumn() {
    setColumns(c => c.concat("new"))
  }

  function displayColumns() {
    const columnComponents : JSX.Element[] = []

    const columnsToDisplay : string[] = columns

    if (columnsToDisplay) {
      columns?.forEach(col => {
        columnComponents.push(
          <KanbanColumn 
            value={"New Column"}
            onChange={setCol}
          />
        )
      })
    }

    console.log("displaying: length is " + columnComponents.length)

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
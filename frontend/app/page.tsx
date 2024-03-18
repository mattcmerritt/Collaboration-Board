'use client'

import Image from "next/image"
import { useState, useEffect, useRef } from 'react'
import KanbanCard from "./KanbanCard.tsx"

export default function Home() {
  // card hook?
  const [card, setCard] = useState("")

  function handleCardChange() {
    console.log("Something changed with the card")
  }

  // END OF STATE STUFF

  const [columns, setColumns] = useState([] as string[])

  function addColumn() {
    setColumns(c => c.concat("new"))

    // console.log("adding: new length is " + columns.length)
  }

  function displayColumns() {
    const columnComponents : JSX.Element[] = []

    const columnsToDisplay : string[] = columns

    if (columnsToDisplay) {
      columns?.forEach(col => {
        columnComponents.push(
          <KanbanCard 
            value={card}
            onChange={handleCardChange}
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
      <button className="mx-2 ring-2 ring-gray-950" onClick={addColumn}>Add Column</button>

      <div id="board" className="flex bg-blue-300">
        {displayColumns()}
      </div>
    </div>
  )
}
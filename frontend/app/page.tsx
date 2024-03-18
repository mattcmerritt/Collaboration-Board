'use client'

import Image from "next/image"
import { useState, useEffect, useRef } from 'react'
import KanbanColumn from "./KanbanColumn.tsx"

export default function Home() {
  // card hook?
  const [col, setCol] = useState("")

  function handleColChange() {
    console.log("Something changed with the column")
  }

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
    </div>
  )
}
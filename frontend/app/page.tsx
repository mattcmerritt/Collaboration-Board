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
  const [colCount, setColCount] = useState(1)

  function increaseColCount() {
    setColCount(c => c + 1)
  }

  // state variable for card id
  const [cardCount, setCardCount] = useState(1)

  function increaseCardCount() {
    setCardCount(c => c + 1)
  }

  const [columns, setColumns] = useState([] as Column[])

  function addColumn() {
    setColumns(c => c.concat({id:colCount}))
    increaseColCount()
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
            // might need to pass ws ref here as well
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

      <ChatPage />
    </div>
  )
}
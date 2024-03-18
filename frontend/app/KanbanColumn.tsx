'use client'

import { useState } from 'react'
import KanbanCard from "./KanbanCard.tsx"

export default function KanbanColumn(props : { colNum : any, cardCount : any, onCardCountIncrease : any}) {
  type Card = {
    id : number
  }
  
  const [cards, setCards] = useState([] as Card[])
  
  function addCard() {
    setCards(c => c.concat({id:props.cardCount}))
    props.onCardCountIncrease()
  }

  function generateCardsForColumn(value : any) {
    const cardComponents : JSX.Element[] = []

    // TODO: ws check or query to make sure we have all the cards

    if (cards) {
      cards?.forEach(card => {
        cardComponents.push(
          <KanbanCard 
            id={card.id}
            col={props.colNum}
          />
        )
      })
    }

    return cardComponents
  }

  function updateColumnName() {
    // might need to use ws ref here later
    console.log("change in the name of column " + props.colNum)
  }

  return (
    <div className="m-2 flex flex-col bg-blue-400" id="kanban-column">
      <input className="m-1 px-1 bg-blue-300 ring-2 ring-blue-500 rounded-lg" id="column-title" type="text" onChange={updateColumnName} />
      {generateCardsForColumn(props.colNum)}
      <button className="m-1 ring-2 ring-gray-950" onClick={addCard}>Add Card</button>
    </div>
  )
}
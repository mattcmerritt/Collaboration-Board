'use client'

import { useState } from 'react'
import KanbanCard from "./KanbanCard.tsx"

export default function KanbanColumn(props : { value : any, onChange : any }) {
  type Card = {
    id : string,
    name : string
    // TODO: maybe add more here
  }
  
  const [cards, setCards] = useState([] as Card[])
  
  function addCard() {
    setCards(c => c.concat({id:"newcard", name:"newname"}))
  }

  function generateCardsForColumn(value : any) {
    const cardComponents : JSX.Element[] = []

    if (cards) {
      cards?.forEach(card => {
        cardComponents.push(
          <KanbanCard 
            value={card.name}
            onChange={() => console.log("card change?")}
          />
        )
      })
    }

    return cardComponents
  }

  return (
    <div className="m-2 flex flex-col bg-blue-400" id="kanban-column">
      <input className="m-1 ring-1 ring-gray-950" id="column-title" type="text" onChange={props.onChange} />
      {generateCardsForColumn(props.value)}
      <button className="m-1 ring-2 ring-gray-950" onClick={addCard}>Add Card</button>
    </div>
  )
}
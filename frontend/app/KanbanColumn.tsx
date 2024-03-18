'use client'

import { useState, useEffect } from 'react'
import KanbanCard from "./KanbanCard.tsx"

export default function KanbanColumn(props : { colNum : any, cardCount : any, onCardCountIncrease : any, ws : WebSocket, colCount : any}) {
  type Card = {
    id : number,
    col : number
  }
  
  const [cards, setCards] = useState([] as Card[])

  // ws updaters
  useEffect(() => {
    // only add chat listeners if socket is prepared
    if (!props.ws) return

    props.ws.addEventListener("message", (e : MessageEvent) => {
      // parsing all the possible elements from the message data
      const message : {
        ws_msg_type : string, 
        id : number,
        name : string,
        column : number
      } = JSON.parse(e.data)
      
      // if a card is added, render it
      if (message.ws_msg_type === 'add card') {
        setCards(c => c.concat({id:message.id, col:message.column}))
        props.onCardCountIncrease()
      }
      // if a card is added, render it
      else if (message.ws_msg_type === 'move card') {
        setCards(c => c.concat({id:message.id, col:message.column}))
      }
      // if a card is renamed, update it
      else if (message.ws_msg_type === 'update card') {
        const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + message.id) as HTMLInputElement
        nameInput.value = message.name
      }
    })
  }, [props.ws])
  
  function addCard() {
    props.ws.send(JSON.stringify({
      "ws_msg_type": "add card",
      "id": props.cardCount,
      "name": "",
      "column": props.colNum
    }))
  }

  function generateCardsForColumn(value : any) {
    const cardComponents : JSX.Element[] = []

    // TODO: ws check or query to make sure we have all the cards

    if (cards) {
      cards?.forEach(card => {
        // TODO: this if statement is very sloppy - ideally this should not be necessary
        // and cards that are no longer in this column should be cleared from the state
        // this is not the case though
        if(card.col == props.colNum) {
          cardComponents.push(
            <KanbanCard 
              id={card.id}
              col={props.colNum}
              ws={props.ws}
              colCount={props.colCount}
            />
          )
        }
      })
    }

    return cardComponents
  }

  function updateColumnName() {
    const input : HTMLInputElement | null = document.getElementById("column-title-" + props.colNum) as HTMLInputElement
    
    props.ws.send(JSON.stringify({
      "ws_msg_type": "update column",
      "id": props.colNum,
      "name": input.value.trim()
    }))
  }

  return (
    <div className="m-2 flex flex-col bg-blue-400" id={"kanban-column-" + props.colNum}>
      <input className="m-1 px-1 bg-blue-300 ring-2 ring-blue-500 rounded-lg" id={"column-title-" + props.colNum} type="text" onChange={updateColumnName} />
      {generateCardsForColumn(props.colNum)}
      <button className="m-1 ring-2 ring-gray-950" onClick={addCard}>Add Card</button>
    </div>
  )
}
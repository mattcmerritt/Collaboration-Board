'use client'

import { useState, useEffect, useRef, MutableRefObject } from 'react'
import KanbanCard from "./KanbanCard.tsx"

export default function KanbanColumn(props : { colNum : any, colCount : MutableRefObject<number>, cardCount : any, ws : WebSocket, incrementCardCount : any, setConversation : any, onCardActivate : any}) {
  type Card = {
    id : number,
    name: string,
    col : number
  }
  
  const [cards, setCards] = useState([] as Card[])

  const wsListenerConfiguredRef = useRef(false)
  const wsListenerRef = useRef(null as unknown as (this: WebSocket, ev: MessageEvent<any>) => any)

  // extracting callback function from props
  // prevents warning on dependencies in websocket effect below
  const incrementCardCount = props.incrementCardCount

  // ws updaters
  useEffect(() => {
    // only add chat listeners if socket is prepared
    if (!props.ws) return

    // if reloading, remove existing listener and put on a new one with proper conversation
    if (wsListenerConfiguredRef.current) {
      wsListenerConfiguredRef.current = false
      props.ws.removeEventListener("message", wsListenerRef.current)
    }

    // creating and attaching listener to websocket
    const messageListener : (this: WebSocket, ev: MessageEvent<any>) => any = (e : MessageEvent) => {
      // parsing all the possible elements from the message data
      const message : {
        ws_msg_type : string, 
        id : number,
        name : string,
        column : number,
        cards : any // TODO: find type
      } = JSON.parse(e.data)
      
      // if a card is added, render it
      if (message.ws_msg_type === 'add card') {
        setCards(c => c.concat({id:message.id, name:message.name, col:message.column}))
        // only increment the card counter if this column contains the new card
        if (message.column === props.colNum) {
          incrementCardCount()
        }
      }
      // if a card is added, render it
      else if (message.ws_msg_type === 'move card') {
        setCards(c => c.concat({id:message.id, name:message.name, col:message.column}))
      }
      // if a card is removed, filter it out
      else if (message.ws_msg_type === 'remove card') {
        setCards(c => c.filter((card) => card.id !== message.id || card.col !== message.column))
      }
      // if a card is renamed, update it
      else if (message.ws_msg_type === 'update card') {
        const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + message.id) as HTMLInputElement
        nameInput.value = message.name

        // repopulating the cards
        setCards(c => c.filter((card) => card.id !== message.id).concat({id:message.id, name:message.name, col:message.column}))
      }
      else if (message.ws_msg_type === 'load cards')
      {
        // TODO: figure out what should be happening here?
        // setCards(message.columns)
        // console.log(message.cards)
      }
    }
    props.ws.addEventListener("message", messageListener)

    // storing the listener for updates later
    wsListenerRef.current = messageListener
    wsListenerConfiguredRef.current = true
  }, [props.ws, props.colNum, incrementCardCount])
  
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
    props.ws.send(JSON.stringify({
      "ws_msg_type": "load cards",
      "column": props.colNum
    }))

    if (cards) {
      cards?.forEach(card => {
        // TODO: this if statement is very sloppy - ideally this should not be necessary
        // and cards that are no longer in this column should be cleared from the state
        // this is not the case though
        if(card.col == props.colNum) {
          cardComponents.push(
            <KanbanCard 
              id={card.id}
              name={card.name}
              col={props.colNum}
              ws={props.ws}
              colCount={props.colCount.current}
              setConversation={props.setConversation}
              onCardActivate={props.onCardActivate}
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
      "name": input.value
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
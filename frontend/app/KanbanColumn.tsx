'use client'

import { useState, useEffect, useRef } from 'react'
import KanbanCard from "./KanbanCard.tsx"
import { Card, Column, TypingUser } from "./Types.ts"
import { useDrop } from 'react-dnd'
import { ItemTypes } from './ItemTypes.tsx'

export default function KanbanColumn(props : { colNum : any, colCount : any, cardCount : any, name : any, ws : WebSocket, incrementCardCount : any, setConversation : any, onCardActivate : any, setActiveCardName : any}) {
  // state variables
  const [cards, setCards] = useState([] as Card[])
  const [name, setName] = useState(props.name as string)

  const wsListenerConfiguredRef = useRef(false)
  const wsListenerRef = useRef(null as unknown as (this: WebSocket, ev: MessageEvent<any>) => any)

  // extracting callback function from props
  // prevents warning on dependencies in websocket effect below
  const incrementCardCount = props.incrementCardCount

  // drop stuff
  const [{ isOver, isOverCurrent }, drop] = useDrop(
    () => ({
      accept: ItemTypes.CARD,
      drop(_item, monitor) {
        const didDrop = monitor.didDrop()
        console.log(`drop on ${props.colNum}`)
        return { col : props.colNum } // for use in drag through monitor.getDropResult()
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
      }),
    }),
    [],
  )

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
        messageType : string, 
        card? : Card
        column? : Column
        cards? : Card[]
        columns? : Column[]
        typingUsers? : TypingUser[]
        isTyping? : boolean
      } = JSON.parse(e.data)
      
      // if a card is added, render it
      if (message.messageType === 'add card') {
        // only add card and increment the card counter if this column contains the new card
        if (message.card!.column === props.colNum) {
          setCards(c => c.concat(message.card!))
          incrementCardCount()
        }
      }
      // if a card is renamed, update it
      else if (message.messageType === 'update card name') {
        const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + message.card!.id) as HTMLInputElement
        nameInput.value = message.card!.name

        // repopulating the cards
        setCards(c => c.filter((card) => card.id !== message.card!.id).concat(message.card!))
      }
      // if a card is moved, remove it if it was in this column, or add it if it wasn't and should be
      else if (message.messageType === 'update card column') {
        // removing the card if it was in the column and should not be
        if (message.card!.column !== props.colNum) {
          setCards(c => c.filter((card) => card.id !== message.card!.id))
        }
        // otherwise, add the card to the column
        else {
          setCards(c => c.concat(message.card!))
        }
      }
      else if (message.messageType === 'load cards')
      {
        if (message.cards!.length > 0 && message.cards![0].column == props.colNum) {
          setCards(message.cards!)
          for (let i = 0; i < message.cards!.length; i++) {
            incrementCardCount()
          }
        }
      }
    }
    props.ws.addEventListener("message", messageListener)

    // storing the listener for updates later
    wsListenerRef.current = messageListener
    wsListenerConfiguredRef.current = true
  }, [props.ws, props.colNum, incrementCardCount])
  
  function addCard() {
    props.ws.send(JSON.stringify({
      "messageType": "add card",
      "cardId": props.cardCount,
      "cardName": "New Card",
      "columnId": props.colNum
    }))
  }

  function generateCardsForColumn(value : any) {
    const cardComponents : JSX.Element[] = []

    if (cards) {
      cards?.forEach(card => {
        // TODO: this if statement is very sloppy - ideally this should not be necessary
        // and cards that are no longer in this column should be cleared from the state
        // this is not the case though
        if(card.column == props.colNum) {
          cardComponents.push(
            <KanbanCard 
              key={card.id}
              id={card.id}
              name={card.name}
              col={props.colNum}
              ws={props.ws}
              colCount={props.colCount}
              setConversation={props.setConversation}
              onCardActivate={props.onCardActivate}
              setActiveCardName={props.setActiveCardName}
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
      "messageType": "update column",
      "columnId": props.colNum,
      "columnName": input.value
    }))

    setName(input.value)
  }

  return (
    <div ref={drop} className="m-2 flex flex-col bg-blue-400 rounded-lg" id={"kanban-column-" + props.colNum}>
      <input className="m-1 px-1 bg-blue-300 rounded-lg placeholder-blue-800" id={"column-title-" + props.colNum} type="text" placeholder={`Column ${props.colNum}`} onChange={updateColumnName} value={name}/>
        <div className="m-2 flex flex-col bg-blue-400" id={"kanban-column-container-" + props.colNum}>
          {generateCardsForColumn(props.colNum)}
        </div>
      <button className="m-2 py-1 bg-blue-500 rounded-lg" onClick={addCard}>Add Card</button>
    </div>
  )
}
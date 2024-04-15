'use client'

import { useState, useEffect, useRef, MutableRefObject } from 'react'
import KanbanCard from "./KanbanCard.tsx"
import { useDrop } from 'react-dnd'
import { ItemTypes } from './ItemTypes.tsx'

export default function KanbanColumn(props : { colNum : any, colCount : any, cardCount : any, name : any, ws : WebSocket, incrementCardCount : any, setConversation : any, onCardActivate : any, setActiveCardName : any}) {
  type Card = {
    id : number,
    name: string,
    columnnumber : number
  }
  
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

    // TODO: determine why this is running later than expected
    //  maybe ws.current only works when the socket is loaded, so this never calls?
    //  also, calls to load cards cause permanent loading loops due to the 
    //  dependency on increaseCardCount
    /*
    props.ws.addEventListener("open", () => {
      props.ws.send(JSON.stringify({
        "ws_msg_type": "load cards",
        "column": props.colNum
      }))
    })
    */

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
        setCards(c => c.concat({id:message.id, name:message.name, columnnumber:message.column}))
        // only increment the card counter if this column contains the new card
        if (message.column === props.colNum) {
          incrementCardCount()
        }
      }
      // if a card is added, render it
      else if (message.ws_msg_type === 'move card') {
        setCards(c => c.concat({id:message.id, name:message.name, columnnumber:message.column}))
      }
      // if a card is removed, filter it out
      else if (message.ws_msg_type === 'remove card') {
        setCards(c => c.filter((card) => card.id !== message.id || card.columnnumber !== message.column))
      }
      // if a card is renamed, update it
      else if (message.ws_msg_type === 'update card') {
        const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + message.id) as HTMLInputElement
        nameInput.value = message.name

        // repopulating the cards
        setCards(c => c.filter((card) => card.id !== message.id).concat({id:message.id, name:message.name, columnnumber:message.column}))
      }
      else if (message.ws_msg_type === 'load cards')
      {
        if (message.column == props.colNum) {
          setCards(message.cards)
          for (let i = 0; i < message.cards.length; i++) {
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
      "ws_msg_type": "add card",
      "id": props.cardCount,
      "name": "",
      "column": props.colNum
    }))
  }

  function generateCardsForColumn(value : any) {
    const cardComponents : JSX.Element[] = []

    if (cards) {
      cards?.forEach(card => {
        // TODO: this if statement is very sloppy - ideally this should not be necessary
        // and cards that are no longer in this column should be cleared from the state
        // this is not the case though
        if(card.columnnumber == props.colNum) {
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
      "ws_msg_type": "update column",
      "id": props.colNum,
      "name": input.value
    }))

    setName(input.value)
  }

  return (
    <div ref={drop} className="m-2 flex flex-col bg-blue-400" id={"kanban-column-" + props.colNum}>
      <input className="m-1 px-1 bg-blue-300 ring-2 ring-blue-500 rounded-lg" id={"column-title-" + props.colNum} type="text" onChange={updateColumnName} value={name}/>
        <div className="m-2 flex flex-col bg-blue-400" id={"kanban-column-container-" + props.colNum}>
          {generateCardsForColumn(props.colNum)}
        </div>
      <button className="m-1 ring-2 ring-gray-950" onClick={addCard}>Add Card</button>
    </div>
  )
}
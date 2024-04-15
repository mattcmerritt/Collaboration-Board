'use client'

import { useDrag } from 'react-dnd'
import { ItemTypes } from './ItemTypes.tsx'

export default function KanbanCard(props : { id : any, name : string, col : any, ws : WebSocket, colCount : any, setConversation : any, onCardActivate : any, setActiveCardName : any }) {
  // drag stuff
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CARD,
    end: (item, monitor) => {
      const dropResult : {col : any} | null = monitor.getDropResult() // gives object { col : <column dropped into> }
      if (item && dropResult) {
        console.log(`You dropped card ${props.id} into column ${dropResult.col}!`)
        moveToHoveredColumn(dropResult.col)
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }))
  const opacity = isDragging ? 0.4 : 1
  
  function openChat() {
    props.setConversation(props.id)
    props.onCardActivate()

    // TODO: redo all this name input stuff with states
    const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + props.id) as HTMLInputElement
    props.setActiveCardName(nameInput.value)
  }

  function moveCardRequest(newCol : number) {
    // send request to put in the new card
    props.ws.send(JSON.stringify({
      "messageType": "update card column",
      "cardId": props.id,
      "columnId": newCol
    }))
  }

  function updateCardText() {
    // fetch name of card
    const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + props.id) as HTMLInputElement
    
    // send request
    props.ws.send(JSON.stringify({
      "messageType": "update card name",
      "cardId": props.id,
      "cardName": nameInput.value,
    }))
  }
  
  function moveToHoveredColumn(hoveredCol : number) {
    // grab reference to column to move to
    const destinationCol = document.getElementById("kanban-column-container-" + hoveredCol)

    // grab reference to card to move
    const replacementCard = document.getElementById("kanban-card-" + props.id)
    
    // place card into column
    if(destinationCol !== null && replacementCard !== null) {
      if(hoveredCol !== props.col)
      {
        moveCardRequest(hoveredCol)
      }
      // destinationCol?.appendChild(replacementCard)
    }
  }

  return (
    <div ref={drag} className="m-2 p-1 flex flex-col bg-blue-300 rounded-lg" id={"kanban-card-" + props.id}>
      <textarea className="m-2 px-1 resize-none bg-blue-200 rounded-lg" id={"card-name-" + props.id} onChange={updateCardText} value={props.name}/>
      <button className="m-1 bg-blue-100 rounded-lg" onClick={openChat}>View Chat</button>
      <div className="flex flex-row">
      </div>
    </div>
  )
}
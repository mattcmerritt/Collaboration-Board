'use client'

import Draggable from 'react-draggable';

export default function KanbanCard(props : { id : any, name : string, col : any, columnHovered : any, ws : WebSocket, colCount : any, setConversation : any, onCardActivate : any, setActiveCardName : any }) {
  function openChat() {
    props.setConversation(`${props.id}`)
    props.onCardActivate()

    // TODO: redo all this name input stuff with states
    const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + props.id) as HTMLInputElement
    props.setActiveCardName(nameInput.value)
  }

  function moveCard(change : number) {
    // check to see if move is valid first
    if((props.col + change) > 0 && (props.col + change) < props.colCount)
    {
      // send request to put in the new card
      props.ws.send(JSON.stringify({
        "messageType": "update card column",
        "cardId": props.id,
        "columnId": props.col + change
      }))
    }
    else {
      console.log("bounds exception on moving card " + props.id + " from " + props.col + " to " + (props.col + change))
    }
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
  
  function moveToHoveredColumn() {
    const hoveredCol = props.columnHovered // TODO: should be state instead
    const destinationCol = document.getElementById("kanban-column-container-" + hoveredCol)

    const replacementCard = document.getElementById("kanban-card-" + props.id)
    
    // const replacementCard : ReactElement = (
    //   <Draggable
    //     onStop={moveToHoveredColumn}
    //   >
    //     <div className="m-2 p-1 flex flex-col bg-blue-300 ring-2 ring-blue-500 rounded-lg" id={"kanban-card-" + props.id}>
    //       <textarea className="m-2 px-1 bg-blue-200 rounded-lg" id={"card-name-" + props.id} onChange={updateCardText} value={props.name}/>
    //       <button className="m-1 ring-2 ring-gray-950" onClick={openChat}>View Chat</button>
    //       <div className="flex flex-row">
    //         <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(-1)}>Move left</button>
    //         <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(1)}>Move right</button>
    //       </div>
    //     </div>
    //   </Draggable>
    // )

    if(destinationCol !== null && replacementCard !== null) {
      destinationCol?.appendChild(replacementCard)
      // TODO: this messes up the displacement if redragged
      replacementCard.style.transform = "initial" // set position to initial to put back in columns
    }
  }

  return (
    <Draggable
      position={{x: 0, y: 0}}
      onStop={() => {
        moveToHoveredColumn()
      }}
    >
      <div className="m-2 p-1 flex flex-col bg-blue-300 ring-2 ring-blue-500 rounded-lg" id={"kanban-card-" + props.id}>
        <textarea className="m-2 px-1 bg-blue-200 rounded-lg" id={"card-name-" + props.id} onChange={updateCardText} value={props.name}/>
        <button className="m-1 ring-2 ring-gray-950" onClick={openChat}>View Chat</button>
        <div className="flex flex-row">
          <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(-1)}>Move left</button>
          <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(1)}>Move right</button>
        </div>
      </div>
    </Draggable>
    
  )
}
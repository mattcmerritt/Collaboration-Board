'use client'

import { useState } from "react"
import { ConversationContext } from "./ConversationContext"

export default function KanbanCard(props : { id : any, name : string, col : any, ws : WebSocket, colCount : any }) {
  const [conversationName, setConversationName] = useState('default')
  
  function openChat() {
    console.log(`Chat for id:${props.id} col:${props.col}`)
    setConversationName(`${props.id}`)
  }

  function moveCard(change : number) {
    // check to see if move is valid first
    if((props.col + change) > 0 && (props.col + change) < props.colCount)
    {
      // fetch name of card
      const nameInput : HTMLInputElement | null = document.getElementById("card-name-" + props.id) as HTMLInputElement
    
      // send request to put in the new card
      props.ws.send(JSON.stringify({
        "ws_msg_type": "move card",
        "id": props.id,
        "name": nameInput.value.trim(),
        "column": props.col + change
      }))

      // send request to remove the old card
      props.ws.send(JSON.stringify({
        "ws_msg_type": "remove card",
        "id": props.id,
        "name": nameInput.value.trim(),
        "column": props.col
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
      "ws_msg_type": "update card",
      "id": props.id,
      "name": nameInput.value.trim(),
      "column": props.col
    }))
  }
  
  return (
    <div className="m-2 p-1 flex flex-col bg-blue-300 ring-2 ring-blue-500 rounded-lg" id={"kanban-card-" + props.id}>
      <textarea className="m-2 px-1 bg-blue-200 rounded-lg" id={"card-name-" + props.id} onChange={updateCardText} value={props.name}/>
      <ConversationContext.Provider value={conversationName}>
        <button className="m-1 ring-2 ring-gray-950" onClick={openChat}>View Chat</button>
      </ConversationContext.Provider>
      <div className="flex flex-row">
        <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(-1)}>Move left</button>
        <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(1)}>Move right</button>
      </div>
    </div>
  )
}
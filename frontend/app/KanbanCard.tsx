'use client'

export default function KanbanCard(props : { id : any, col : any}) {
  function openChat() {
    console.log("the chat has been opened")
  }

  function moveCard(change : number) {
    // TODO: likely will need ws to update card values here
    console.log("card id " + props.id + " attempted to move to " + (props.col + change))
  }

  function updateCardText() {
    console.log("card change on id " + props.id)
  }
  
  return (
    <div className="m-2 p-1 flex flex-col bg-blue-300 ring-2 ring-blue-500 rounded-lg" id="kanban-card">
      <textarea className="m-2 px-1 bg-blue-200 rounded-lg" id="name-input" onChange={updateCardText} />
      <button className="m-1 ring-2 ring-gray-950" onClick={openChat}>View Chat</button>
      <div className="flex flex-row">
        <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(-1)}>Move left</button>
        <button className="m-1 flex-1 bg-blue-300 ring-2 ring-gray-950 rounded-lg" onClick={() => moveCard(1)}>Move right</button>
      </div>
    </div>
  )
}
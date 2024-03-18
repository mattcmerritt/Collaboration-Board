'use client'

export default function KanbanCard(props : { value : any, onChange : any, ws : WebSocket }) {
  function openChat() {
    console.log("the chat has been opened")
  }
  
  return (
    <div className="m-2 p-1 flex flex-col bg-blue-300 ring-2 ring-blue-500 rounded-lg" id="kanbancard">
      <textarea className="m-2 px-1 bg-blue-200 rounded-lg" id="name-input" onChange={props.onChange} />
      <button className="m-1 ring-2 ring-gray-950" onClick={openChat}>View Chat</button>
    </div>
  )
}
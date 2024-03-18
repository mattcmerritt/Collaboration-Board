'use client'

import { useState } from 'react'

export default function KanbanColumn(props : { value : any, onChange : any }) {
  function addCard() {
    console.log("added a card")
  }

  return (
    <div className="m-2 flex flex-col py-1 bg-blue-400" id="kanban-column">
      <input className="m-1 ring-1 ring-gray-950" id="column-title" type="text" onChange={props.onChange} />
      <br />
      <button className="m-1 ring-2 ring-gray-950" onClick={addCard}>Add Card</button>
    </div>
  )
}
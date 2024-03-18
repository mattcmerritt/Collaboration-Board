'use client'

export default function KanbanCard(props : { value : any, onChange : any }) {
  return (
    <div className="py-1 bg-blue-400" id="kanbancard">
      <label htmlFor="name-input">This is a card</label>
      <textarea className="" id="name-input" onChange={props.onChange} />
      <br />
    </div>
  )
}
'use client'

export default function ConversationForm(props : { value : any, onChange : any }) {
  return (
    <div className="py-1" id="message">
      <label htmlFor="conversation-input">Current conversation: </label>
      <input className="ring-1 ring-gray-950 focus:ring-4 ring-gray-950" id="conversation-input" type="text" onChange={props.onChange} />
      <br />
    </div>
  )
}
'use client'

export default function MessageForm(props : { value : any, onChange : any }) {
  return (
    <div className="py-1" id="message">
      <label htmlFor="message-input">Message Content: </label>
      <input className="ring-1 ring-gray-950 focus:ring-4 ring-gray-950" id="message-input" type="text" onChange={props.onChange} />
    </div>
  )
}
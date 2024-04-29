'use client'

export default function MessageForm(props : { value : any, onChange : any }) {
  return (
    <div className="py-1" id="message">
      <label htmlFor="message-input">New Message: </label>
      <textarea className="w-full h-1/3 bg-gray-200 p-5 rounded-lg" id="message-input" onChange={props.onChange} />
    </div>
  )
}
'use client'

export default function MessageForm() {
  let message : string = ''

  function changeMessage() {
    const messageInput : HTMLInputElement | null = document.getElementById("message-input") as HTMLInputElement

    if (messageInput !== null) {
      message = messageInput.value.trim()
    }
  }

  return (
    <div className="py-1" id="message">
      <label htmlFor="message-input">Message Content: </label>
      <input className="ring-1 ring-gray-950 focus:ring-4 ring-gray-950" id="message-input" type="text" onChange={changeMessage} />
    </div>
  )
}
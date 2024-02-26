'use client'

import Image from "next/image"
import NameForm from './ChatNameForm.tsx'
import MessageForm from './ChatMessageForm.tsx'

export default function Home() {
  // TODO: set up the websocket as some sort of React Hook so other React Components can use it
  // potentially using useRef?

  // websocket connections
  const ws = new WebSocket("ws://localhost:8080")
  ws.addEventListener("open", () => {
      console.log("Connected to websocket server.")
  })

  ws.addEventListener("message", (e : MessageEvent) => {
      const message : {message : string, user : string} = JSON.parse(e.data)
      console.log(`Message received from server: ${message.message}`)

      const messageTextbox : HTMLElement | null = document.getElementById("message-box")

      if (messageTextbox !== null) {
        messageTextbox.innerHTML = `${message.user}: ${message.message}`
      }
  })

  // name management
  let name : string = ''
  let message : string = ''

  function sendMessage() {
    ws.send(JSON.stringify({
      "user": name === '' ? "Unnamed User" : name,
      "message": message === '' ? "No message content." : message
    }))
  }

  return (
    <div id="content">
      <h1 className="bg-blue-500 text-3xl">Collaboration Board</h1>
      <NameForm />
      <MessageForm />
      <button onClick={sendMessage}>Send Message</button>
      <br />
      <p id="message-box">No message received yet.</p>
    </div>
  )
}
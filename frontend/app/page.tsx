'use client'

import Image from "next/image"
import NameForm from './ChatNameForm.tsx'
import MessageForm from './ChatMessageForm.tsx'
import { useState } from 'react'

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
  const [name, setName] = useState("")

  function handleNameChange() {
    const nameInput : HTMLInputElement | null = document.getElementById("name-input") as HTMLInputElement

    if (nameInput !== null) {
      setName(nameInput.value.trim())
    }
  }

  const [message, setMessage] = useState("")

  function handleMessageChange() {
    const messageInput : HTMLInputElement | null = document.getElementById("message-input") as HTMLInputElement

    if (messageInput !== null) {
      setMessage(messageInput.value.trim())
    }
  }

  function sendMessage() {
    ws.send(JSON.stringify({
      "user": name === '' ? "Unnamed User" : name,
      "message": message === '' ? "No message content." : message
    }))
  }

  return (
    <div id="content">
      <h1 className="bg-blue-500 text-3xl">Collaboration Board</h1>
      <NameForm 
        value={name} 
        onChange={handleNameChange} 
      />
      <MessageForm 
        value={message} 
        onChange={handleMessageChange} 
      />
      <button className="mx-2 ring-2 ring-gray-950" onClick={sendMessage}>Send Message</button>
      <br />
      <p id="message-box">No message received yet.</p>
    </div>
  )
}
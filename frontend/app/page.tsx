'use client'

import Image from "next/image"
import NameForm from './ChatNameForm.tsx'
import MessageForm from './ChatMessageForm.tsx'
import ConversationForm from './ChatConversationForm.tsx'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  // set up the websocket as some sort of React Hook so other React Components can use it
  // TODO: determine if this type casting will cause problems when using useRef
  const ws = useRef(null as unknown as WebSocket)

  // websocket connections
  useEffect(() => {
    // if doing a demo for multiple machines, switch this to an IP address
    const socket = new WebSocket("ws://localhost:8080")
    socket.addEventListener("open", () => {
        console.log("Connected to websocket server.")
    })

    socket.addEventListener("message", (e : MessageEvent) => {
        const message : {ws_msg_type : string, message ?: string, user : string, conversation ?: string, typing ?: boolean} = JSON.parse(e.data)
        
        if (message.ws_msg_type === 'chat message') {
          console.log(`Message received from server: ${message.message}`)

          const messageTextbox : HTMLElement | null = document.getElementById("message-box")

          if (messageTextbox !== null) {
            messageTextbox.innerHTML = `${message.user}: ${message.message}`
          }
        }
        else if (message.ws_msg_type === 'user typing') {
          if (message.typing) {
            console.log(`Received from server that ${message.user} is typing.`)
          }
          else {
            console.log(`Received from server that ${message.user} is no longer typing.`)
          }
        }
    })

    ws.current = socket

    return () => socket.close()
  }, [])

  // name hook
  const [name, setName] = useState("")

  function handleNameChange() {
    const nameInput : HTMLInputElement | null = document.getElementById("name-input") as HTMLInputElement

    if (nameInput !== null) {
      setName(nameInput.value.trim())
    }
  }

  // message hook
  const [message, setMessage] = useState("")

  function handleMessageChange() {
    const messageInput : HTMLInputElement | null = document.getElementById("message-input") as HTMLInputElement

    if (messageInput !== null) {
      setMessage(messageInput.value.trim())
    }

    showTyping()
  }

  // conversation hook
  const [conversation, setConversation] = useState("")

  function handleConversationChange() {
    const conversationInput : HTMLInputElement | null = document.getElementById("conversation-input") as HTMLInputElement

    if (conversationInput !== null) {
      setConversation(conversationInput.value.trim())
    }
  }

  function sendMessage() {
    ws.current.send(JSON.stringify({
      "ws_msg_type": "chat message",
      "user": name === "" ? "Unnamed User" : name,
      "message": message === "" ? "No message content." : message,
      "conversation": conversation === "" ? "default" : conversation
    }))
  }

  function showTyping() {
    ws.current.send(JSON.stringify({
      "ws_msg_type": "user typing",
      "user": name === "" ? "Unnamed User" : name
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
      <ConversationForm 
        value={conversation} 
        onChange={handleConversationChange} 
      />
      <button className="mx-2 ring-2 ring-gray-950" onClick={sendMessage}>Send Message</button>
      <br />
      <p id="message-box">No message received yet.</p>
    </div>
  )
}
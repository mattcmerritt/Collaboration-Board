'use client'

import Image from "next/image"
import NameForm from './ChatNameForm.tsx'
import MessageForm from './ChatMessageForm.tsx'
import ConversationForm from './ChatConversationForm.tsx'
import ChatLogEntry from "./ChatLogEntry.tsx"
import { useState } from 'react'

export default function Home() {
  // TODO: set up the websocket as some sort of React Hook so other React Components can use it
  // potentially using useRef?

  // websocket connections
  // if doing a demo for multiple machines, switch this to an IP address
  const ws = new WebSocket("ws://localhost:8080")
  ws.addEventListener("open", () => {
      console.log("Connected to websocket server.")
  })

  const usersTyping : string[] = []
  ws.addEventListener("message", (e : MessageEvent) => {
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
          usersTyping.push(message.user)
        }
        else {
          console.log(`Received from server that ${message.user} is no longer typing.`)
          if(usersTyping.indexOf(message.user) < 0) {
            usersTyping.splice(usersTyping.indexOf(message.user), 1)
          }
        }
      }
  })

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
    ws.send(JSON.stringify({
      "ws_msg_type": "chat message",
      "user": name === "" ? "Unnamed User" : name,
      "message": message === "" ? "No message content." : message,
      "conversation": conversation === "" ? "default" : conversation
    }))
  }

  function showTyping() {
    ws.send(JSON.stringify({
      "ws_msg_type": "user typing",
      "user": name === "" ? "Unnamed User" : name
    }))
  }

  type ChatLogEntry = {
    username : string,
    message : string,
    conversation : string,
    time_sent : string
  }

  function generateLogs() {
    // TODO: get entries from database
    // const entries : ChatLogEntry[] = []
    // TODO: remove this example entries list and uncomment line above
    const entries : ChatLogEntry[] = [
      {
        "username" : "Mike",
        "message" : "hi",
        "conversation" : "debug",
        "time_sent" : "first"
      },
      {
        "username" : "Mike",
        "message" : "bye",
        "conversation" : "debug",
        "time_sent" : "second"
      },
    ]
    const entryComponents : JSX.Element[] = []

    entries.forEach(entry => {
      entryComponents.push(
        <ChatLogEntry
          key = {entry.conversation + entry.username + entry.time_sent}
          username = {entry.username}
          message = {entry.message}
          conversation = {entry.conversation}
        />
      )
    });

    return entryComponents
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
      {usersTyping.length !== 0 
        ? 
        <div id="typing-indicator">
          {usersTyping.length == 1 
            ? "{usersTyping[0]} is typing..." 
            : usersTyping.slice(0, usersTyping.length-1).join(", ") + ", and " + usersTyping[usersTyping.length-1] + " are typing..."
          }
        </div>
        :
        <></>
      }
      <button className="mx-2 ring-2 ring-gray-950" onClick={sendMessage}>Send Message</button>
      <br />
      <p id="message-box">No message received yet.</p>
      {generateLogs()} 
    </div>
  )
}
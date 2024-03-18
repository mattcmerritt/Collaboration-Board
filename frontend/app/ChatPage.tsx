'use client'

import Image from "next/image"
import NameForm from './ChatNameForm.tsx'
import MessageForm from './ChatMessageForm.tsx'
import ConversationForm from './ChatConversationForm.tsx'
import ChatLogEntry from "./ChatLogEntry.tsx"
import { useState, useEffect, useRef } from 'react'

export default function ChatPage() {
  // type for loading chat entries from database
  type ChatLogEntry = {
    username : string,
    message : string,
    conversation : string,
    time_sent : string
  }

  // set up hook for message history
  const [history, setHistory] = useState(null as unknown as ChatLogEntry[] | undefined)

  // set up the websocket as some sort of React Hook so other React Components can use it
  // TODO: determine if this type casting will cause problems when using useRef
  const ws = useRef(null as unknown as WebSocket)

  // set up hook for users typing
  const [usersTyping, setUsersTyping] = useState([] as string[] | undefined)

  // websocket connections
  useEffect(() => {
    // if doing a demo for multiple machines, switch this to an IP address
    const socket = new WebSocket("ws://localhost:8080")
    socket.addEventListener("open", () => {
        console.log("Connected to websocket server.")
    })

    socket.addEventListener("message", (e : MessageEvent) => {
        const message : {ws_msg_type : string, message ?: string, user ?: string, conversation ?: string, typing ?: boolean, messages ?: ChatLogEntry[], users ?: string[]} = JSON.parse(e.data)
        
        if (message.ws_msg_type === 'chat message') {
          console.log(`Message received from server: ${message.message}`)

          const messageTextbox : HTMLElement | null = document.getElementById("message-box")

          if (messageTextbox !== null) {
            messageTextbox.innerHTML = `${message.user}: ${message.message}`
          }
        }
        else if (message.ws_msg_type === 'user typing') {
          setUsersTyping(message.users)
        }
        else if (message.ws_msg_type === 'chat history') {
          setHistory(message.messages)
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
      // get new conversation logs
      ws.current.send(JSON.stringify({
        'ws_msg_type': 'chat history',
        'conversation': conversationInput.value.trim() === '' ? 'default' : conversationInput.value.trim()
      }))
    }
  }

  function sendMessage() {
    ws.current.send(JSON.stringify({
      "ws_msg_type": "chat message",
      "user": name === "" ? "Unnamed User" : name,
      "message": message === "" ? "No message content." : message,
      "conversation": conversation === "" ? "default" : conversation
    }))

    // get new conversation logs
    ws.current.send(JSON.stringify({
      'ws_msg_type': 'chat history',
      'conversation': conversation === "" ? "default" : conversation
    }))
  }

  function showTyping() {
    ws.current.send(JSON.stringify({
      "ws_msg_type": "user typing",
      "user": name === "" ? "Unnamed User" : name
    }))
  }

  function generateLogs() {
    // TODO: get entries from database
    // const entries : ChatLogEntry[] = []
    // TODO: remove this example entries list and uncomment line above
    const entryComponents : JSX.Element[] = []

    const entries : ChatLogEntry[] | undefined = history;

    if (entries) {
      entries.forEach(entry => {
        entryComponents.push(
          <ChatLogEntry
            key = {entry.conversation + entry.username + entry.time_sent}
            username = {entry.username}
            message = {entry.message}
            conversation = {entry.conversation}
          />
        )
      })
    }
    
    return entryComponents
  }

  function showTypingUsers() {
    const entryComponents : JSX.Element[] = []
    if (usersTyping) {
      if (usersTyping.length == 1) {
        entryComponents.push(<p id="typing-indicator">{usersTyping[0] + " is typing..."}</p>)
      }
      else if (usersTyping.length > 1) {
        entryComponents.push(<p id="typing-indicator">{usersTyping.slice(0, usersTyping.length-1).join(", ") + ", and " + usersTyping[usersTyping.length-1] + " are typing..."}</p>)
      }
    }
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
      <button className="mx-2 ring-2 ring-gray-950" onClick={sendMessage}>Send Message</button>
      {/* <p id="message-box">No message received yet.</p> */}
      {generateLogs()} 
      <br/>
      {showTypingUsers()}
    </div>
  )
}
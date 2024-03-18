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

  // type for loading users
  type UserDetails = {
    name: string,
    conversation: string
  }

  // react state hooks
  const [history, setHistory] = useState([] as ChatLogEntry[] | undefined)
  const [usersTyping, setUsersTyping] = useState([] as string[] | undefined)
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")

  // react state refs (should not rerender)
  const conversationRef = useRef('default')

  // set up the websocket as some sort of React Hook and Effect so other React Components can use it
  const ws = useRef(null as unknown as WebSocket)
  useEffect(() => {
    // if doing a demo for multiple machines, switch this to an IP address
    const socket = new WebSocket("ws://localhost:8080")
    socket.addEventListener("open", () => {
      console.log("Connected to websocket server.")
    })

    socket.addEventListener("message", (e : MessageEvent) => {
      // parsing all the possible elements from the message data
      const message : {
        ws_msg_type : string, 
        message ?: string, 
        user ?: string, 
        conversation ?: string,
        timestamp ?: string,
        typing ?: boolean, 
        messages ?: ChatLogEntry[], 
        users ?: UserDetails[]
      } = JSON.parse(e.data)
      
      // if a message is received, add it to the message history
      if (message.ws_msg_type === 'chat message') {
        // need to check if the conversation is the active one before adding the message
        if (conversationRef.current == message.conversation) {
          setHistory(h => h?.concat({
            username: message.user,
            message: message.message,
            conversation: message.conversation,
            time_sent: message.timestamp
          } as ChatLogEntry))
        }
      }
      // if a user is typing, add them to the list of typing users
      else if (message.ws_msg_type === 'user typing') {
        // filter out users not typing in the current conversation
        const usersInConversation = message.users?.filter((user : UserDetails) => user.conversation === conversationRef.current)
        setUsersTyping(usersInConversation?.map((user : UserDetails) => user.name))
      }
      // if a request to replace the chat history is received, discard and replace history
      else if (message.ws_msg_type === 'chat history') {
        setHistory(message.messages)
      }
    })

    ws.current = socket

    return () => socket.close()
  }, [])

  function handleNameChange() {
    const nameInput : HTMLInputElement | null = document.getElementById("name-input") as HTMLInputElement

    if (nameInput !== null) {
      setName(nameInput.value.trim())
    }
  }

  function handleMessageChange() {
    const messageInput : HTMLInputElement | null = document.getElementById("message-input") as HTMLInputElement

    if (messageInput !== null) {
      setMessage(messageInput.value.trim())
    }

    showTyping()
  }

  function handleConversationChange() {
    const conversationInput : HTMLInputElement | null = document.getElementById("conversation-input") as HTMLInputElement

    if (conversationInput !== null) {
      conversationRef.current = conversationInput.value.trim()
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
      "conversation": conversationRef.current === "" ? "default" : conversationRef.current
    }))
  }

  function showTyping() {
    ws.current.send(JSON.stringify({
      "ws_msg_type": "user typing",
      "user": name === "" ? "Unnamed User" : name,
      "conversation": conversationRef.current === "" ? "default" : conversationRef.current
    }))
  }

  function generateLogs() {
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
    if (usersTyping) {
      if (usersTyping.length == 1) {
        return <p id="typing-indicator">{usersTyping[0] + " is typing..."}</p>
      }
      else if (usersTyping.length == 2) {
        return <p id="typing-indicator">{usersTyping[0] + " and " + usersTyping[1] + " are typing..."}</p>
      }
      else if (usersTyping.length > 1) {
        return <p id="typing-indicator">{usersTyping.slice(0, usersTyping.length-1).join(", ") + ", and " + usersTyping[usersTyping.length-1] + " are typing..."}</p>
      }
    }
    return
  }

  return (
    <div id="content">
      <NameForm 
        value={name} 
        onChange={handleNameChange} 
      />
      <MessageForm 
        value={message} 
        onChange={handleMessageChange} 
      />
      <ConversationForm 
        value={conversationRef.current} 
        onChange={handleConversationChange} 
      />
      <button className="mx-2 ring-2 ring-gray-950" onClick={sendMessage}>Send Message</button>
      {generateLogs()} 
      <br/>
      {showTypingUsers()}
    </div>
  )
}
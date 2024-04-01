'use client'

import Image from "next/image"
import NameForm from './ChatNameForm.tsx'
import MessageForm from './ChatMessageForm.tsx'
import ConversationForm from './ChatConversationForm.tsx'
import ChatLogEntry from "./ChatLogEntry.tsx"
import { useState, useEffect, useRef, MutableRefObject } from 'react'

export default function ChatPage(props: { ws: WebSocket, conversation : any, onCardHide : any }) {
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

  const wsListenerConfiguredRef = useRef(false)
  const wsListenerRef = useRef(null as unknown as (this: WebSocket, ev: MessageEvent<any>) => any)

  useEffect(() => {
    // only add chat listeners if socket is prepared
    if (!props.ws) return

    // if reloading, remove existing listener and put on a new one with proper conversation
    if (!wsListenerConfiguredRef.current) {
      props.ws.removeEventListener("message", wsListenerRef.current)
      wsListenerConfiguredRef.current = false
    }
  
    // creating and attaching listener to websocket
    const messageListener : (this: WebSocket, ev: MessageEvent<any>) => any = (e : MessageEvent) => {
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
        if (props.conversation == message.conversation) {
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
        const usersInConversation = message.users?.filter((user : UserDetails) => user.conversation === props.conversation)
        setUsersTyping(usersInConversation?.map((user : UserDetails) => user.name))
      }
      // if a request to replace the chat history is received, discard and replace history
      else if (message.ws_msg_type === 'chat history') {
        setHistory(message.messages)
      }
    }
    props.ws.addEventListener("message", messageListener)

    // storing the listener for updates later
    wsListenerRef.current = messageListener
    wsListenerConfiguredRef.current = true

    // refresh history to reflect new conversation
    props.ws.send(JSON.stringify({
      'ws_msg_type': 'chat history',
      'conversation': props.conversation
    }))

  }, [props.ws, props.conversation])

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

  function sendMessage() {
    props.ws.send(JSON.stringify({
      "ws_msg_type": "chat message",
      "user": name === "" ? "Unnamed User" : name,
      "message": message === "" ? "No message content." : message,
      "conversation": props.conversation === "" ? "default" : props.conversation
    }))
  }

  function showTyping() {
    props.ws.send(JSON.stringify({
      "ws_msg_type": "user typing",
      "user": name === "" ? "Unnamed User" : name,
      "conversation": props.conversation === "" ? "default" : props.conversation
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
            identifier = {entry.conversation + entry.username + entry.time_sent}
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
    // <div id="chat-window" onClick={props.onCardHide}> // TODO: implement something similar to hide chat
    <div id="chat-window">
      <h1>Chat: {props.conversation}</h1>
      <NameForm 
        value={name} 
        onChange={handleNameChange} 
      />
      <MessageForm 
        value={message} 
        onChange={handleMessageChange} 
      />

      <button className="mx-2 ring-2 ring-gray-950" onClick={sendMessage}>Send Message</button>
      {generateLogs()} 
      <br/>
      {showTypingUsers()}
    </div>
  )
}
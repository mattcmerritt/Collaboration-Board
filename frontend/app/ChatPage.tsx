'use client'

import NameForm from './ChatNameForm.tsx'
import MessageForm from './ChatMessageForm.tsx'
import ChatLogEntry from "./ChatLogEntry.tsx"
import { useState, useEffect, useRef } from 'react'
import { ChatMessage, Card, Column, TypingUser } from "./Types.ts"

export default function ChatPage(props: { ws: WebSocket, conversation : any, activeCardName : any, onCardHide : any }) {
  // react state hooks
  const [history, setHistory] = useState([] as ChatMessage[] | undefined)
  const [usersTyping, setUsersTyping] = useState([] as string[] | undefined)
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")
  const [cardContent, setCardContent] = useState("")

  const wsListenerConfiguredRef = useRef(false)
  const wsListenerRef = useRef(null as unknown as (this: WebSocket, ev: MessageEvent<any>) => any)

  useEffect(() => {
    // only add chat listeners if socket is prepared
    if (!props.ws) return

    // if reloading, remove existing listener and put on a new one with proper conversation
    if (wsListenerConfiguredRef.current) {
      wsListenerConfiguredRef.current = false
      props.ws.removeEventListener("message", wsListenerRef.current)
    }
  
    // creating and attaching listener to websocket
    const messageListener : (this: WebSocket, ev: MessageEvent<any>) => any = (e : MessageEvent) => {
      // parsing all the possible elements from the message data
      const message : {
        messageType : string, 
        card? : Card
        column? : Column
        cards? : Card[]
        columns? : Column[]
        typingUsers? : TypingUser[]
        isTyping? : boolean
      } = JSON.parse(e.data)
      
      // if a message is received, add it to the message history
      if (message.messageType === 'update card chat') {
        // need to check if the conversation is the active one before adding the message
        if (props.conversation == message.card!.id) {
          setHistory(message.card!.chatLog)
        }
      }
      // if a card's content is updated, change the textbox
      else if (message.messageType === 'update card content') {
        // need to check if the conversation is the active card before changing anything
        if (props.conversation == message.card!.id) {
          setCardContent(message.card!.content)
        }
      }
      // if a user is typing, add them to the list of typing users
      else if (message.messageType === 'user typing') {
        // filter out users not typing in the current conversation
        const usersInConversation = message.typingUsers?.filter((user : TypingUser) => user.cardId === props.conversation)
        setUsersTyping(usersInConversation?.map((user : TypingUser) => user.userName))
      }
      // if a request to replace the chat history is received, discard and replace history
      else if (message.messageType === 'load card') {
        setHistory(message.card!.chatLog)
        setCardContent(message.card!.content)
      }
    }
    props.ws.addEventListener("message", messageListener)

    // storing the listener for updates later
    wsListenerRef.current = messageListener
    wsListenerConfiguredRef.current = true

    // refresh history to reflect new conversation and updated content
    props.ws.send(JSON.stringify({
      'messageType': 'load card',
      'cardId': props.conversation
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
      "messageType": "update card chat",
      "userName": name === "" ? "Unnamed User" : name,
      "message": message === "" ? "No message content." : message,
      "cardId": props.conversation
    }))
  }

  function showTyping() {
    props.ws.send(JSON.stringify({
      "messageType": "user typing",
      "userName": name === "" ? "Unnamed User" : name,
      "cardId": props.conversation
    }))
  }

  function updateCardContent(newContent : string) {
    props.ws.send(JSON.stringify({
      "messageType": "update card content",
      "cardId" : props.conversation,
      "cardContent": newContent
    }))
  }

  function generateLogs() {
    const entryComponents : JSX.Element[] = []
    const entries : ChatMessage[] | undefined = history;

    if (entries) {
      entries.forEach(entry => {
        entryComponents.push(
          <ChatLogEntry
            key = {props.conversation + entry.name + entry.message}
            identifier = {props.conversation + entry.name + entry.message}
            username = {entry.name}
            message = {entry.message}
            conversation = {props.conversation}
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
    <div id="chat-modal">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" id="chat-background" onClick={props.onCardHide}/>
      
      <div className="absolute inset-x-1/4 inset-y-0 z-10 p-5 bg-white rounded-lg overflow-y-auto" id="chat-window">
        <h1>{props.activeCardName}</h1>
        <br/>

        {/* content for cards should go here later, like checklists */}

        <h2 className="text-red-700">INTERNAL IDENTIFIER: Card #{props.conversation}</h2>
        <br />

        <h2 className="pb-2.5">Card Contents:</h2>
        <textarea className="w-full h-1/3 bg-gray-200 p-5 rounded-lg" onChange={(e) => updateCardContent(e.target.value)} value={cardContent}></textarea>

        <br />
        <br />

        <h2 className="text-red-700 pb-2.5">Chat Controls (TEMPORARY):</h2>
        <NameForm 
          value={name} 
          onChange={handleNameChange} 
        />
        <MessageForm 
          value={message} 
          onChange={handleMessageChange} 
        />
        <button className="mx-2 ring-2 ring-gray-950" onClick={sendMessage}>Send Message</button>
        {showTypingUsers()}
        
        <br/>
        <br/>
        <br/>
        
        <h2 className="pb-2.5">Chat Log:</h2>
        <div className="p-5 bg-gray-200 rounded-lg">
          {generateLogs().length > 0 ? generateLogs() : "Nothing to display yet."} 
        </div>
      </div>
    </div>
  )
}
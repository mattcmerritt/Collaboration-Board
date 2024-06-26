'use client'

import MessageForm from './ChatMessageForm.tsx'
import ChatLogEntry from "./ChatLogEntry.tsx"
import CheckListEntry from './CheckListEntry.tsx'
import { useState, useEffect, useRef } from 'react'
import { ChatMessage, Card, Column, TypingUser, ChecklistItem } from "./Types.ts"

export default function ChatPage(props: { ws: WebSocket, conversation : any, activeCardName : any, onCardHide : any, userName : any }) {
  // react state hooks
  const [history, setHistory] = useState([] as ChatMessage[] | undefined)
  const [usersTyping, setUsersTyping] = useState([] as string[] | undefined)
  const [message, setMessage] = useState("")
  const [cardContent, setCardContent] = useState("")
  const [cardTasks, setCardTasks] = useState([] as ChecklistItem[] | undefined)

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

          // play a sound
          var audio = new Audio('Beep.wav');
          audio.play();
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
      // if a task is added, add a new task entry to the list
      else if (message.messageType === 'add card task' || message.messageType === 'update card task') {
        if (props.conversation == message.card!.id) {
          setCardTasks(message.card!.checkList)
        }
      }
      // if a request to replace the chat history is received, discard and replace history
      else if (message.messageType === 'load card') {
        setHistory(message.card!.chatLog)
        setCardContent(message.card!.content)
        setCardTasks(message.card!.checkList)
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

  useEffect(() => {
    const chatWindow = document.getElementById('chat-message-scroll-window')
    chatWindow!.scrollTop = chatWindow!.scrollHeight;
  }, [history])

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
      "userName": props.userName,
      "message": message === "" ? "No message content." : message,
      "cardId": props.conversation
    }))

    // clear text window
    const messageInput : HTMLInputElement | null = document.getElementById("message-input") as HTMLInputElement

    if (messageInput !== null) {
      messageInput.value = ''
      setMessage('')
    }
  }

  function checkKeyPresses(e : React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      sendMessage()
    }
  }

  function showTyping() {
    props.ws.send(JSON.stringify({
      "messageType": "user typing",
      "userName": props.userName,
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

  function addTask() {
    props.ws.send(JSON.stringify({
      "messageType": "add card task",
      "cardId" : props.conversation,
    }))
  }

  function generateLogs() {
    const entryComponents : JSX.Element[] = []
    const entries : ChatMessage[] | undefined = history;

    if (entries) {
      entries.forEach(entry => {
        entryComponents.push(
          <ChatLogEntry
            key = {entry.timestamp + entry.name + entry.message}
            identifier = {props.conversation + entry.name + entry.message}
            username = {entry.name}
            message = {entry.message}
            timestamp = {(new Date(entry.timestamp)).toLocaleTimeString()}
          />
        )
      })
    }
    
    return entryComponents
  }

  function showTypingUsers() {
    if (usersTyping) {
      if (usersTyping.length == 1) {
        return <p id="typing-indicator" className="px-2">{usersTyping[0] + " is typing..."}</p>
      }
      else if (usersTyping.length == 2) {
        return <p id="typing-indicator" className="px-2">{usersTyping[0] + " and " + usersTyping[1] + " are typing..."}</p>
      }
      else if (usersTyping.length > 1) {
        return <p id="typing-indicator" className="px-2">{usersTyping.slice(0, usersTyping.length-1).join(", ") + ", and " + usersTyping[usersTyping.length-1] + " are typing..."}</p>
      }
      else
      {
        return <br id="typing-indicator" className="px-2"></br>
      }
    }
    return
  }

  function generateTaskList() {
    const entryComponents : JSX.Element[] = []
    const tasks : ChecklistItem[] | undefined = cardTasks;

    if (tasks) {
      let count = 0
      for (const task of tasks) {
        entryComponents.push(
          <CheckListEntry
            key = {count}
            ws = {props.ws}
            identifier = {`${count}`}
            completed = {task.completed}
            content = {task.content}
            index = {count}
            cardId = {props.conversation}
          />
        )
        count++
      }
    }
    
    return entryComponents
  }

  return (
    // <div id="chat-window" onClick={props.onCardHide}> // TODO: implement something similar to hide chat
    <div id="chat-modal">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" id="chat-background" onClick={props.onCardHide}/>
      
      <div className="absolute inset-x-1/4 inset-y-0 z-10 p-5 bg-white rounded-lg overflow-y-auto" id="chat-window">
        <h1>{props.activeCardName}</h1>
        <br/>

        <h2 className="text-red-700">INTERNAL IDENTIFIER: Card #{props.conversation}</h2>
        <br />

        <h2 className="pb-2.5">Card Contents:</h2>
        <textarea className="w-full h-1/3 bg-gray-200 p-5 rounded-lg" onChange={(e) => updateCardContent(e.target.value)} value={cardContent}></textarea>

        <br />
        <br />

        <h2 className="pb-2.5">Check List:</h2>
        <button className="p-5 py-1 bg-gray-300 rounded-lg" onClick={addTask}>Add Task</button>
        <br />
        <br />
        {generateTaskList()}

        <br />
        <br />

        <h2 className="pb-2.5">Chat:</h2>

        <div className="p-5 w-full h-1/2 overflow-auto bg-gray-200 rounded-lg" id="chat-message-scroll-window">
          {generateLogs().length > 0 ? generateLogs() : "Nothing to display yet."} 
        </div>
        {showTypingUsers()}

        <br/>
        <br/>

        <MessageForm 
          value={message} 
          onChange={handleMessageChange} 
          onKeyDown={checkKeyPresses}
        />
        <button className="p-5 py-1 bg-gray-300 rounded-lg" onClick={sendMessage}>Send Message</button>
        
        
        
      </div>
    </div>
  )
}
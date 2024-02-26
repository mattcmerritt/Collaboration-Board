'use client'

import Image from "next/image"

export default function Home() {
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
  let conversation : string = ''

  function changeName() {
    const nameInput : HTMLInputElement | null = document.getElementById("name-input") as HTMLInputElement

    if (nameInput !== null) {
      name = nameInput.value.trim()
    }
  }

  function changeMessage() {
    const messageInput : HTMLInputElement | null = document.getElementById("message-input") as HTMLInputElement

    if (messageInput !== null) {
      message = messageInput.value.trim()
    }
  }

  function changeConversation() {
    const conversationInput : HTMLInputElement | null = document.getElementById("conversation-input") as HTMLInputElement

    if (conversationInput !== null) {
      conversation = conversationInput.value.trim()
    }
  }

  function sendMessage() {
    ws.send(JSON.stringify({
      "user": name === '' ? "Unnamed User" : name,
      "message": message === '' ? "No message content." : message,
      "conversation": conversation === '' ? "default" : conversation
    }))
  }

  return (
    <div>
      <h1>Collaboration Board</h1>
      <label htmlFor="name-input">Name: </label>
      <input id="name-input" type="text" onChange={changeName} />
      <br />
      <label htmlFor="message-input">Message Content: </label>
      <input id="message-input" type="text" onChange={changeMessage} />
      <button onClick={sendMessage}>Send Message</button>
      <br />
      <label htmlFor="conversation-input">Current conversation: </label>
      <input id="conversation-input" type="text" onChange={changeConversation} />
      <br />
      <p id="message-box">No message received yet.</p>
    </div>
  )
}
'use client'

import Image from "next/image"

export default function Home() {
  // websocket connections
  // if doing a demo for multiple machines, switch this to an IP address
  const ws = new WebSocket("ws://localhost:8080")
  ws.addEventListener("open", () => {
      console.log("Connected to websocket server.")
  })

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
        }
        else {
          console.log(`Received from server that ${message.user} is no longer typing.`)
        }
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

    showTyping()
  }

  function changeConversation() {
    const conversationInput : HTMLInputElement | null = document.getElementById("conversation-input") as HTMLInputElement

    if (conversationInput !== null) {
      conversation = conversationInput.value.trim()
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
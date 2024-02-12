'use client'

import Image from "next/image"

export default function Home() {
  // websocket connections
  const ws = new WebSocket("ws://localhost:8080")
  ws.addEventListener("open", () => {
      console.log("Connected to websocket server.")
  })

  ws.addEventListener("message", (e : MessageEvent) => {
      const message : {message : string} = JSON.parse(e.data)
      console.log(`Message received from server: ${message.message}`)
  })

  // name management
  let name : string = ''
  let message : string = ''

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

  function sendMessage() {
    ws.send(JSON.stringify({
      "user": name === '' ? "Unnamed User" : name,
      "message": message === '' ? "No message content." : message
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
    </div>
  )
}
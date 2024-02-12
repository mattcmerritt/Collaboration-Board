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
  let name : string

  function changeName() {
    const nameInput : HTMLInputElement | null = document.getElementById("name-input") as HTMLInputElement

    if (nameInput !== null) {
      name = nameInput.value.trim()
    }
    
    ws.send(JSON.stringify({
        "user": name === '' ? "Unnamed User" : name,
        "message": "This is a test message."
    }))
  }

  return (
    <div>
      <h1>Collaboration Board</h1>
      <label htmlFor="name-input">Name: </label>
      <input id="name-input" type="text" onChange={changeName}></input>
    </div>
  )
}

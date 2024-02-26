'use client'

export default function NameForm() {
  let name : string = ''

  function changeName() {
    const nameInput : HTMLInputElement | null = document.getElementById("name-input") as HTMLInputElement

    if (nameInput !== null) {
      name = nameInput.value.trim()
    }
  }

  return (
    <div className="py-1" id="name">
      <label htmlFor="name-input">Name: </label>
      <input className="ring-1 ring-gray-950 focus:ring-4 ring-gray-950" id="name-input" type="text" onChange={changeName} />
      <br />
    </div>
  )
}
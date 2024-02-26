'use client'

export default function NameForm(props : { value : any, onChange : any }) {
  return (
    <div className="py-1" id="name">
      <label htmlFor="name-input">Name: </label>
      <input className="ring-1 ring-gray-950 focus:ring-4 ring-gray-950" id="name-input" type="text" onChange={props.onChange} />
      <br />
    </div>
  )
}
'use client'

export default function ChatLogEntry(props : { username : string, message : string, conversation : string }) {
  return (
    <div className="p-1" id="log-entry">
      <label htmlFor="conversation-input">({props.conversation}) {props.username}: {props.message} </label>
      <br />
    </div>
  )
}
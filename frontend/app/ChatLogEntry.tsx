'use client'

export default function ChatLogEntry(props : { identifier : string, username : string, message : string, timestamp : string }) {
  return (
    <div className="p-1" id={"log-entry-" + props.identifier}>
      <p className="break-words">({props.timestamp}) {props.username}: {props.message} </p>
    </div>
  )
}
'use client'

export default function ChatLogEntry(props : { identifier : string, username : string, message : string, conversation : string }) {
  return (
    <div className="p-1" id={"log-entry-" + props.identifier}>
      <p>({props.conversation}) {props.username}: {props.message} </p>
    </div>
  )
}
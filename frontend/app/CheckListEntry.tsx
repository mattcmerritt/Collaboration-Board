'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage, Card, Column, TypingUser, ChecklistItem } from "./Types.ts"

export default function CheckListEntry(props : { ws : WebSocket, identifier : string, completed : boolean, content : string, index : number, cardId : number }) {
    
    const [completed, setCompleted] = useState(props.completed)
    const [content, setContent] = useState(props.content) 

    useEffect(() => {
        props.ws.send(JSON.stringify({
            'messageType' : 'update card task',
            'cardId' : props.cardId,
            'taskIndex' : props.index,
            'taskContent' : content,
            'taskCompletion' : completed
        }))
    }, [props.ws, props.cardId, props.index, content, completed])
    
    return (
        <div className="p-1" id={"task-entry-" + props.identifier}>
            <input type="checkbox" id={`task-entry-box-${props.identifier}`} name={`task-entry-box-${props.identifier}`} checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
            <input className="w-full bg-gray-200 p-5 rounded-lg" type="text" id={`task-entry-label-${props.identifier}`} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
    )
}
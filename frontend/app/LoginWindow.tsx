'use client'

import { useState, useEffect, useRef } from 'react'

export default function LoginWindow(props : { setUserName : any, setUserNameSet : any }) {
    function setName(newName : string) {
        props.setUserName(newName)
    }

    function selectName() {
        props.setUserNameSet(true)
    }

    return (
        // <div id="chat-window" onClick={props.onCardHide}> // TODO: implement something similar to hide chat
        <div id="chat-modal">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75" id="name-select-background" />
            
            <div className="absolute inset-x-1/4 inset-y-1/4 z-10 p-5 bg-white rounded-lg" id="name-select-window">
                <label className="w-full" htmlFor="name-select-input">User Name:</label>
                <input className="w-full bg-gray-200 p-2.5 rounded-lg" type="text" id="name-select-input" onChange={(e) => setName(e.target.value)} />
                <br />
                <br />
                <button className="p-5 py-1 bg-gray-300 rounded-lg" onClick={() => selectName()}>Confirm User</button>
            </div>
        </div>
    )
}
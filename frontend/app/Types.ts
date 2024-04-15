type ChecklistItem = {
    content: string,
    completed: boolean
}

type ChatMessage = {
    name: string,
    message: string
}

type Card = {
    id: number,
    name: string,
    column: number,
    content: string,
    checkList: ChecklistItem[],
    chatLog: ChatMessage[]
}

type Column = {
    id : number
    name : string
}

type TypingUser = {
    userName : string
    cardId : number
}

export type {
    ChecklistItem,
    ChatMessage,
    Card,
    Column,
    TypingUser
};
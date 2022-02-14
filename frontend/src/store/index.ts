import { io } from 'socket.io-client'

import { PersistentStore } from './Store'

export enum InjectState {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
  EXPIRED = 'EXPIRED'
}

export interface Inject {
  id: string,
  name: string
  assignee: string
  response: string
  dueDate: string
  status: InjectState
}

export interface Room {
  id: string
  name: string
  injects: Inject[]
  timezone: string
}

interface State {
  rooms: Room[]
}

const state: State = {
  rooms: []
}

const socket = io('/')

socket.on('connect', () => {
  console.log('Websocket connected!')
  // Join all rooms we have joined previously
  for (const key of store.state.rooms) {
    socket.emit('joinRoom', key.id)
  }
})

const store = new PersistentStore(state, 'inject-manager')
export default store

socket.on('roomCreate', (room: Room) => {
  const index = store.state.rooms.findIndex(r => r.id === room.id)
  if (index === -1) {
    store.state.rooms.push(room)
  } else {
    store.state.rooms[index] = room
  }
})

socket.on('roomUpdate', (room: Room) => {
  const index = store.state.rooms.findIndex(r => r.id === room.id)
  if (index !== -1) {
    store.state.rooms[index] = {
      ...store.state.rooms[index],
      ...room
    }
  } else {
    console.warn(`Recieved event for unjoined room ${room.id}`)
  }
})

socket.on('injectUpdate', (room: string, inject: Inject) => {
  const roomIndex = store.state.rooms.findIndex(r => r.id === room)
  if (roomIndex !== -1) {
    const injectIndex = store.state.rooms[roomIndex].injects.findIndex(i => i.id === inject.id)
    if (injectIndex === -1) {
      store.state.rooms[roomIndex].injects.unshift(inject)
    } else {
      store.state.rooms[roomIndex].injects[injectIndex] = {
        ...store.state.rooms[roomIndex].injects[injectIndex],
        ...inject
      }
    }
  } else {
    console.warn(`Recieved event for unjoined room ${room}`)
  }
})

socket.on('injectDelete', (room: string, inject: string) => {
  const roomIndex = store.state.rooms.findIndex(r => r.id === room)
  if (roomIndex !== -1) {
    const injectIndex = store.state.rooms[roomIndex].injects.findIndex(i => i.id === inject)
    if (injectIndex !== -1) {
      store.state.rooms[roomIndex].injects.splice(injectIndex, 1)
    }
  } else {
    console.warn(`Recieved event for unjoined room ${room}`)
  }
})

// Join a new room
export const joinRoom = (id: string): void => {
  socket.emit('joinRoom', id)
}

export const updateRoom = (id: string, room: Partial<Room>): void => {
  socket.emit('updateRoom', {
    ...room,
    id
  })
}

export const createInject = (room: string, inject: Omit<Inject, 'id'>): void => {
  socket.emit('createInject', room, inject)
}

export const updateInject = (room: string, inject: Inject): void => {
  socket.emit('updateInject', room, inject)
}

export const deleteInject = (room: string, inject: string): void => {
  socket.emit('deleteInject', room, inject)
}

export const getRoom = (id: string): Room => {
  const index = store.state.rooms.findIndex(r => r.id === id)
  return store.state.rooms[index]
}

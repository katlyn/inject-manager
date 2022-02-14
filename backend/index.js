const cors = require('cors')
const express = require('express')
const http = require('http')
const { Server } = require("socket.io")
const Redis = require('ioredis')
const { v4: uuid } = require('uuid')

const app = express()
app.use(cors())
app.options('*', cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
})

const r = new Redis()

io.on('connection', (socket) => {
  console.log(socket.id, 'joined!')
  socket.on('joinRoom', async id => {
    if (id.includes(':') || id.includes('.')) {
      return
    }
    socket.join(id)
    const roomJSON = await r.get(`room:${id}`)
    let room = JSON.parse(roomJSON)
    if (room === null) {
      room = {
        id,
        name: id,
        timezone: 'America/Chicago'
      }
      await r.set(`room:${id}`, JSON.stringify(room))
    }
    const injectKeys = await r.lrange(`room:${id}.injects`, 0, -1)

    const injects = await Promise.all(injectKeys.map(k => r.get(`room:${id}.injects:${k}`)))
    room.injects = injects.map(JSON.parse)
    socket.emit('roomCreate', room)
  })

  socket.on('updateRoom', async (changes) => {
    const room = JSON.parse(await r.get(`room:${changes.id}`))
    if (room === null) {
      return
    }
    for (const key in room) {
      if (typeof room[key] === typeof changes[key]) {
        room[key] = changes[key]
      }
    }
    await r.set(`room:${room.id}`, JSON.stringify(room))
    io.to(room.id).emit('roomUpdate', changes)
  })

  socket.on('createInject', async (room, inject) => {
    const roomExists = await r.exists(`room:${room}`)
    if (!roomExists) {
      return
    }
    try {
      new Date(inject.dueDate)
    } catch {
      return
    }
    const id = uuid()
    const cleanInject = {
      id,
      name: inject.name.trim(),
      assignee: inject.assignee.trim(),
      response: inject.response.trim(),
      status: inject.status,
      dueDate: inject.dueDate
    }
    if (cleanInject.name === '') {
      cleanInject.name = 'Unnamed Inject'
    }
    await r.lpush(`room:${room}.injects`, id)
    await r.set(`room:${room}.injects:${id}`, JSON.stringify(cleanInject))
    io.to(room).emit('injectUpdate', room, cleanInject)
  })

  socket.on('updateInject', async (room, inject) => {
    const roomExists = await r.exists(`room:${room}`)
    if (!roomExists) {
      return
    }
    const injectExists = await r.exists(`room:${room}.injects:${inject.id}`)
    if (!injectExists) {
      return
    }
    try {
      new Date(inject.dueDate)
    } catch {
      return
    }
    const cleanInject = {
      id: inject.id,
      name: inject.name.trim(),
      assignee: inject.assignee.trim(),
      response: inject.response.trim(),
      status: inject.status,
      dueDate: inject.dueDate
    }
    if (cleanInject.name === '') {
      cleanInject.name = 'Unnamed Inject'
    }
    await r.set(`room:${room}.injects:${inject.id}`, JSON.stringify(cleanInject))
    io.to(room).emit('injectUpdate', room, cleanInject)
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})

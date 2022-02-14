import 'source-map-support'
import cors from 'cors'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { Prisma, PrismaClient } from '@prisma/client'

const app = express()
app.use(cors())
app.options('*', cors)

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST']
  }
})

const prisma = new PrismaClient()

const checkInterval = setInterval(async () => {
  const checkDate = new Date()
  const expired = await prisma.inject.findMany({
    where: {
      dueDate: {
        lt: checkDate
      },
      status: {
        notIn: ['EXPIRED', 'SUBMITTED']
      }
    }
  })
  const injectIds: string[] = []
  for (const inject of expired) {
    injectIds.push(inject.id)
    io.to(inject.roomId).emit('injectUpdate', inject.roomId, { id: inject.id, status: 'EXPIRED' })
  }
  await prisma.inject.updateMany({
    where: {
      id: {
        in: injectIds
      }
    },
    data: {
      status: 'EXPIRED'
    }
  })
  if (injectIds.length > 0) {
    console.log(`${injectIds.length} injects marked as expired.`)
  }
}, 5e3)

process.on('SIGTERM', () => {
  clearInterval(checkInterval)
  server.close()
  Object.values(io.sockets.sockets).forEach(s => s.disconnect(true))
  prisma.$disconnect()
})

io.on('connection', (socket) => {
  console.log(socket.id, 'joined!')
  socket.on('joinRoom', async id => {
    if (id.includes(':') || id.includes('.')) {
      return
    }
    socket.join(id)
    let room = await prisma.room.findUnique({ where: { id }, include: { injects: true } })
    if (room === null) {
      const toCreate: Prisma.RoomCreateInput = {
        id: id,
        name: id,
        timezone: 'America/Chicago'
      }
      room = await prisma.room.create({ data: toCreate, include: { injects: true } })
    }

    socket.emit('roomCreate', room)
  })

  socket.on('updateRoom', async (changes) => {
    try {
      const room = await prisma.room.update({
        where: { id: changes.id },
        data: changes
      })
      if (room === null) {
        return
      }
      io.to(room.id).emit('roomUpdate', changes)
    } catch (err) {
      console.log(err)
    }
  })

  socket.on('createInject', async (roomId, inject) => {
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (room === null) {
      return
    }
    try {
      new Date(inject.dueDate)
    } catch {
      return
    }
    const cleanInject: Prisma.InjectCreateInput = {
      name: inject.name.trim(),
      assignee: inject.assignee.trim(),
      response: inject.response.trim(),
      status: inject.status,
      dueDate: inject.dueDate,
      room: {
        connect: { id: roomId }
      }
    }
    if (cleanInject.name === '') {
      cleanInject.name = 'Unnamed Inject'
    }
    const savedInject = await prisma.inject.create({ data: cleanInject })
    io.to(roomId).emit('injectUpdate', roomId, savedInject)
  })

  socket.on('updateInject', async (roomId, injectUpdate) => {
    try {
      new Date(injectUpdate.dueDate)
    } catch {
      return
    }
    const cleanInject: Prisma.InjectUpdateInput = {
      id: injectUpdate.id,
      name: injectUpdate.name.trim(),
      assignee: injectUpdate.assignee.trim(),
      response: injectUpdate.response.trim(),
      status: injectUpdate.status,
      dueDate: new Date(injectUpdate.dueDate)
    }
    if (cleanInject.name === '') {
      cleanInject.name = 'Unnamed Inject'
    }
    try {
      const inject = await prisma.inject.update({ where: { id: injectUpdate.id }, data: cleanInject })
      io.to(roomId).emit('injectUpdate', roomId, inject)
    } catch (err) {
      console.error(err)
    }
  })
})

server.listen(80, () => {
  console.log('backend listening on *:80')
})

/**
 * @typedef {object} MeServerCorsOptions
 * @property {import('cors').CorsOptions} cors
 */
// import cors from 'cors'
import express from 'express'
import http from 'http'
import cors from 'cors'
import qrcode from 'qrcode-terminal'
import pkg from 'whatsapp-web.js'
import { Server as SocketServer } from 'socket.io'
import 'colors'
import morgan from 'morgan'
import { resolve } from 'path'
//
const { Client: ClientWsp, LocalAuth } = pkg
const app = express()
app.use(cors())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(resolve('frontend/dist')))
const port = 4000
const server = http.createServer(app)
// Creo una clase que hereda de ClientWsp para poder usar los eventos de la libreria
class MeClientWsp extends ClientWsp {
  constructor (
    options = {
      authStrategy: new LocalAuth()
    }
  ) {
    super({
      ...options
    })

    this.start()
    // importante para que se conecte
    this.initialize()
  }

  start () {
    this.on('qr', (qr) => {
      qrcode.generate(qr, { small: true })
    })

    this.on('authenticated', (session) => {
      console.log('AUTHENTICATED', session)
    })

    this.on('auth_failure', (msg) => {
      console.error('AUTHENTICATION FAILURE', msg)
    })

    this.on('ready', () => {
      console.log('READY')
    })
    // cuando se recibe un mensaje, pero se usa en el server
    /* this.on('message', (msg) => {
      console.log('MESSAGE RECEIVED', msg)
    }) */

    this.on('disconnected', (reason) => {
      console.log('Client was logged out', reason)
    })
  }
}
const bot = new MeClientWsp()
// Creo una clase que hereda de SocketServer para poder usar los eventos de la libreria
class MeSocketServer extends SocketServer {
  /**
   *
   * @param {*} meServer
   * @param {MeServerCorsOptions} meConfig
   */
  constructor (
    meServer = server,
    meConfig = { cors: { methods: ['GET', 'POST'] } }
  ) {
    super(meServer, meConfig)
    this.init()
  }

  init () {
    this.on('connection', (socket) => {
      console.log(socket.id)
      console.log('Socket conectado')
      // si quiero escuchar un evento desde el cliente
      socket.on('message', (msg) => {
        console.log(msg)
      })
      // si quiero enviar un evento al cliente, el mensaje se envia desde whatsapp
      bot.on('message', ({ body }) => {
        console.log(body)
        // para evitar escuchar todo se hace un filtro
        if (!body.startsWith('!')) return
        // socket.broadcast.emit -> es para enviar a todos menos al que envio el mensaje
        // socket.emit -> es para enviar a todos incluido el que envio el mensaje
        // envio el mensaje al cliente que se envio desde whatsapp
        socket.emit('message', body)
      })
    })
  }
};
// const io = new SocketServer(server)
// como es una clase, se debe instanciar pero no hace falta una variable
(() => new MeSocketServer())()

server.listen(port, () => {
  console.log(`El servidor se ejecuta en el puerto->${port}`.rainbow)
})

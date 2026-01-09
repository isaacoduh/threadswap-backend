import {io} from 'socket.io-client'

const token = process.env.TOKEN!
const socket = io('http://localhost:8080', {
    auth: {token}
})

socket.on('connect', () => console.log("connected", socket.id))
socket.on('ready', (msg) => console.log("ready", msg))
socket.on('pong', (msg) => console.log("pong", msg))
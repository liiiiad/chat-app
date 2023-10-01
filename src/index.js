const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,generateLocationMessage } = require ('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')
const port = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)


const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

app.get('', (req,res) => {
    res.render('index')
})

io.on('connection', (socket) => {

    console.log('new websocket connection!')

    
    socket.on('join', ({ username, room }, cb) => {

        const { error, user } = addUser({ id: socket.id , username, room })
        if (error){
            return cb(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chatroom!`))
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        cb()
    })

    socket.on('sendMessage', (userInput, cb) => {

        const user = getUser(socket.id)

        const filter = new Filter()
        
        filter.addWords('nave')

        if(filter.isProfane(userInput)) {
            return cb('profanity is not allowed') 
        } 

       io.to(user.room).emit('message', generateMessage(user.username, userInput))

       cb()
    })
    
    socket.on('sendLocation', (location, cb) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps/?q=${location.lat},${location.long}`))
        cb()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', user.username + ' has left the chat'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})
server.listen(port, () =>{
    console.log('Server is up on port ' + port)
})


// npm run dev --> to run the server : localhost 3000

const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);
 
// set static folder
app.use(express.static(path.join(__dirname, 'public'))); 

const botName = 'ChatCord Bot';

// run when client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // console.log('New WS connection...');          //--> tells us when someone joins on Terminal

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));             // --> this emits to just single user who connects.

        // Broadcast when a user connects ---> it notifies all other users when someone connects except the one who connect.
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // io.emit();               // ---> used to emit to everybody. 


        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {

        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client Disconnects
    socket.on('disconnect', () => { 
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        }

        // Send users and room info --> after they disconnect
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log('Server running on port ' + PORT));    // -- > OR can use --> `-------port ${PORT}`   ('`' --> back ticks)


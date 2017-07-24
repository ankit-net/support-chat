exports = module.exports = function(io) {  
  // Set socket.io listeners.
  io.on('connection', (socket) => {
    //console.log('a user connected');

    // On conversation entry, join broadcast channel
    socket.on('enter conversation', (data) => {
      socket.join(data.conversationId);
      console.log(data.userId + ' joined ' + data.conversationId);
    });

    socket.on('leave conversation', (conversation) => {
      socket.leave(conversation);
      // console.log('left ' + conversation);
    })

    socket.on('new message', (conversation) => {
      console.log('new message received in ' + conversation);
      io.sockets.in(conversation).emit('refresh messages', conversation);
    });

    // socket.emit('news', { hello: 'world' });
    // socket.on('my other event', function (data) {
    //   console.log(data);
    // });

    socket.on('disconnect', () => {
      //console.log('user disconnected');
    });
  });
}
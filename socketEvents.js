const chatController = require('./controllers/chat'),
    authController = require('./controllers/authentication'),
    Message = require('./models/message'),
    User = require('./models/user');


exports = module.exports = function(io) {  
  // Set socket.io listeners.
  io.on('connection', (socket) => {
    //console.log('a user connected');

    socket.on('enter conversation', (data) => {
      socket.join(data.conversationId);
      console.log('SOCKET =====> ' + data.userId + ' joined ' + data.conversationId);
    });

    socket.on('leave conversation', (conversation) => {
      socket.leave(conversation);
      // console.log('left ' + conversation);
    })

    // conversationId: self.currentConversationId(),
    // body: self.messageToSend(),
    // senderId: $('#userId').val(),
    // senderName: '',
    // senderType: 'Operator'

    socket.on('new message', (conversation) => {
      console.log('SOCKET =====> new message received is ' + conversation);
      var currentDateTime = new Date().toISOString();
      conversation['sentAt'] = currentDateTime;
      chatController.sendReplyToConversation1(conversation.conversationId, conversation.senderId, conversation.senderType, conversation.body, currentDateTime, function(success, data){
        console.log('SOCKET =====> message saved to database. Details are : ' + data);        
      });
      io.sockets.in(conversation.conversationId).emit('receive message', conversation);
    });

    socket.on('disconnect', () => {
      //console.log('user disconnected');
    });
  });
}
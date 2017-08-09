const chatController = require('./controllers/chat'),
    authController = require('./controllers/authentication'),
    Message = require('./models/message'),
    User = require('./models/user');


exports = module.exports = function(io) {  
  // Set socket.io listeners.
  io.on('connection', (socket) => {
    //console.log('a user connected');

    socket.on('joined conversation', (data) => {
      socket.join(data.conversationId);
      console.log('SOCKET JOIN CONVERSATION =====> ' + data.userId + ' joined ' + data.conversationId);
    });

    socket.on('operator joined', (data) => {
      socket.join('operators');
      console.log('SOCKET OPERATOR JOINED =====> ' + data.userId);
    });

    socket.on('left conversation', (conversationId) => {
      socket.leave(conversationId);
      // console.log('left ' + conversation);
    })

    // conversationId: self.currentConversationId(),
    // body: self.messageToSend(),
    // senderId: $('#userId').val(),
    // senderName: '',
    // senderType: 'Operator'

    socket.on('new message', (conversation) => {
      console.log('SOCKET NEW MESSAGE =====> new message received is ' + conversation);
      var currentDateTime = new Date().toISOString();
      conversation['sentAt'] = currentDateTime;
      chatController.sendReplyToConversation1(conversation.conversationId, 
                                              conversation.senderId, 
                                              conversation.senderType, 
                                              conversation.body, 
                                              currentDateTime, 
                                              function(success, conversationFromOpenToOngoing, conversationId, data){
        console.log('SOCKET NEW MESSAGE =====> message saved to database. Details are : ' + data);
        if(conversationFromOpenToOngoing){
          io.sockets.in('operators').emit('operator claimed conversation', {conversationId: conversationId, userId: req.user._id});
        }
      });
      io.sockets.in(conversation.conversationId).emit('receive message', conversation);
    });

    socket.on('disconnect', () => {
      //console.log('user disconnected');
    });
  });
}
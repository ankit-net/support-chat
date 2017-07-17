const Conversation = require('../models/conversation'),
    Message = require('../models/message'),
    User = require('../models/user');

exports.getConversations = function(req, res, next){
    Conversation.find({participants: req.user._id})
        .select('_id')
        .exec(function(err, conversations){
            if(err){
                res.send({error: err});
                return next(err);
            }
            if(conversations.length === 0){
                return res.status(200).json({
                    conversations: []
                });
            }

            let fullConversations = [];
            conversations.forEach(function(conversation){
                Message.find({'conversationId': conversation._id})
                    .sort('-createdAt')
                    .limit(1)
                    .populate({
                        path: "author",
                        select: "profile.firstName profile.lastName"
                    })
                    .exec(function(err, message){
                        if(err){
                            res.send({error: err});
                            return next(err);
                        }
                        fullConversations.push(message);
                        if(fullConversations.length === conversations.length){
                            return res.status(200).json({
                                conversations: fullConversations
                            });
                        }
                    });
            });
        });
};

exports.getConversation = function(req, res, next){
    Message.find({conversationId: req.params.conversationId})
        .select('createdAt body author')
        .sort('-createdAt')
        .populate({
            path: 'author',
            select: 'profile.firstName profile.lastName'
        })
        .exec(function(err, messages){
            if(err){
                res.send({error: err});
                return next(err);
            }
            res.status(200).json({conversation: messages});
        });
};

exports.newConversation = function(req, res, next){
    if(!req.params.recipient){
        res.status(422).send({error: 'Please choose a valid recipient for your conversation.'});
        return next();
    }

    if(!req.body.composedMessage){
        res.status(422).send({error: 'Please enter a message.'});
        return next();
    }

    const conversation = new Conversation({
        participants: [req.user._id, req.params.recipient]
    });

    conversation.save(function(err, newConversation){
        if(err){
            res.send({error: err});
            return next(err);
        }
        const message = new Message({
            conversationId: newConversation._id,
            body: req.body.composedMessage,
            author: req.user._id
        });

        message.save(function(err, newMessage){
            if(err){
                res.send({error: err});
                return next(err);
            }
            res.status(200).json({message: 'Conversation started!', conversationId: conversation._id});
        });
    });
};

exports.sendReply = function(req, res, next) {  
  const reply = new Message({
    conversationId: req.params.conversationId,
    body: req.body.composedMessage,
    author: req.user._id
  });

  reply.save(function(err, sentReply) {
    if (err) {
      res.send({ error: err });
      return next(err);
    }

    res.status(200).json({ message: 'Reply successfully sent!' });
    return(next);
  });
};

// DELETE Route to Delete Conversation
exports.deleteConversation = function(req, res, next) {  
  Conversation.findOneAndRemove({
    $and : [
            { '_id': req.params.conversationId }, { 'participants': req.user._id }
           ]}, function(err) {
        if (err) {
          res.send({ error: err });
          return next(err);
        }

        res.status(200).json({ message: 'Conversation removed!' });
        return next();
  });
}

// PUT Route to Update Message
exports.updateMessage = function(req, res, next) {  
  Conversation.find({
    $and : [
            { '_id': req.params.messageId }, { 'author': req.user._id }
          ]}, function(err, message) {
        if (err) {
          res.send({ error: err});
          return next(err);
        }

        message.body = req.body.composedMessage;

        message.save(function (err, updatedMessage) {
          if (err) {
            res.send({ error: err });
            return next(err);
          }

          res.status(200).json({ message: 'Message updated!' });
          return next();
        });
  });
}
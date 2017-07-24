const Conversation = require('../models/conversation'),
    Message = require('../models/message'),
    User = require('../models/user'),
    Customer = require('../models/customer'),
    waterfall = require('async-waterfall');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

//working
exports.getConversations = function(req, res, next){
    // //remember to check for authenticated user before this
    // //find all conversations for the user
    Conversation.find({$or:[{$and:[{participant: req.user._id},{status:'ongoing'}]}, {status:'open'}]})
    .select('_id')
    .then(function(conversations){
        //if no conversations found
        if(conversations.length === 0){
            return res.status(200).json({
                conversations: []
            });
        }

        let fullConversationRes = [];
        conversations.forEach(function(conversation){
            fullConversationRes.push(
                Message.findOne({'conversation': conversation._id})
                .sort('-createdAt')
                .populate('author.item')
                .populate({
                    path: 'conversation',
                    populate: {path: 'customer'}
                })
            );
        });

        return Promise.all(fullConversationRes);
    }).then(function(listOfConversations) {
        res.status(200).json({conversations:listOfConversations});
    }, function(err) {
        res.status(501).send(err);
    });
};

//working
exports.getConversation = function(req, res, next){
    Message.find({conversation: req.params.conversationId})
        .select('createdAt body author conversation')
        .sort('-createdAt')
        .populate('author.item')
        .populate({
            path: 'conversation',
            populate: ('customer participant')
        })
        .exec(function(err, messages){
            if(err){
                res.status(501).send({error: err});
            }
            res.status(200).json({conversation: messages});
        });
};

//working
exports.sendReply = function(req, res, next) {  
    waterfall([
        function(done){
            Conversation.findOne({_id: req.params.conversationId}, function(err, conversation){
                if(err){
                    return done(err);
                }
                if(conversation && conversation.status === 'open'){
                    conversation.status = 'ongoing';
                    conversation.participant = req.user._id;
                    conversation.save(function(err, savedConversation){
                        if(err){
                            return done(err);
                        }
                        done(err, savedConversation);
                    });   
                }
                done(err, conversation);
            });
        },
        function(conversation, done){
            console.log(req.body);
            const reply = new Message({
                conversation: req.params.conversationId,
                body: req.body.composedMessage,
                author: {kind: 'User', item: req.user._id} 
            });
            reply.save(function(err, sentReply) {
                if (err) {
                    return done(err);
                }
                res.status(200).json({ message: 'Reply successfully sent!', reply: sentReply._id});
            });
        }
    ], function(err){
        console.log(err.toString);
        res.status(501).send({error: err});
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
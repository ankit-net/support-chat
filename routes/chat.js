var passport = require('passport');  
const chatController = require('../controllers/chat'),
    authController = require('../controllers/authentication'),
    Message = require('../models/message'),
    User = require('../models/user');

module.exports = function(io){
    var express = require('express');
    var chatRoutes = express.Router();

    chatRoutes.get('/', authController.userAuthenticated, function(req, res, next){
        chatController.getConversationsForOperator(req.user._id, function(success, data){
            if(success){
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });

    // Retrieve single conversation
    chatRoutes.get('/:conversationId', authController.userAuthenticated, function(req, res, next){
        chatController.getMessagesForConversation(req.params.conversationId, function(success, data){
            if(success){
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });

    // Send reply in conversation
    chatRoutes.post('/:conversationId', authController.userAuthenticated, function(req, res, next){
        chatController.sendReplyToConversation1(req.params.conversationId, 
                                                req.user._id, 
                                                req.body.senderType, 
                                                req.body.composedMessage, 
                                                new Date().toISOString(), 
                                                function(success, conversationFromOpenToOngoing, conversationId, data){
            if(success){
                if(conversationFromOpenToOngoing){
                    io.sockets.in('operators').emit('operator claimed conversation', {conversationId: conversationId, userId: req.user._id});
                }
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });

    return chatRoutes;
}
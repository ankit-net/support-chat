const customerController = require('../controllers/customer'),
    chatController = require('../controllers/chat');

module.exports = function(io){
    var express = require('express');
    var customerRoutes = express.Router();

    // customerRoutes.get('/', authController.userAuthenticated, chatController.getConversations);
    customerRoutes.post('/', function(req, res, next){
        customerController.createCustomerAndStartConversation(req.body.email, 
                                                            req.body.phone, 
                                                            req.body.firstName, 
                                                            req.body.lastName, 
                                                            function(success, isNewConversation, firstMessage, data){
            if(success){
                //send socket event
                if(isNewConversation){
                    io.sockets.in('operators').emit('new conversation', firstMessage);
                }
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });

    customerRoutes.get('/:conversationId', function(req, res, next){
        chatController.getMessagesForConversation(req.params.conversationId, function(success, data){
            if(success){
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });

    customerRoutes.post('/:conversationId', function(req, res, next){
        chatController.sendReplyToConversation1(req.params.conversationId, 
                                                req.body.customerId, 
                                                req.body.senderType, 
                                                req.body.composedMessage, 
                                                new Date().toISOString(), 
                                                function(success, conversationFromOpenToOngoing, conversationId, data){
            if(success){
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });

    customerRoutes.delete('/:conversationId', function(req, res, next){
        chatController.endConversation(req.params.conversationId,
                                        true,
                                        function(success, data){
            if(success){
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });

    return customerRoutes;
}
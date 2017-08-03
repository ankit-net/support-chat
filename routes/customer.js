var express = require('express');
const customerController = require('../controllers/customer'),
    chatController = require('../controllers/chat');

const customerRoutes = express.Router();

// customerRoutes.get('/', authController.userAuthenticated, chatController.getConversations);
customerRoutes.post('/', function(req, res, next){
    customerController.createCustomerAndStartConversation(req.body.email, 
                                                        req.body.phone, 
                                                        req.body.firstName, 
                                                        req.body.lastName, 
                                                        function(success, data){
        if(success){
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
    chatController.sendReplyToConversation1(req.params.conversationId, req.body.customerId, req.body.senderType, req.body.composedMessage, new Date().toISOString(), function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

module.exports = customerRoutes;
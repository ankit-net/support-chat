var express = require('express');
const preparedMessageController = require('../controllers/preparedMessage'),
        authController = require('../controllers/authentication'),
        preparedMessage = require('../models/preparedMessage');

var preparedMessageRoute = express.Router();

preparedMessageRoute.get('/', authController.userAuthenticated, function(req, res, next){
    preparedMessageController.getPreparedMessages(function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

preparedMessageRoute.post('/', authController.userAuthenticated, function(req, res, next){
    preparedMessageController.createPreparedMessage(req.body.messageBody, req.user._id, function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

preparedMessageRoute.delete('/:messageId', authController.userAuthenticated, function(req, res, next){
    preparedMessageController.deletePreparedMessage(function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

preparedMessageRoute.put('/:messageId/count', authController.userAuthenticated, function(req, res, next){
    preparedMessageController.updateUsageCounter(req.params.messageId, req.user._id, function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

preparedMessageRoute.put('/:messageId/body', authController.userAuthenticated, function(req, res, next){
    preparedMessageController.updateMessageBody(req.params.messageId, req.body.messageBody, req.user._id, function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

module.exports = preparedMessageRoute;
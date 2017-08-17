var express = require('express');
const preparedMessageController = require('../controllers/preparedMessage'),
        preparedMessage = require('../models/preparedMessage');

var preparedMessageRoute = express.Router();


preparedMessageRoute.get('/', function(req, res, next){
    preparedMessageController.getPreparedMessages(function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

preparedMessageRoute.post('/', function(req, res, next){
    preparedMessageController.createPreparedMessage(req.body.messageBody, req.body.userId, function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

preparedMessageRoute.delete('/:messageId', function(req, res, next){
    preparedMessageController.deletePreparedMessage(function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});

preparedMessageRoute.post('/:messageId', function(req, res, next){
    preparedMessageController.updateUsageCounter(function(success, data){
        if(success){
            res.status(200).json(data);
        }else{
            res.status(500).json(data);
        }
    });
});
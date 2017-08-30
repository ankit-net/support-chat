const User = require('../models/user'),
    PreparedMessage = require('../models/preparedMessage'),
    waterfall = require('async-waterfall');

exports.createPreparedMessage = function(messageBody, userId, callback){
    PreparedMessage.findOne({
        'body': messageBody
    }).exec()
    .then(function(message){
        if(!message){
            var preparedMessage = new PreparedMessage({
                createdBy: userId,
                body: messageBody,
                usageCounter: 0,
                isActive: true
            });
            return preparedMessage.save();
        }else{
            callback(false, {error: 'Message with same text already exists.'});
            return;
        }
    }).then(function(savedPreparedMessage){
        if(savedPreparedMessage){
            callback(true, {savedMessage: savedPreparedMessage});
        }
    }).catch(function(err){
        console.log('error');
        callback(false, {error: err});
    });
};

exports.getPreparedMessages = function(callback){
    PreparedMessage.find({
        'isActive': true
    })
    .sort('-usageCounter')
    .select('_id body createdBy usageCounter')
    .exec()
    .then(function(preparedMessages){
        callback(true, {messages: preparedMessages});
    })
    .catch(function(err){
        console.log('error');
        callback(false, {error: err});
    });
}

exports.deletePreparedMessage = function(messageId, userId, callback){
    PreparedMessage.findOne({ '_id': messageId })
    .exec()
    .then(function(message){
        message.lastUpdatedBy = userId;
        return message.save();
    })
    .then(function(message){
        callback(true, {message: message});
    })
    .catch(function(err){
        console.log('error');
        callback(false, {error: err});
    });
}

exports.updateUsageCounter = function(messageId, userId, callback){
    PreparedMessage.findOne({ '_id': messageId })
    .then(function(message){
        message.usageCounter += 1;
        message.lastUpdatedBy = userId;
        return message.save();
    })
    .then(function(message){
        callback(true, {message:'updated'});
    })
    .catch(function(err){
        console.log('error');
        callback(false, {error: err});
    });
}

exports.updateMessageBody = function(messageId, messageBody, userId, callback){
    PreparedMessage.findOne({ '_id': messageId })
    .then(function(message){
        message.body = messageBody;
        message.lastUpdatedBy = userId;
        return message.save();
    })
    .then(function(message){
        callback(true, {message:'updated'});
    })
    .catch(function(err){
        console.log('error');
        callback(false, {error: err});
    });
}
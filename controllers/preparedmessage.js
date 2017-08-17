const User = require('../models/user'),
    PreparedMessage = require('../models/preparedMessage'),
    waterfall = require('async-waterfall');

exports.createPreparedMessage = function(messageBody, userId, callback){
    var preparedMessage = new PreparedMessage({
        createdBy: userId,
        body: messageBody,
        usageCounter: 0,
        isActive: true
    });

    preparedMessage.save(function(err, savedPreparedMessage){
        if(err){
            callback(false, {error: err});
        }else{
            callback(true, {savedMessage: savedPreparedMessage});
        }
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

exports.updateUsageCounter = function(messageId, callback){
    PreparedMessage.findOne({ '_id': messageId })
    .then(function(message){
        message.usageCounter += 1;
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
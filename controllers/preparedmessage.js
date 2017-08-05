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

exports.deletePreparedMessage = function(messageId, callback){
    PreparedMessage.findOneAndRemove({ '_id': messageId }, function(err) {
        if (err) {
          callback(false, {error: err});
        }else{
            callback(true, {deleted: messageId});
        }
  });
}

exports.updateUsageCounter = function(messageId, callback){
    PreparedMessage.findOne({ '_id': messageId }, function(err, message){
        if(err){
            callback(false, {error: err});
        }else{
            //update usage counter and return
            callback(true, {message: message});
        }
    });
}
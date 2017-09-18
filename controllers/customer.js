const Customer = require('../models/customer'),
    Conversation = require('../models/conversation'),
    waterfall = require('async-waterfall'),
    Message = require('../models/message');


exports.StartConversation = function(customer, callback){
    var isNewConversation, fetchedConversation;
    Conversation.findOne({'customer': customer._id,
                        $or: [
                            {'status': 'open'},
                            {'status': 'ongoing'}
                        ]}).exec()
    .then(function(conversation){
        console.log(conversation);
        if(!conversation){
            const newConversation = new Conversation({
                customer: customer._id,
                status: 'open'
            });
            isNewConversation = true;
            return newConversation.save();    
        }else{
            isNewConversation = false;
            return conversation;
        }
    })
    .then(function(newConversation){
        console.log(newConversation);
        fetchedConversation = newConversation;
        
        if(isNewConversation){
            const reply = new Message({
                conversation: newConversation._id,
                body: 'Initiated',
                author: {kind: 'Customer', item: customer._id},
                sentAt: new Date().toISOString(),
                isSystemGenerated: true
            });
            return reply.save();    
        }else{
            return null;
        }
    })
    .then(function(message){
        console.log(message);
        if(isNewConversation){
            return Message.findOne({'_id': message._id})
            .select('_id createdAt body author conversation isSystemGenerated')
            .populate('author.item', 'profile email')
            .populate({
                path: 'conversation',
                select: 'customer _id status',
                populate: {path: 'customer', select:'profile'}
            }).exec();
        }else{
            return null;
        }
    })
    .then(function(message){
        console.log(message);
        callback(true, isNewConversation, message, {
            customerId: customer._id,
            conversationId: fetchedConversation._id
        });
    }).catch(function(err){
        console.log('error');
        callback(false, false, null, {error1: err});
    });
}

//email, phone, firstName, lastName,
exports.createCustomerAndStartConversation = function(email, phone, firstName, lastName, callback){
    var customer, isNewConversation, fetchedConversation;
    Customer.findOne({'email': email, 'phone': phone})
    .exec()
    .then(function(customer){
        console.log(customer);
        if(!customer){
            const newCustomer = new Customer({
                email: email,
                phone: phone,
                profile: {firstName: firstName, lastName: lastName}
            });
            return newCustomer.save();
        }else{
            return customer;
        }
    })
    .then(function(savedCustomer){
        console.log(savedCustomer);
        customer = savedCustomer;
        return Conversation.findOne({'customer': customer._id,
                $or: [
                    {'status': 'open'},
                    {'status': 'ongoing'}
                ]}).exec();
    })
    .then(function(conversation){
        console.log(conversation);
        if(!conversation){
            const newConversation = new Conversation({
                customer: customer._id,
                status: 'open'
            });
            isNewConversation = true;
            return newConversation.save();    
        }else{
            isNewConversation = false;
            return conversation;
        }
    })
    .then(function(newConversation){
        console.log(newConversation);
        fetchedConversation = newConversation;
        
        if(isNewConversation){
            const reply = new Message({
                conversation: newConversation._id,
                body: 'Initiated',
                author: {kind: 'Customer', item: customer._id},
                sentAt: new Date().toISOString(),
                isSystemGenerated: true
            });
            return reply.save();    
        }else{
            return null;
        }
    })
    .then(function(message){
        console.log(message);
        if(isNewConversation){
            return Message.findOne({'_id': message._id})
            .select('_id createdAt body author conversation isSystemGenerated')
            .populate('author.item', 'profile email')
            .populate({
                path: 'conversation',
                select: 'customer _id status',
                populate: {path: 'customer', select:'profile'}
            }).exec();
        }else{
            return null;
        }
    })
    .then(function(message){
        console.log(message);
        callback(true, isNewConversation, message, {
            customerId: customer._id,
            conversationId: fetchedConversation._id
        });
    }).catch(function(err){
        console.log('error');
        callback(false, false, null, {error1: err});
    });
};
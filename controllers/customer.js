const Customer = require('../models/customer'),
    Conversation = require('../models/conversation'),
    waterfall = require('async-waterfall'),
    Message = require('../models/message');


//email, phone, firstName, lastName,
exports.createCustomerAndStartConversation = function(email, phone, firstName, lastName, callback){
    var customer;
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
            return newConversation.save();    
        }else{
            return conversation;
        }
    })
    .then(function(newConversation){
        console.log(newConversation);
        callback(true, {
            customerId: customer._id,
            conversationId: newConversation._id
        });
    }).catch(function(err){
        console.log('error');
        callback(false, {error1: err});
    });
};
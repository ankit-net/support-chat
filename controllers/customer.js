const Customer = require('../models/customer'),
    Conversation = require('../models/conversation'),
    waterfall = require('async-waterfall'),
    Message = require('../models/message');

exports.createCustomerAndStartConversation = function(req, res, next){
    waterfall([
        function(done){
            Customer.findOne({'email': req.body.email, 
                            'phone': req.body.phone}, 
                            function(err, customer){
                if(err){
                    return done(err);
                }
                //if no customer, create one
                if(!customer){
                    const newCustomer = new Customer({
                        email: req.body.email,
                        phone: req.body.phone,
                        profile: {firstName: req.body.firstName, lastName: req.body.lastName}
                    });
                    newCustomer.save(function(err, savedCustomer){
                        if(err){
                            return done(err);
                        }
                        done(null, savedCustomer);
                    });
                }else{
                    done(null, customer);
                }
            });
        },
        function(customer, done){
            //after create customer or find customer, find open or ongoing conversations
            Conversation.findOne({'customer': customer._id,
                $or: [
                    {'status': 'open'},
                    {'status': 'ongoing'}
                ]}, function(err, conversation){
                    //if error
                    if(err){
                        return done(err);
                    }
                    //if conversation found
                    if(conversation){
                        return res.status(200).json({
                            customerId: customer._id,
                            conversationId: conversation._id
                        });
                    }
                    //if conversation not found, create an open conversation
                    const newConversation = new Conversation({
                        customer: customer._id,
                        status: 'open'
                    });
                    newConversation.save(function(err, newConversation){
                        if(err){
                            return done(err);
                        }
                        res.status(200).json({message: 'Conversation started!', customerId: customer._id, conversationId: newConversation._id});
                    });
                });
        }
    ], 
    function(err){
        res.status(501).send({error: err});
    });
};

exports.sendReply = function(req, res, next) {
    const reply = new Message({
        conversation: req.params.conversationId,
        body: req.body.composedMessage,
        author: {kind: 'Customer', item: req.body.customerId} 
    });
    reply.save(function(err, sentReply) {
        if (err) {
            res.status(501).send({error: err});
        }
        res.status(200).json({ message: 'Reply successfully sent!', reply: sentReply._id});
    });
};

exports.getMessagesForConversation = function(req, res, next){
    Message.find({conversation: req.params.conversationId})
        .select('createdAt body author conversation')
        .sort('createdAt')
        .populate('author.item')
        .populate({
            path: 'conversation',
            populate: {path: 'customer'}
        })
        .exec(function(err, messages){
            if(err){
                res.status(501).send({error: err});
            }
            res.status(200).json({conversation: messages});
        });
};
var express = require('express');
const customerController = require('../controllers/customer');

const customerRoutes = express.Router();

// customerRoutes.get('/', authController.userAuthenticated, chatController.getConversations);
customerRoutes.post('/', customerController.createCustomerAndStartConversation);

customerRoutes.get('/:conversationId', customerController.getMessagesForConversation);

customerRoutes.post('/:conversationId', customerController.sendReply);

module.exports = customerRoutes;
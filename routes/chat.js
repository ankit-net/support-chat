var express = require('express');  
var passport = require('passport');  
const chatController = require('../controllers/chat'),
    authController = require('../controllers/authentication');

const chatRoutes = express.Router();

chatRoutes.get('/', authController.userAuthenticated, chatController.getConversations);

// Retrieve single conversation
chatRoutes.get('/:conversationId', authController.userAuthenticated, chatController.getConversation);

// Send reply in conversation
chatRoutes.post('/:conversationId', authController.userAuthenticated, chatController.sendReply);

// Start new conversation
chatRoutes.post('/new/:recipient', authController.userAuthenticated, chatController.newConversation);

module.exports = chatRoutes;


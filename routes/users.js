var express = require('express');
var router = express.Router();
const UserController = require('../controllers/user');

/* GET users listing. */
router.post('/createOperator', UserController.createOperator);

module.exports = router;

var express = require('express');
var router = express.Router();
const UserController = require('../controllers/user'),
    AuthenticationController = require('../controllers/authentication');

router.post('/', 
            AuthenticationController.userAuthenticated, 
            // AuthenticationController.userAuthorized('admin'), 
            UserController.createOperator);

router.get('/',
            AuthenticationController.userAuthenticated, function(req, res, next){
                UserController.getOperators(req.user._id, function(success, data){
                    if(success){
                        res.status(200).json(data);
                    }else{
                        res.status(500).json(data);
                    }
                });
            });

module.exports = router;

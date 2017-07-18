const nodemailer = require('nodemailer'),
    sendOptions = {
        service: 'SendGrid',
        auth: {
            user: 'niraj.kumar.psq',
            pass: '*********'
        }
    };


exports.sendEmail = function(emailDetails, callback){
    var client = nodemailer.createTransport(sendOptions);

    client.sendMail(emailDetails, function(err, info){
        if (err ){
            console.log(error);
        }
        else {
            console.log('Message sent: ' + info.response);
        }
        callback(err, info);
    });
};

// var emailDetails = {
//     from: 'awesome@bar.com',
//     to: 'mr.walrus@foo.com',
//     subject: 'Hello',
//     text: 'Hello world',
//     html: '<b>Hello world</b>'
// };
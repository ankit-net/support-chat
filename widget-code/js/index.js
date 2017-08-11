$(document).ready(app());

function app(){
    var socket;
    var connected = false;
    const RETRY_INTERVAL = 10000;
    
    function ChatViewModel(){
        var self = this;
        self.customerId = ko.observable();
        self.conversationId = ko.observable();
        self.customerName = ko.observable();
        self.customerEmail = ko.observable();
        self.customerMobile = ko.observable();
        self.addCustomerInfo = function(){
            $.ajax('http://' + extractHostname(window.location.href) + ':3000/customer', {
                data: ko.toJSON({ email: self.customerEmail(), phone: self.customerMobile(), firstName: self.customerName(), lastName: ""}),
                type: "post", contentType: "application/json",
                success: function(result) {
                    console.log(result);
                    self.customerId(result.customerId);
                    self.conversationId(result.conversationId);
                    socket = io.connect('http://' + extractHostname(window.location.href) + ':3001', {
                        'reconnection': true,
                        'reconnectionDelay': 1000,
                        'reconnectionDelayMax' : 5000,
                        'reconnectionAttempts': 'Infinity'
                    });
                    initSocket(socket);
                    self.getMessages();
                }
            });
        }
        self.chatViewVisible = ko.computed(function(){
            return (self.customerId() === null || self.customerId() === undefined) && (self.conversationId() === null || self.conversationId() === undefined);
        });

        self.messagesList = ko.observableArray([]);
        self.getMessages = function(){
            $.ajax('http://' + extractHostname(window.location.href) + ':3000/customer/' + self.conversationId(), {
                type: "get", contentType: "application/json",
                success: function(result) {
                    result.conversation.forEach(function(conv){
                        var message = {
                            conversationId: conv.conversation._id,
                            body: conv.body,
                            senderId: conv.author.item._id,
                            senderName: conv.author.item.profile.firstName + conv.author.item.profile.lastName,
                            senderType: conv.author.kind,
                            sentAt: conv.sentAt
                        };
                        self.messagesList.push(message);
                    });
                }
            });
        }
        self.getClass = function(userType){
            return ko.computed(function(){
                if(userType === 'Customer')
                    return 'user-chat';
                return 'admin-chat';
            });
        }
        self.messageToSend = ko.observable();
        self.sendButtonHandler = function(){
            if($.trim($('.comment-box input').val()) && connected){
                console.log(self.conversationId());
                var message = {
                    conversationId: self.conversationId(),
                    body: self.messageToSend(),
                    senderId: self.customerId(),
                    senderName: self.customerName(),
                    senderType: 'Customer'
                };
                socket.emit('new message', message);
                self.messageToSend('');   
            }
        }
    }

    var chatVM = new ChatViewModel();
    ko.applyBindings(chatVM, document.getElementById('chat-box'));

    function initSocket(socket){
        socket.on('connect', function(){
            connected = true;
            console.log('connected');
            startChatOptions();
            socket.emit('joined conversation', {conversationId:chatVM.conversationId(), userId:chatVM.customerEmail(), senderType:'Customer'});
        });

        socket.on('disconnect', function(){
            connected = false;
            console.log('disconnected');
            stopChatOptions();
        });

        socket.on('receive message', function(conversation){
            console.log('received message : ' + conversation);
            chatVM.messagesList.push(conversation);
        });
    };
    
    function stopChatOptions(){
        $('.overlay').show();
        $('.comment-box input').attr('disabled', 'disabled');
    }
    
    function startChatOptions(){
        $('.overlay').hide();
        $('.comment-box input').removeAttr('disabled');
    }
    
    
    function extractHostname(url) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname
        if (url.indexOf("://") > -1) {
            hostname = url.split('/')[2];
        }
        else {
            hostname = url.split('/')[0];
        }
        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];
        return hostname;
    };
    
    function initApp(){
        $(".chat-icon").click(function(){
            $(".chat-body").slideToggle(500);    
        });

        $(".chat-start .chat-icon").click(function(){
            $(".show-hide-chat").slideToggle(500);    
        });

        //topgle chat setting
        $('.toogle-menu').click(function(){
          if ( $('.toogle-menu ul').css('visibility') == 'hidden' )
            $('.toogle-menu ul').css('visibility','visible');
          else
            $('.toogle-menu ul').css('visibility','hidden');
        });

         //send chat on email
        $(".end-chat").click(function(){
            $(".show-hide-chat .start-chat-body").hide(); 
            $(".show-hide-chat .send-chat").show(); 
        });

        //send chat email
        $(".send-chat .text-box .yes").click(function(){
            $(".send-chat .text-box").hide();
            $(".send-email").show();
        });

         //successful message
        $(".send-email input[type='submit']").click(function(){
            $(".send-email .success").show();
        });

        //hide chat
        $(".send-chat .text-box .no").click(function(){
            $(".chat-box-login").show();
            $(".chat-box-inner").hide();
        });
        
        $('.show-hide-chat').keyup(function(event){
            if(event.keyCode == 13){
                $(".comment-box a").click();
            }
        });
    };
    
    initApp();
};
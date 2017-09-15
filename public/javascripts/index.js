var socket = io.connect('http://localhost:3001', {
                        'reconnection': true,
                        'reconnectionDelay': 1000,
                        'reconnectionDelayMax' : 5000,
                        'reconnectionAttempts': 5
                    });
var connected = false;

ko.bindingHandlers.modal = {
    init: function (element, valueAccessor) {
        $(element).modal({
            show: false
        });
        
        var value = valueAccessor();
        if (typeof value === 'function') {
            $(element).on('hide.bs.modal', function() {
               value(false);
            });
        }
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
           $(element).modal("destroy");
        });
        
    },
    update: function (element, valueAccessor) {
        var value = valueAccessor();
        if (ko.utils.unwrapObservable(value)) {
            $(element).modal('show');
        } else {
            $(element).modal('hide');
        }
    }
};

function DashboardViewModel(){
    var self = this;
    
    //Main view Handlers
    self.views = ['Conversations', 'History', 'Operators', 'Prepared Messages'];
    self.chosenViewId = ko.observable();
    
    self.gotoView = function(view){
        console.log(view);
        self.chosenViewId(view);
        if(view == 'Conversations'){
            self.getConversations();
        }else if(view == 'History'){
            self.getHistory();
        }else if(view == 'Operators'){
            self.getOperators();
        }else if(view == 'Prepared Messages'){
        }
    };
    
    //Conversation Handlers
    self.conversationList = ko.observableArray([]);
    self.conversationList.push = trackPush(self.conversationList);
    self.currentConversationId = ko.observable();
    self.getConversations = function(){
        $.get('/chat')
        .done(function(data){
            self.conversationList(data.conversations);
            data.conversations.forEach(function(conv){
                socket.emit('joined conversation', {conversationId:conv.conversation._id, userId:$('#userEmail').val(), senderType:'Operator'});
            });
            
            if(!self.currentConversationId() && self.conversationList().length > 0){
                console.log('setting the current conversationId as the first conversation of the list');
                self.currentConversationId(self.conversationList()[0].conversation._id);
            }
            self.gotoChat(self.currentConversationId());
        });
    }
    self.removeConversationWithId = function (conversationId) {
        self.conversationList.remove(function(conv) {
            if(conv.conversation._id == conversationId){
                socket.emit('left conversation', conversationId);
                return true;
            }
            return false;
        });
    }
    
    //Messages Handlers
    self.messageList = ko.observableArray([]);
    self.gotoChat = function(conversationId){
        console.log('gotoChat Called for conversationId : ' + conversationId);
        self.currentConversationId(conversationId);
        if(conversationId !== null || conversationId !== undefined){
            $.get('/chat/'+ conversationId)
            .done(function(data){
                console.log(data);
                self.messageList.removeAll();
                data.conversation.forEach(function(conv){
                    var message = {
                        conversationId: conv.conversation._id,
                        body: conv.body,
                        senderId: conv.author.item._id,
                        senderName: conv.author.item.profile.firstName + conv.author.item.profile.lastName,
                        senderType: conv.author.kind,
                        sentAt: conv.sentAt
                    };
                    self.messageList.push(message);
                });
            });
        }
    }

    //Message Send handlers
    self.messageToSend = ko.observable();
    self.sendButtonHandler = function(){
        console.log('current conversationId is ' + self.currentConversationId());
        if(connected){
            var message = {
                conversationId: self.currentConversationId(),
                body: self.messageToSend(),
                senderId: $('#userId').val(),
                senderName: $('#userFullName').val(),
                senderType: 'User'
            };
            socket.emit('new message', message);
            self.messageToSend('');

            if(self.usedPreparedMessage() && message.body == self.usedPreparedMessage().body){
                $.put('/preparedMessage/'+self.usedPreparedMessage()._id+'/count')
                .done(function(data, statusText, xhr){
                    console.log('Prepared Message count updated.');
                    console.log(JSON.stringify(data));
                }).fail(function(xhr, statusText, error) {
                    console.log('Error in updating count.')
                    alert(xhr.responseJSON.error);
                });
            }
            self.usedPreparedMessage(null);
        }else{
            alert('Not connected.');
        }
        //send event using socket
        
    }
    self.endChatHandler = function(){
        console.log('current conversationId is ' + self.currentConversationId());
        $.ajax({
            url: '/chat/'+self.currentConversationId(),
            type: 'DELETE',
            success: function(result) {
                console.log('Conversation ended.');
                console.log(JSON.stringify(result));
                self.removeConversationWithId(self.currentConversationId());
                self.currentConversationId(self.conversationList()[0].conversation._id);
                self.gotoChat(self.currentConversationId());
            },
            error: function(result){
                console.log('Error in ending conversation.')
                alert(xhr.responseJSON.error);
            }
        });
    }

    //history handler
    self.conversationHistoryList = ko.observableArray([]);    
    self.getHistory = function(){
        self.messageList([]);
        self.currentConversationId('');
        $.get('/chat/history')
        .done(function(data){
            self.conversationHistoryList(data.conversations);
            if(self.conversationHistoryList().length > 0){
                console.log('setting the current conversationId as the first conversation of the list');
                self.currentConversationId(self.conversationHistoryList()[0].conversation._id);
                self.gotoChat(self.currentConversationId());
            } 
        });
    }
    self.emailConversationHistoryhandler = function(){
        $.post('/chat/email/' + self.currentConversationId())
        .done(function(data){
            self.conversationHistoryList(data.conversations);
            if(self.conversationHistoryList().length > 0){
                console.log('setting the current conversationId as the first conversation of the list');
                self.currentConversationId(self.conversationHistoryList()[0].conversation._id);
                self.gotoChat(self.currentConversationId());
            } 
        });
    }

    //operators handler
    self.operatorList = ko.observableArray([]);
    self.getOperators = function(){
        console.log('getting operators list');
        $.get('/users')
            .done(function(data){
                console.log(data);
                self.operatorList.removeAll();
                data.users.forEach(function(user){
                    user.status = ko.observable(user.status);
                    self.operatorList.push(user);
                });
            });
    }
    self.operatorStatusImage = function(status){
        return ko.computed(function(){
            if(status == 'online')
                return "/images/online.png";
            else
                return "/images/offline.png";
        });
    };
    self.updateOperatorStatus = function(userId, status){
        if(self.operatorList()){
            for (var i = 0; i < self.operatorList().length; i++) {
                if (self.operatorList()[i]._id === userId) {
                    self.operatorList()[i].status(status);
                    break;
                }
            }
        }
    }

    self.operator_fname = ko.observable();
    self.operator_lname = ko.observable();
    self.operator_email = ko.observable();
    self.operator_addNew = function(){
        if(self.operator_fname() && self.operator_lname() && self.operator_email()){
            $.post('/users', {
                email: self.operator_email(),
                firstName: self.operator_fname(),
                lastName: self.operator_lname()
            }).done(function(data, statusText, xhr){
                console.log('Operator Created.');
                console.log(JSON.stringify(data));
                if(xhr.status == 200){
                    data.user.status = ko.observable(data.user.status);
                    self.operatorList.push(data.user);
                }
            }).fail(function(xhr, statusText, error) {
                console.log('Error in creating operator.')
                alert(xhr.responseJSON.error);
            });
            self.operator_fname('');
            self.operator_lname('');
            self.operator_email('');
        }
    }
    
    //prepared messages handler
    self.preparedMessages = ko.observableArray([]);
    self.showDialog = ko.observable(false);
    self.showDialog1 = ko.observable(false);
    self.createdPreparedMessage = ko.observable();
    self.usedPreparedMessage = ko.observable();

    self.getPreparedMessages = function(){
        $.get('/preparedMessage')
        .done(function(data){
            console.log(data);
            self.preparedMessages(data.messages);
        });
    };

    self.submitCreatePreparedMessage = function () {
        alert('submit');
        if($.trim(self.createdPreparedMessage())){
            $.post('/preparedMessage', {
                messageBody: $.trim(self.createdPreparedMessage())
            }).done(function(data, statusText, xhr){
                console.log('Prepared Message Created.');
                console.log(JSON.stringify(data));
                if(xhr.status == 200){
                    self.createdPreparedMessage('');
                    self.showDialog(false);
                    self.getPreparedMessages()
                }
            }).fail(function(xhr, statusText, error) {
                console.log('Error in creating operator.')
                alert(xhr.responseJSON.error);
            });
        }
    }

    self.updateMessageBody = function(){
        
    }

    //helper functions
    self.timeSinceLast = function(time){
        return ko.computed(function(){
            return moment(time).fromNow();
        });   
    }

    self.textAlignDirection = function(userType){
        return ko.computed(function(){
            if(userType === 'User')
                return 'right';
            return 'left';
        });
    }
}

var trackPush = function(array) {
    var push = array.push;
    return function() {
        console.log(arguments[0]);
        socket.emit('joined conversation', {conversationId:arguments[0].conversation._id, userId:$('#userEmail').val(), senderType:'Operator'});
        push.apply(this,arguments);
    }
}

var dashboardVM = new DashboardViewModel(); 
ko.applyBindings(dashboardVM);

socket.on('receive message', function(message){
    console.log('received message : ' + JSON.stringify(message));
    if(dashboardVM.chosenViewId() == 'Conversations'){
        if(dashboardVM.currentConversationId() === message.conversationId){
            dashboardVM.messageList.push(message);
        }
        dashboardVM.gotoView('Conversations');
    }
});

socket.on('new conversation', function(data){
    console.log('new conversation started with data : ' + JSON.stringify(data));
    dashboardVM.conversationList.push(data);
});

//operatorId, conversationId
socket.on('operator claimed conversation', function(data){
    console.log('an operator claimed a conversation with details : ' + JSON.stringify(data));
    if(data.userId != $('#userId').val()){
        dashboardVM.removeConversationWithId(data.conversationId);
    }      
});

socket.on('connect', function(){
    connected = true;
    console.log('connected');
    dashboardVM.gotoView('Conversations');
    socket.emit('operator joined', {userId: $('#userId').val()});
    dashboardVM.getPreparedMessages();
});

socket.on('operator online', function(userId){
    if(dashboardVM.chosenViewId() == 'Operators'){
        dashboardVM.updateOperatorStatus(userId, 'online');
    }
});

socket.on('operator offline', function(userId){
    if(dashboardVM.chosenViewId() == 'Operators'){
        dashboardVM.updateOperatorStatus(userId, 'offline');
    }
});

socket.on('disconnect', function(){
    connected = false;
    console.log('disconnected');
});

$('ul#profile').click(function(){
    $(this).find('li#profile-options').toggleClass('open');
});
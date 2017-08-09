var socket = io.connect('http://localhost:3001');
function DashboardViewModel(){
    var self = this;
    self.views = ['Conversations', 'History', 'Operators', 'Prepared Messages'];
    self.chosenViewId = ko.observable();
    self.conversationList = ko.observableArray([]);
    self.conversationList.push = trackPush(self.conversationList);
    
    self.gotoView = function(view){
        self.chosenViewId(view);
        $.get('/chat')
        .done(function(data){
            // console.log(data);
            self.conversationList(data.conversations);
            data.conversations.forEach(function(conv){
                socket.emit('joined conversation', {conversationId:conv.conversation._id, userId:$('#userEmail').val(), senderType:'Operator'});
            });
        });
    };

    self.removeConversationWithId = function (conversationId) {
        self.conversationList.remove(function(conv) {
            if(conv.conversation._id == conversationId){
                socket.emit('left conversation', conversationId);
                return true;
            }
            return false;
        });
    }

    self.currentConversationId = ko.observable();
    self.messageList = ko.observableArray([]);
    
    self.gotoChat = function(conversationId){
        if(conversationId !== null || conversationId !== undefined){
            // console.log(conversation.conversation._id);
            self.currentConversationId(conversationId);
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

    self.messageToSend = ko.observable();

    self.sendButtonHandler = function(){
        console.log('current conversationId is ' + self.currentConversationId());
        //send event using socket
        var message = {
            conversationId: self.currentConversationId(),
            body: self.messageToSend(),
            senderId: $('#userId').val(),
            senderName: $('#userFullName').val(),
            senderType: 'User'
        };
        socket.emit('new message', message);
        self.messageToSend('');
        // self.messageList.push(message);
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

    //init actions
    self.gotoView('Conversations');
    socket.emit('operator joined', {userId: $('#userId').val()});
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
    if(dashboardVM.currentConversationId() === message.conversationId){
        dashboardVM.messageList.push(message);
    }
    dashboardVM.gotoView('Conversations');
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
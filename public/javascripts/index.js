var socket = io.connect('http://localhost:3001');
function DashboardViewModel(){
    var self = this;
    self.subscribedConversations = ko.observableArray([]);
    self.subscribedConversations.push = trackPush(self.subscribedConversations);
    self.views = ['Conversations', 'History', 'Operators', 'Prepared Messages'];
    self.chosenViewId = ko.observable();
    self.conversationList = ko.observable();
    
    self.gotoView = function(view){
        self.chosenViewId(view);
        $.get('/chat')
        .done(function(data){
            // console.log(data);
            self.conversationList(data);
            data.conversations.forEach(function(conv){
                self.subscribedConversations.push(conv.conversation._id);
            });
        });
    };

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
        socket.emit('new message', {
            conversationId: self.currentConversationId(),
            body: self.messageToSend(),
            senderId: $('#userId').val(),
            senderName: $('#userFullName').val(),
            senderType: 'User'
        });
        self.messageToSend('');
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
}

var trackPush = function(array) {
    var push = array.push;
    return function() {
        console.log(arguments[0]);
        var user
        socket.emit('enter conversation', {conversationId:arguments[0], userId:$('#userEmail').val()});
        push.apply(this,arguments);
    }
}

var dashboardVM = new DashboardViewModel(); 
ko.applyBindings(dashboardVM);

socket.on('receive message', function(conversation){
    console.log('received message : ' + conversation);
    if(dashboardVM.currentConversationId() === conversation.conversationId){
        dashboardVM.messageList.push(conversation);
    }
    dashboardVM.gotoView('Conversations');
});
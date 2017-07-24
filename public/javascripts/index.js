var socket = io.connect('http://localhost:3001');
function DashboardViewModel(){
    var self = this;
    self.views = ['Conversations', 'History', 'Operators', 'Prepared Messages'];
    self.chosenViewId = ko.observable();
    self.conversationList = ko.observable();
    self.currentConversation = ko.observable();
    self.messageList = ko.observable();
    self.timeSinceLast = function(time){
        return ko.computed(function(){
            return moment(time).fromNow();
        });   
    }
    self.messageToSend = ko.observable();
    self.subscribedConversations = ko.observableArray([]);

    self.textAlignDirection = function(userType){
        return ko.computed(function(){
            if(userType === 'User')
                return 'right';
            return 'left';
        });
    }

    self.gotoView = function(view){
        self.chosenViewId(view);
        // console.log(self.chosenViewId());
        $.get('/chat')
        .done(function(data){
            // console.log(data);
            self.conversationList(data);
            data.conversations.forEach(function(conv){
                self.subscribedConversations.push(conv.conversation._id);
            });
        });
    };

    self.gotoChat = function(conversationId){
        if(conversationId !== null || conversationId !== undefined){
            // console.log(conversation.conversation._id);
            self.currentConversation(conversationId);
            $.get('/chat/'+ conversationId)
            .done(function(data){
                // console.log(data);
                self.messageList(data);
            });
        }
    }

    self.sendButtonHandler = function(){
        console.log('current conversationId is ' + self.currentConversation());
        $.post('/chat/'+self.currentConversation(), {composedMessage:self.messageToSend()})
        .done(function(data){
            if(data.message === 'Reply successfully sent!'){
                self.gotoChat(self.currentConversation());
                self.messageToSend('');
                socket.emit('new message', self.currentConversation());
            }
        });
    }

    self.subscribedConversations.push = trackPush(self.subscribedConversations);
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

socket.on('refresh messages', function(conversation){
    console.log('refresh messages for ' + conversation);
    dashboardVM.gotoChat(conversation);
});
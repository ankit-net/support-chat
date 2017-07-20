function DashboardViewModel(){
    var self = this;
    self.views = ['Conversations', 'History', 'Operators', 'Prepared Messages'];
    self.chosenViewId = ko.observable();
    self.conversationsList = ko.observable();
    self.messagesList = ko.observable();

    self.gotoView = function(view){
        self.chosenViewId(view);
        console.log(self.chosenViewId());

    };
}

ko.applyBindings(new DashboardViewModel());
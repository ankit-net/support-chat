function DashboardViewModel(){
    var self = this;
    self.views = ['Conversations', 'History', 'Operators', 'Prepared Messages'];
    self.chosenViewId = ko.observable();

    self.gotoView = function(view){
        self.chosenViewId(view);
    };
}

ko.applyBindings(new DashboardViewModel());
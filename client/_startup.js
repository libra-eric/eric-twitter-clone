Meteor.startup(function() {
  Hooks.init();
  console.log("Client Ready");
});

Meteor.subscribe("userData");
Meteor.subscribe("relations");
Meteor.subscribe("userstimeline");
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY'
});

Hooks.onLoggedOut = function (userId) {
  FlowRouter.go("/");
};

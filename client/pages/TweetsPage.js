/*global
 User
 */
Template.TweetsPage.helpers({

  content: function () {
    if (User.loggedIn()) {
      return Template["tweetsList"]
    } else {
      var div = document.getElementById('loginContainer');
      $(div).hide();
      return Template["needLogin"];
    }
  }

});

Template.needLogin.events({
  'click .twitter-login': function() {
    Meteor.loginWithTwitter();
  }
});


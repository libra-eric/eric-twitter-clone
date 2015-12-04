Template.loginType.helpers({

  content: function () {
    if (User.loggingIn()) {
      return Template["loginSpinner"]
    } else {
      return Template["loginButton"];
    }
  }
});
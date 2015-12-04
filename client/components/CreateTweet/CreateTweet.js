/*global Tweet, Relations, User */

Automention = new Mongo.Collection(null);

Template.CreateTweet.helpers({
  settings: function() {
    var allFollowers, followers, friends,
      relations = Relations.find().fetch()[0];
    if (relations && relations.followers && relations.friends) {
      allFollowers = relations.followers.users;
      followers = [];
      friends = relations.friends.users;
      allFollowers.map(function(follower, index) {
        if (!follower.following) {
          followers.push(follower);
        }
      });

      var relatedUsers = followers.concat(friends);

      if (Automention.find().fetch().length == 0) {
        relatedUsers.forEach(function (fruit) {
          Automention.insert({users: fruit})
        });
      }
    }
    return {
      limit: 6,  // more than 20, to emphasize matches outside strings *starting* with the filter
      rules: [
        {
          token: ' @',
          collection: Automention,  // Mongo.Collection object means client-side collection
          field: 'users.screen_name',
          matchAll: true,  // 'ba' will match 'bar' and 'baz' first, then 'abacus'
          template: Template.relatedUser
        }
      ]
    }
  }
});

Template.CreateTweet.onRendered(function() {
  var tweetContent = $('.create-tweet').val();
  if (tweetContent === '') {
    $('.create-tweet-btn').prop('disabled', true);
  }
});

Template.CreateTweet.events({
  'click .create-tweet-btn': function() {
    var tweetContent = $('.create-tweet').val();
    Tweet.create(User.id(), User.current().status.connection_id, {
      status: tweetContent
    });
    $('.create-tweet').val('');
  },

  'keyup .create-tweet-container': function() {
    var tweetContent = $('.create-tweet').val(),
      createTweetButton = $('.create-tweet-btn');
    if (tweetContent === '') {
      createTweetButton.prop('disabled', true);
    } else {
      createTweetButton.prop('disabled', false);
    }
  }
});
var schema = {
  userId: String,
  _id: String,
  twid: String,
  text: String,
  author: String,
  avatar: String,
  createdAt: Date,
  screen_name: String,
  retweet_count: String,
  favorite_count: String,
  entities: Object,
  original_author: String,
  original_author_screen_name: String,
  original_retweet_count: String,
  original_favorite_count: String,
  original_entities: String
};

Tweets = new Mongo.Collection('tweets', {transform: function(doc) {
  // make documents inherit our model, no old IE support with __proto__
  doc.__proto__ = Tweet;
  return doc;
}});

// optionally run hook to log, audit, or denormalize mongo data
//Tweets.after.insert(function (userId, doc) {
//   console.log("Inserted Doc", userId, doc);
//});

Tweet = {
  get: function(callback) {
    return Meteor.call('Tweet.get', callback);
  },

  create: function(userId, connection_id, data, callback) {
    return Meteor.call('Tweet.create', userId, connection_id, data, callback);
  },

  destroy: function(callback) {
    return Meteor.call('Tweet.destroy', this._id, callback);
  },

  increment: function(docId, callback) {
    return Meteor.call('Tweet.increment', docId, callback);
  }
};

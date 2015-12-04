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

Userstimeline = new Mongo.Collection('userstimeline');


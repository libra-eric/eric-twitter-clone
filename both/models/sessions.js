Sessions = new Mongo.Collection('sessions');

Sessions.allow({
  'update': function (userId, doc) {
    /* user and doc checks ,
     return true to allow insert */
    return true;
  }
});
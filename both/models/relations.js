Relations = new Mongo.Collection('relations');

Relations.allow({
  'update': function (userId, doc) {
    /* user and doc checks ,
     return true to allow insert */
    return true;
  }
});

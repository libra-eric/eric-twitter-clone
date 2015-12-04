/*global Tweets, Sessions, Relations, Userstimeline, Stream*/
var Twitter = Meteor.npmRequire('twitter');
var fetch_id;
var stream_map = {};
var twitter_client_map = {};
var oauth   = Meteor.npmRequire('oauth');
var events  = Meteor.npmRequire('events');
var util    = Meteor.npmRequire("util");
var user_stream_url     = 'https://userstream.twitter.com/1.1/user.json',
  request_token_url   = 'https://api.twitter.com/oauth/request_token',
  access_token_url    = 'https://api.twitter.com/oauth/access_token';

var Stream = function (params) {
  if (!(this instanceof Stream)) {
    return new Stream(params);
  }
  events.EventEmitter.call(this);
  this.params = params;
  this.oauth = new oauth.OAuth(
    request_token_url,
    access_token_url,
    this.params.consumer_key,
    this.params.consumer_secret,
    '1.0',
    null,
    'HMAC-SHA1',
    null,
    {
      'Accept': '*/*',
      'Connection'
              : 'close',
      'User-Agent': 'user-stream.js'
    }
  );
};

//inherit
util.inherits(Stream, events.EventEmitter);

/**
 * Create twitter use stream
 *
 * Events:
 * - data
 * - garbage
 * - close
 * - error
 * - connected
 * - heartbeat
 *
 */
Stream.prototype.stream = function(params) {
  var stream = this;
  if (typeof params != 'object') {
    params = {};
  }
  //required params for lib
  params.stall_warnings = 'true';

  var request = this.oauth.post(
    user_stream_url,
    this.params.access_token_key,
    this.params.access_token_secret,
    params,
    null
  );

  /**
   * Destroy socket
   */
  this.destroy = function() {
    request.abort();
  };

  request.on('response', function(response) {
    // Any response code greater then 200 from steam API is an error
    if(response.statusCode > 200) {
      stream.emit('error', new Error(response.statusCode));
    } else {
      //emit connected event
      stream.emit('connected');
      console.log('user stream socket connected');
      response.setEncoding('utf8');
      var data = '';

      response.on('data', function(chunk) {
        data += chunk.toString('utf8');
        //is heartbeat?
        if (data == '\r\n') {
          stream.emit('heartbeat');
          return;
        }
        var index, json;
        while((index = data.indexOf('\r\n')) > -1) {
          json = data.slice(0, index);
          data = data.slice(index + 2);
          if(json.length > 0) {
            try {
              stream.emit('data', JSON.parse(json));
            } catch(e) {
              stream.emit('garbage', data);
            }
          }
        }
      });

      response.on('error', function(error) {
        stream.emit('close', error);
      });

      response.on('end', function() {
        stream.emit('close', 'socket end');
        console.log('user stream socket ended');
      });

      response.on('close', function() {
        request.abort();
        console.log('user stream socket closed');
      });
    }
  });

  request.on('error', function(error) {
    stream.emit('error', new Error('connection error'));
  });

  request.end();

};

Accounts.onCreateUser(function(options, user) {
  // We still want the default hook's 'profile' behavior.
  if (options.profile) {
    user.profile = options.profile;
  }
  if (options.status) {
    options.status['connection_id'] = null;
    user.status = options.status;
  }
  return user;
});

var optional = Match.Optional;
Meteor.methods({
  'Tweet.getUser': function(userId, current_user_id, access_token_key, access_token_secret, connection_id) {
    var twitter_client = new Twitter({
      consumer_key: 'fNZpj7WvvSlVgVppnegqmDrbu',
      consumer_secret: 'JHhFif8yfsFhB59YM2s8l2zd724BLFm5eVWKq5ALkjSq5yrQMk',
      access_token_key: access_token_key,
      access_token_secret: access_token_secret
    });
    twitter_client_map[connection_id] = twitter_client;
    var gTweets = Async.runSync(function(done) {

        console.log('get detail information for user: ' + current_user_id);
        twitter_client.get('users/show', {user_id: current_user_id}, function(error, user, response) {
          if(error) {
            console.log('user: ' + user[0]);
            console.log('error: ' + error[0]);
            throw error;
          }
          done(null, user);
        });
    });
    var statuses_count = gTweets.result.statuses_count;
    Meteor.users.update({_id: userId}, {$set:{"services.twitter.statuses_count": statuses_count}});
    console.log("update user's statuses_count: " + statuses_count);
    return gTweets.result;
  },

  'Tweet.getHomeTimeline': function(userId, current_user_id, access_token_key, access_token_secret, connection_id, max_id) {
    var twitter_client = twitter_client_map[connection_id];
    var gTweets = Async.runSync(function(done) {
      if (max_id) {
        console.log('get tweet after: ' + max_id);
        try {
          twitter_client.get('statuses/home_timeline', {max_id: max_id}, function(error, tweets, response) {
            if(error) {
              console.log('get home timeline error: ' + error);
              throw new Meteor.Error('get home timeline error');
            }
            done(null, tweets);
          });
        } catch (error) {
          console.error(error);
        }
      } else {
        try {
          twitter_client.get('statuses/home_timeline', function(error, tweets, response) {
            if(error) {
              console.log('get home timeline error: ' + error);
              throw new Meteor.Error('get home timeline error');
            }
            done(null, tweets);
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
    for (var i = 0; i < gTweets.result.length; i++) {
      var tweet = gTweets.result[i],
        avatar, author, original_author,
        original_author_screen_name,
        original_retweet_count,
        original_favorite_count,
        original_entities, self_create;
      if (tweet.retweeted_status) {
        avatar = tweet.retweeted_status.user.profile_image_url;
        author = tweet.user.name;
        original_author = tweet.retweeted_status.user.name;
        original_author_screen_name = tweet.retweeted_status.user.screen_name;
        original_retweet_count = tweet.retweeted_status.retweet_count;
        original_favorite_count = tweet.retweeted_status.favorite_count;
        original_entities = tweet.retweeted_status.entities;
      } else {
        avatar = tweet.user.profile_image_url;
        author = tweet.user.name;
        original_author = null;
        original_author_screen_name = null;
        original_retweet_count = null;
        original_favorite_count = null;
        original_entities = null;
      }
      self_create = (parseFloat(tweet.user.id) === parseFloat(current_user_id));
      var data = {
        userId: userId,
        twid: tweet.id_str,
        text: tweet.text,
        author: author,
        avatar: avatar,
        self_create: self_create,
        createdAt: Date.parse(tweet.created_at)/1000,
        screen_name: tweet.user.screen_name,
        retweet_count: tweet.retweet_count,
        favorite_count: tweet.favorite_count,
        entities: tweet.entities,
        original_author: original_author,
        original_author_screen_name: original_author_screen_name,
        original_retweet_count: original_retweet_count,
        original_favorite_count: original_favorite_count,
        original_entities: original_entities
      };
      if (max_id !== data.twid) {
        Tweets.insert(data);
      }
      if (i === gTweets.result.length - 1) {
        Sessions.update({_id: connection_id}, {$set:{"tweet_max_id": tweet.id_str, "first_load": false}});
      }
    }
    console.log('insert tweets');
    return gTweets.result;
  },

  'Tweet.getUserTimeline': function(screen_name, access_token_key, access_token_secret, connection_id, max_id) {
    var twitter_client = twitter_client_map[connection_id];
    var gTweets = Async.runSync(function(done) {
      if (max_id) {
        console.log('get tweet after: ' + max_id);
        try {
          twitter_client.get('statuses/user_timeline',
            {screen_name: screen_name, max_id: max_id},
            function (error, tweets, response) {
              if (error) {
                throw new Meteor.Error('get user timeline error');
              }
              done(null, tweets);
            });
        } catch (error) {
          console.error(error);
        }
      } else {
        try {
          twitter_client.get('statuses/user_timeline', {screen_name: screen_name}, function(error, tweets, response) {
            if(error) {
              throw new Meteor.Error('get user timeline error');
            }
            done(null, tweets);
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
    for (var i = 0; i < gTweets.result.length; i++) {
      var tweet = gTweets.result[i],
        avatar, self_avatar, author, original_author,
        original_author_screen_name,
        original_retweet_count,
        original_favorite_count,
        original_entities, userId;

      if (tweet.retweeted_status) {
        avatar = tweet.retweeted_status.user.profile_image_url;
        self_avatar = tweet.user.profile_image_url;
        userId = tweet.user.id_str;
        author = tweet.user.name;
        original_author = tweet.retweeted_status.user.name;
        original_author_screen_name = tweet.retweeted_status.user.screen_name;
        original_retweet_count = tweet.retweeted_status.retweet_count;
        original_favorite_count = tweet.retweeted_status.favorite_count;
        original_entities = tweet.retweeted_status.entities;
      } else {
        avatar = tweet.user.profile_image_url;
        self_avatar = tweet.user.profile_image_url;
        userId = tweet.user.id_str;
        author = tweet.user.name;
        original_author = null;
        original_author_screen_name = null;
        original_retweet_count = null;
        original_favorite_count = null;
        original_entities = null;
      }
      var current_user_timeline_tweet = {
        userId: userId,
        twid: tweet.id_str,
        text: tweet.text,
        author: author,
        avatar: avatar,
        self_avatar: self_avatar,
        createdAt: Date.parse(tweet.created_at)/1000,
        screen_name: tweet.user.screen_name,
        statuses_count: tweet.user.statuses_count,
        friends_count: tweet.user.friends_count,
        followers_count: tweet.user.followers_count,
        favorite_count: tweet.user.favorite_count,
        retweet_count: tweet.retweet_count,
        entities: tweet.entities,
        original_author: original_author,
        original_author_screen_name: original_author_screen_name,
        original_retweet_count: original_retweet_count,
        original_favorite_count: original_favorite_count,
        original_entities: original_entities
      };
      if (max_id !== tweet.id_str) {
        Userstimeline.update({_id: connection_id}, {$push:{"user_timeline_tweets": current_user_timeline_tweet}});
      }
      if (i === gTweets.result.length - 1) {
        var current_user_timeline_max_id = {
          userId: userId,
          screen_name: tweet.user.screen_name,
          max_id: tweet.id_str
        };

        Userstimeline.update({_id: connection_id}, {$pull:{"user_timeline_max_ids": {screen_name: tweet.user.screen_name}}});
        Userstimeline.update({_id: connection_id}, {$push:{"user_timeline_max_ids": current_user_timeline_max_id}});
      }
    }
    console.log('insert user timeline of user: ' + screen_name);
    return gTweets.result;
  },

  'Tweet.stream': function(userId, current_user_id, access_token_key, access_token_secret, connectionId) {
    var wrappedInsert = Meteor.bindEnvironment(function(tweet) {
      var session = Sessions.find({_id: connectionId}).fetch()[0];
      if(session) {
        var coming_tweets_count = session.coming_tweets_count;
        console.log('current tweet is self created: ' + tweet.self_create);
        if (!tweet.self_create) {
          Sessions.update({_id: connectionId}, {$set:{"coming_tweets_count": coming_tweets_count + 1, "first_load": false}});
          Tweets.insert(tweet);
        }
      }
    }, "Failed to insert tweet into Tweets collection.");

    var stream_client = new Stream({
      consumer_key: 'fNZpj7WvvSlVgVppnegqmDrbu',
      consumer_secret: 'JHhFif8yfsFhB59YM2s8l2zd724BLFm5eVWKq5ALkjSq5yrQMk',
      access_token_key: access_token_key,
      access_token_secret: access_token_secret
    });

    //create stream
    stream_client.stream();
    stream_map[connectionId] = stream_client;

    //listen stream data
    stream_client.on('data', function(tweet) {
      if(tweet.hasOwnProperty('delete')) {
        console.log('delete tweet');
      }
      var avatar, author, original_author,
        original_author_screen_name,
        original_retweet_count,
        original_favorite_count,
        original_entities, self_create;
      if (tweet !== undefined && !tweet.hasOwnProperty('friends') && !tweet.hasOwnProperty('delete')) {
        console.log('receive new tweet from: ' + tweet.user.name);
        console.log('tweet text: ' + tweet.text);
        if (tweet.retweeted_status) {
          avatar = tweet.retweeted_status.user.profile_image_url;
          author = tweet.user.name;
          original_author = tweet.retweeted_status.user.name;
          original_author_screen_name = tweet.retweeted_status.user.screen_name;
          original_retweet_count = tweet.retweeted_status.retweet_count;
          original_favorite_count = tweet.retweeted_status.favorite_count;
          original_entities = tweet.retweeted_status.entities;
        } else {
          avatar = tweet.user.profile_image_url;
          author = tweet.user.name;
          original_author = null;
          original_author_screen_name = null;
          original_retweet_count = null;
          original_favorite_count = null;
          original_entities = null;
        }
        self_create = (parseFloat(tweet.user.id) === parseFloat(current_user_id));
        var data = {
          userId: userId,
          twid: tweet.id_str,
          text: tweet.text,
          author: author,
          avatar: avatar,
          self_create: self_create,
          createdAt: Date.parse(tweet.created_at)/1000,
          screen_name: tweet.user.screen_name,
          retweet_count: tweet.retweet_count,
          favorite_count: tweet.favorite_count,
          entities: tweet.entities,
          original_author: original_author,
          original_author_screen_name: original_author_screen_name,
          original_retweet_count: original_retweet_count,
          original_favorite_count: original_favorite_count,
          original_entities: original_entities
        };
        if (!self_create) {
          wrappedInsert(data);
        }
      }
    });

    stream_client.on('error', function(error) {
      console.log(error);
    });
  },

  'Tweet.create': function(userId, connection_id, data) {
    var twitter_client = twitter_client_map[connection_id];
    var gTweets = Async.runSync(function(done) {
      twitter_client.post('statuses/update', data, function(error, tweets, response) {
        if(error) {
          console.log("create tweet fail: " + error);
          throw error;
        }
        done(null, tweets);
      });
    });
    var tweet = gTweets.result,
      avatar, author, original_author,
      original_author_screen_name,
      original_retweet_count,
      original_favorite_count,
      original_entities;
    if (tweet.retweeted_status) {
      avatar = tweet.retweeted_status.user.profile_image_url;
      author = tweet.user.name;
      original_author = tweet.retweeted_status.user.name;
      original_author_screen_name = tweet.retweeted_status.user.screen_name;
      original_retweet_count = tweet.retweeted_status.retweet_count;
      original_favorite_count = tweet.retweeted_status.favorite_count;
      original_entities = tweet.retweeted_status.entities;
    } else {
      avatar = tweet.user.profile_image_url;
      author = tweet.user.name;
      original_author = null;
      original_author_screen_name = null;
      original_retweet_count = null;
      original_favorite_count = null;
      original_entities = null;
    }
    var insert_data = {
      userId: userId,
      twid: tweet.id_str,
      text: tweet.text,
      author: author,
      avatar: avatar,
      self_create: true,
      createdAt: Date.parse(tweet.created_at)/1000,
      screen_name: tweet.user.screen_name,
      retweet_count: tweet.retweet_count,
      favorite_count: tweet.favorite_count,
      entities: tweet.entities,
      original_author: original_author,
      original_author_screen_name: original_author_screen_name,
      original_retweet_count: original_retweet_count,
      original_favorite_count: original_favorite_count,
      original_entities: original_entities
    };
    Tweets.insert(insert_data);
    return gTweets.result;
  },

  'User.getFollowers': function(userId, current_user_id, access_token_key, access_token_secret, connection_id) {
    var twitter_client = twitter_client_map[connection_id];
    var followers = Async.runSync(function(done) {
      twitter_client.get('followers/list', {user_id: userId, count: 100}, function(error, data, response) {
        if(error) {
          throw error;
        }
        done(null, data);
      });

    });
    var insert_data = {
      users: [],
      next_cursor: null,
      previous_cursor: null
    };
    insert_data.next_cursor = followers.result.next_cursor;
    insert_data.previous_cursor = followers.result.previous_cursor;
    for (var i = 0; i < followers.result.users.length; i++) {
      var follower = followers.result.users[i],
        id, name, screen_name, followers_count, friends_count, statuses_count,
        created_at, profile_image_url, following, muting;
      id = follower.id_str;
      name = follower.name;
      screen_name = follower.screen_name;
      followers_count = follower.followers_count;
      friends_count = follower.friends_count;
      statuses_count = follower.statuses_count;
      created_at = follower.created_at;
      profile_image_url = follower.profile_image_url;
      following = follower.following;
      muting = follower.muting;

      var data = {
        userId: id,
        avatar: profile_image_url,
        name: name,
        screen_name: screen_name,
        value: '@' + screen_name,
        followers_count: followers_count,
        friends_count: friends_count,
        statuses_count: statuses_count,
        created_at: created_at,
        following: following,
        muting: muting
      };
      insert_data.users.push(data);
    }
    var user_services = Meteor.users.findOne({_id: userId},
      {fields: {'services': 1}});
    var screen_name = user_services.services.twitter.screenName;
    console.log('stored followers infomation for user: ' + screen_name);
    Relations.update({userId: userId}, {$set:{"followers": insert_data}});
    return followers.result;
  },

  'User.getFriends': function(userId, current_user_id, access_token_key, access_token_secret, connection_id) {
    var twitter_client = twitter_client_map[connection_id];
    var friends = Async.runSync(function(done) {
      twitter_client.get('friends/list', {user_id: userId, count: 100}, function(error, data, response) {
        if(error) {
          throw error;
        }
        done(null, data);
      });

    });
    var insert_data = {
      users: [],
      next_cursor: null,
      previous_cursor: null
    };
    insert_data.next_cursor = friends.result.next_cursor;
    insert_data.previous_cursor = friends.result.previous_cursor;
    for (var i = 0; i < friends.result.users.length; i++) {
      var friend = friends.result.users[i],
        id, name, screen_name, followers_count, friends_count, statuses_count,
        created_at, profile_image_url, following, muting;
      id = friend.id_str;
      name = friend.name;
      screen_name = friend.screen_name;
      followers_count = friend.followers_count;
      friends_count = friend.friends_count;
      statuses_count = friend.statuses_count;
      created_at = friend.created_at;
      profile_image_url = friend.profile_image_url;
      following = friend.following;
      muting = friend.muting;

      var data = {
        userId: id,
        avatar: profile_image_url,
        name: name,
        screen_name: screen_name,
        value: '@' + screen_name,
        followers_count: followers_count,
        friends_count: friends_count,
        statuses_count: statuses_count,
        created_at: created_at,
        following: following,
        muting: muting
      };
      insert_data.users.push(data);
    }
    var user_services = Meteor.users.findOne({_id: userId},
      {fields: {'services': 1}});
    var screen_name = user_services.services.twitter.screenName;
    console.log('stored friends infomation for user: ' + screen_name);
    Relations.update({userId: userId}, {$set:{"friends": insert_data}});
    return friends.result;
  },

  'User.followUser': function(userId, screen_name, access_token_key, access_token_secret, connection_id) {
    var twitter_client = twitter_client_map[connection_id];
    var friends = Async.runSync(function(done) {
      twitter_client.post('friendships/create', {screen_name: screen_name}, function(error, data, response) {
        if(error) {
          throw error;
        }
        done(null, data);
      });

    });
    var friend = friends.result,
      id, name, screen_name, followers_count, friends_count, statuses_count,
      created_at, profile_image_url, following, muting;
    id = friend.id_str;
    name = friend.name;
    screen_name = friend.screen_name;
    followers_count = friend.followers_count;
    friends_count = friend.friends_count;
    statuses_count = friend.statuses_count;
    created_at = friend.created_at;
    profile_image_url = friend.profile_image_url;
    following = friend.following;
    muting = friend.muting;

    var data = {
      userId: id,
      avatar: profile_image_url,
      name: name,
      screen_name: screen_name,
      value: '@' + screen_name,
      followers_count: followers_count,
      friends_count: friends_count,
      statuses_count: statuses_count,
      created_at: created_at,
      following: true,
      muting: muting
    };
    console.log('follow user: ' + screen_name);
    Relations.update({userId: userId}, {$push:{"friends.users": data}});
    return friends.result;
  },

  'User.unFollowUser': function(userId, screen_name, access_token_key, access_token_secret, connection_id) {
    var twitter_client = twitter_client_map[connection_id];
    var friends = Async.runSync(function(done) {
      twitter_client.post('friendships/destroy', {screen_name: screen_name}, function(error, data, response) {
        if(error) {
          throw error;
        }
        done(null, data);
      });

    });
    console.log('unfollow user: ' + screen_name);
    Relations.update({userId: userId}, {$pull:{"friends.users": {screen_name: screen_name}}});
    return friends.result;
  }
});

Meteor.publish('tweet', function(fields, tweetIds) {
  check(tweetIds, Match.OneOf(null, [String]));
  check(fields, {
    tweets: {
      _id: Boolean,  // id required for security
      userId: optional(Boolean),
      twid: optional(Boolean),
      text: optional(Boolean),
      author: optional(Boolean),
      avatar: optional(Boolean),
      createdAt: optional(Boolean),
      screen_name: optional(Boolean),
      retweet_count: optional(Boolean),
      favorite_count: optional(Boolean),
      entities: optional(Boolean),
      original_author: optional(Boolean),
      original_author_screen_name: optional(Boolean),
      original_retweet_count: optional(Boolean),
      original_favorite_count: optional(Boolean),
      original_entities: optional(Boolean)
    }
  });

  // returns Mongo Cursors
  //console.log('publish tweets:');
  return [
    Tweets.find({userId: this.userId}, {fields: fields.tweets, sort: {createdAt: -1}})
  ];
});

Meteor.publish('session', function() {
  //console.log('publish sessions:');
  return [
    Sessions.find({})
  ];
});

Meteor.publish('relations', function() {
  //console.log('publish followers:');
  return [
    Relations.find({})
  ];
});

Meteor.publish('userstimeline', function() {
  //console.log('publish followers:');
  return [
    Userstimeline.find({})
  ];
});

Meteor.publish("userData", function () {
  if (this.userId) {
    return Meteor.users.find({_id: this.userId},
      {fields: {'services': 1, 'status': 1}});
  } else {
    this.ready();
  }
});

UserStatus.events.on("connectionLogin", function(fields) {
  // todo: check if user is online in any session, if not, clear Tweets and Sessions collections
  //Tweets.remove({userId: fields.userId});
  //console.log('remove all tweets for user: ' + fields.userId);
  //Sessions.remove({userId: fields.userId});
  //console.log('remove all sessions for user: ' + fields.userId);

  var access_token_key, access_token_secret, user_services, current_user_id, screen_name;
  if (fields.userId) {
    user_services = Meteor.users.findOne({_id: fields.userId},
      {fields: {'services': 1}});
    screen_name = user_services.services.twitter.screenName;
    console.log(screen_name + ' logged in');
    console.log('store session for user: ' + screen_name + ', session id: ' + fields.connectionId);
    console.log('store relations for user: ' + screen_name + ', relation id: ' + fields.connectionId);
    current_user_id = user_services.services.twitter.id;
    access_token_key = user_services.services.twitter.accessToken;
    access_token_secret = user_services.services.twitter.accessTokenSecret;
    Meteor.users.update({_id: fields.userId}, {$set:{"services.twitter.statuses_count": null}});

    var sessionData = {
      _id: fields.connectionId,
      userId: fields.userId,
      ipAddr: fields.ipAddr,
      loginTime: fields.loginTime,
      idle: fields.idle,
      self_create_tweet: false,
      coming_tweets_count: 0,
      first_load: true,
      tweet_max_id: null,
      online: true
    };
    var relationsData = {
      _id: fields.connectionId,
      userId: fields.userId,
      followers: null,
      friends: null
    };
    var usersTimelineData = {
      _id: fields.connectionId,
      user_timeline_tweets: [],
      user_timeline_max_ids: []
    };
    Sessions.remove({online: false});
    Sessions.insert(sessionData);
    Relations.insert(relationsData);
    Userstimeline.insert(usersTimelineData);
    Meteor.users.update({_id: fields.userId}, {$set:{"status.connection_id": fields.connectionId}});

    Meteor.call('Tweet.getUser', fields.userId, current_user_id, access_token_key, access_token_secret, fields.connectionId);
    // todo: check if this user is online in any session, if yes, don't call "Tweet.get"
    Meteor.call('Tweet.getHomeTimeline', fields.userId, current_user_id, access_token_key, access_token_secret, fields.connectionId);
    Meteor.call('User.getFollowers', fields.userId, current_user_id, access_token_key, access_token_secret, fields.connectionId);
    Meteor.call('User.getFriends', fields.userId, current_user_id, access_token_key, access_token_secret, fields.connectionId);
    Meteor.call('Tweet.stream', fields.userId, current_user_id, access_token_key, access_token_secret, fields.connectionId);
  } else {
    this.ready();
  }
});

UserStatus.events.on("connectionLogout", function(fields) {
  if (stream_map[fields.connectionId] !== undefined) {
    stream_map[fields.connectionId].destroy();
  }
  Tweets.remove({userId: fields.userId});
  Sessions.remove({_id: fields.connectionId});
  Userstimeline.remove({_id: fields.connectionId});
  Relations.remove({userId: fields.userId});
  Meteor.users.update({_id: fields.userId}, {$set:{"status.connection_id": null}});
  var user_services = Meteor.users.findOne({_id: fields.userId},
    {fields: {'services': 1}});
  var screen_name = user_services.services.twitter.screenName;
  console.log(screen_name + ' close or logged out');
  console.log('remove session for user: ' + screen_name + ', session id: ' + fields.connectionId);
  console.log('remove relations for user: ' + screen_name + ', relation id: ' + fields.connectionId);
  console.log('remove users timeline for user: ' + screen_name + ', session id: ' + fields.connectionId);
});

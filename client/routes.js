/*global FlowRouter, FlowLayout */

// Flow Router handles rendering out our page views (Blaze templates)
// these views can then call the router API to get reactive updates on
// state in the URL. This can then be passed down into children if needed

// If you're looking at using an all React front end (no Blaze) then using
// react-router (via browserfy) would prob. be better unless you just need
// an even more simple router!

FlowLayout.setRoot('body');

FlowRouter.route('/',      { name: 'TweetsPage',  action: renderView });
FlowRouter.route('/:screen_name', { name: 'PersonalPage',  action: renderView });

// helper to layout the parent page view and log debug data
function renderView(params, queryParams) {
  renderMainLayoutWith(this.name, params);
  console.log("[FlowRouter] params", this.name, FlowRouter._current.params);
}

function renderMainLayoutWith(view, params) {
  if (view === 'PersonalPage') {
    var user_id = User.id(), screen_name, access_token_key, access_token_secret, connection_id, tweet_max_id;
    if (user_id) {
      access_token_key = User.current().services.twitter.accessToken;
      access_token_secret = User.current().services.twitter.accessTokenSecret;
      connection_id = User.current().status.connection_id;
      screen_name = params.screen_name;
      var userTimeline = Userstimeline.find({user_timeline_tweets: {$elemMatch: {"screen_name": screen_name}}}, {sort: {createdAt: -1}}).fetch();
      if (userTimeline.length > 0) {
        for (var i = 0; i < userTimeline[0].user_timeline_max_ids.length; i++) {
          var current_max_id = userTimeline[0].user_timeline_max_ids[i];
          if (current_max_id.screen_name === screen_name) {
            tweet_max_id = current_max_id.max_id;
            break;
          }
        }
      }
      if (!tweet_max_id) {
        Meteor.call('Tweet.getUserTimeline', screen_name, access_token_key, access_token_secret, connection_id);
      }
    }
  }

  if (view !== 'Tweet') {
    Sessions.update({_id: Session.get('connection_id')}, {$set:{"coming_tweets_count": 0, "first_load": false}});
  }

  FlowLayout.render('mainLayout', {
    top: "Header",
    main: view,
    bottom: "Footer"
  });
}

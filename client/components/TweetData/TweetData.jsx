/*global Userstimeline, Tweets */
var home_timeline_fetched = false;
var user_timeline_fetched = false;

this.TweetData = new React.createClass({
  mixins: [ReactMeteorData],

  getInitialState() {
    return {
      // TODO have this component grab children's needed fields
      // from their statics object
      fieldsNeeded: {
        tweets: {
          _id: true,
          userId: true,
          twid: true,
          text: true,
          author: true,
          avatar: true,
          createdAt: true,
          screen_name: true,
          retweet_count: true,
          favorite_count: true,
          entities: true,
          original_author: true,
          original_author_screen_name: true,
          original_retweet_count: true,
          original_favorite_count: true,
          original_entities: true
        }
      }
    };
  },

  // track changes in MiniMongo data store and merge with this.state
  // when they change. If new data is sent down from the publication
  // this will still update to keep in sync with this.state
  getMeteorData: function() {
    if (this.props.screen_name) {
      var subscriptUserTimeline = Meteor.subscribe("userstimeline");

      return {
        userTimelineLoading: !subscriptUserTimeline.ready(), // will make this re-run after sub is ready
        userTimeline: Userstimeline.find({user_timeline_tweets: {$elemMatch: {"screen_name": this.props.screen_name}}}, {sort: {createdAt: -1}}).fetch()
      };
    } else {
      var subscriptTweets = Meteor.subscribe("tweet", this.state.fieldsNeeded, this.data.tweetIds);

      return {
        tweetReady: subscriptTweets.ready(), // will make this re-run after sub is ready
        tweetItems: Tweets.find({ userId: Meteor.userId() }, {sort: {createdAt: -1}}).fetch(),
        tweetIds: Tweets.find({ userId: Meteor.userId() }).map(doc => doc._id)
      };
    }
  },


  componentDidMount() {
    var self = this;
    window.onscroll = function(ev) {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        var user_id = User.id(), access_token_key, access_token_secret, connection_id, current_max_id, tweet_max_id,
          screen_name = FlowRouter.getParam("screen_name");
        if (user_id) {
          access_token_key = User.current().services.twitter.accessToken;
          access_token_secret = User.current().services.twitter.accessTokenSecret;
          connection_id = User.current().status.connection_id;
          if (screen_name) {
            if (self.data.userTimeline.length > 0 && self.data.userTimeline[0].user_timeline_max_ids.length > 0) {
              for (var i = 0; i < self.data.userTimeline[0].user_timeline_max_ids.length; i++) {
                current_max_id = self.data.userTimeline[0].user_timeline_max_ids[i];
                if (current_max_id.screen_name === screen_name) {
                  tweet_max_id = current_max_id.max_id;
                  break;
                }
              }
              if (!user_timeline_fetched) {
                user_timeline_fetched = true;
                Meteor.call('Tweet.getUserTimeline', screen_name, access_token_key, access_token_secret, connection_id, tweet_max_id);
                $('.footer').before( "<i class='fa fa-circle-o-notch fa-3x fa-spin tweets-loading'></i>" );
              }
            }
          } else {
            tweet_max_id = self.props.session.tweet_max_id;
            if (!home_timeline_fetched) {
              home_timeline_fetched = true;
              Meteor.call('Tweet.getHomeTimeline', user_id, user_id, access_token_key, access_token_secret, connection_id, tweet_max_id);
              $('.footer').before( "<i class='fa fa-circle-o-notch fa-3x fa-spin tweets-loading'></i>" );
            }
          }
        }
      }
    };
  },

  render() {
    if (this.props.screen_name) {
      if (this.data.userTimelineLoading) {
        if ($('.loading').length > 0) {
          return false;
        } else {
          return (
            <div>
              <img className="loading" src="loading.svg"/>
            </div>
          );
        }
      } else {
        $('.tweets-loading').remove();
        var self = this, tweetItems = [];

        var current_max_id, screen_name = FlowRouter.getParam("screen_name");
        if (screen_name) {
          if (self.data.userTimeline.length > 0 && self.data.userTimeline[0].user_timeline_max_ids.length > 0) {
            for (var i = 0; i < self.data.userTimeline[0].user_timeline_max_ids.length; i++) {
              current_max_id = self.data.userTimeline[0].user_timeline_max_ids[i];
              if (current_max_id.screen_name === screen_name) {
                Session.set(screen_name + 'prev_max_id', current_max_id.max_id);
                break;
              }
            }
          }
        }
        user_timeline_fetched = false;
        if (this.data.userTimeline.length > 0) {
          this.data.userTimeline[0].user_timeline_tweets.map(function(tweetItem, index) {
            if (tweetItem.screen_name === self.props.screen_name) {
              tweetItems.push(tweetItem);
            }
          });
        }
        return (
          <div className='content-main'>
            <TweetList
              tweetItems={tweetItems}
              {...this.props}
              />
          </div>
        )
      }
    } else {
      var newTweetsBarProps = {
        session: this.props.session,
        onClick: this.props.handleClickNewTweetBar
      };
      $('.tweets-loading').remove();
      home_timeline_fetched = false;
      return (
        <div className='content-main'>
          <NewTweetsBar {...newTweetsBarProps} />
          <TweetList
            tweetItems={this.data.tweetItems}
            session={this.props.session}
            {...this.props}
            />
        </div>
      )
    }
  }
});

var Panel = ReactBootstrap.Panel;

this.ProfileCard = React.createClass({
  mixins: [ReactMeteorData],

  getMeteorData: function() {
    var relations, followers, friends, statusesCount, screen_name, profileImageUrl;
    if (this.props.screen_name) {
      var subscriptUserTimeline = Meteor.subscribe("userstimeline");

      return {
        userTimelineLoading: !subscriptUserTimeline.ready(), // will make this re-run after sub is ready
        userTimeline: Userstimeline.find({user_timeline_tweets: {$elemMatch: {"screen_name": this.props.screen_name}}}, {sort: {createdAt: -1}}).fetch()
      };
    } else {
      var subscriptRelations = Meteor.subscribe("relations", null, function() {
        console.log('subscribe relations done.');
      });
      if (Meteor.user() !== null && Meteor.user() !== undefined && Meteor.user().hasOwnProperty('status')) {
        relations = Relations.find({ _id: Meteor.user().status.connection_id}).fetch()[0];
        if (relations && relations.followers && relations.friends) {
          followers = relations.followers.users;
          friends = relations.friends.users;
        }
        statusesCount = User.current().services.twitter.statuses_count;
        screen_name = User.current().services.twitter.screenName;
        profileImageUrl = User.current().services.twitter.profile_image_url;
      }
      return {
        relationsLoading: !subscriptRelations.ready(),
        relations: relations,
        followers: followers,
        friends: friends,
        statusesCount: statusesCount,
        screen_name: screen_name,
        profileImageUrl: profileImageUrl
      };
    }
  },

  render() {
    if (this.props.screen_name) {
      if (this.data.userTimelineLoading) {
        return (<div></div>);
      } else {
        var self = this, tweet, statuses_count, friends_count, followers_count,
          favourites_count, avatar, screen_name;
        if (this.data.userTimeline.length > 0) {
          for (var i = 0; i < this.data.userTimeline[0].user_timeline_tweets.length; i++) {
            tweet = this.data.userTimeline[0].user_timeline_tweets[i];
            if (tweet.screen_name === self.props.screen_name) {
              statuses_count = tweet.statuses_count;
              friends_count = tweet.friends_count;
              followers_count = tweet.followers_count;
              favourites_count = tweet.favorite_count;
              avatar = tweet.self_avatar;
              screen_name = tweet.screen_name;
              break;
            }
          }
        }
        return (
          <Panel className="profile-card">
            <div className="profile-card-background"/>
            <div className="profile-card-content">
              <div className="avatar"><img className="avatar-image" src={avatar}/></div>
              <div className="userFields">
                <div className="user-name"></div>
                <span className="user-screenname">{screen_name}</span>
              </div>
              <div className="stats">
                <ul className="statList Arrange Arrange--bottom Arrange--equal">
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">TWEETS</span>
                    <span className="statValue">{statuses_count}</span>
                  </li>
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">FOLLOWING</span>
                    <span className="statValue">{friends_count}</span>
                  </li>
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">FOLLOWERS</span>
                    <span className="statValue">{followers_count}</span>
                  </li>
                </ul>
              </div>
            </div>
          </Panel>
        )
      }
    } else {
      if (this.data.relationsLoading || !this.data.friends || !this.data.followers) {
        return (
          <div></div>
        );
      } else {
        return (
          <Panel className="profile-card">
            <div className="profile-card-background"/>
            <div className="profile-card-content">
              <div className="avatar"><img className="avatar-image" src={this.data.profileImageUrl}/></div>
              <div className="userFields">
                <div className="user-name"></div>
                <span className="user-screenname">{this.data.screen_name}</span>
              </div>
              <div className="stats">
                <ul className="statList Arrange Arrange--bottom Arrange--equal">
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">TWEETS</span>
                    <span className="statValue">{this.data.statusesCount}</span>
                  </li>
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">FOLLOWING</span>
                    <span className="statValue">{this.data.friends.length}</span>
                  </li>
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">FOLLOWERS</span>
                    <span className="statValue">{this.data.followers.length}</span>
                  </li>
                </ul>
              </div>
            </div>
          </Panel>
        );
      }
    }
  }
});
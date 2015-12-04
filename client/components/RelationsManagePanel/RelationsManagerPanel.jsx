var Panel = ReactBootstrap.Panel;
var Nav = ReactBootstrap.Nav;
var NavItem = ReactBootstrap.NavItem;

this.RelationsManagerPanel = new React.createClass({
  mixins: [ReactMeteorData],

  getMeteorData: function() {
    var relations, followers, friends, statusesCount, screen_name, profileImageUrl;
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
  },

  render() {
    if (this.data.relationsLoading || !this.data.friends || !this.data.followers) {
      return (
        <div></div>
      );
    } else {
      return (
        <div className="relations-manager-panel">
          <ul className="nav nav-tabs manager-panel-tab">
            <li className="active">
              <a  href="#1" data-toggle="tab">Followers</a>
            </li>
            <li>
              <a href="#2" data-toggle="tab">Followings</a>
            </li>
          </ul>

          <div className="tab-content manager-panel-tab-content">
            <div className="tab-pane active" id="1">
              {
                this.data.followers.map(follower => {
                  return <RelationsManagerItem
                    type="follower"
                    key={follower._id}
                    { ...follower }
                    />;
                })
              }
            </div>
            <div className="tab-pane" id="2">
              {
                this.data.friends.map(friend => {
                  return <RelationsManagerItem
                    type="friend"
                    key={friend._id}
                    { ...friend }
                    />;
                })
              }
            </div>
          </div>
        </div>
      );
    }
  }
});
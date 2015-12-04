var Button = ReactBootstrap.Button;

this.RelationsManagerItem = new React.createClass({
  mixins: [ReactMeteorData],

  getMeteorData: function() {
    var connection_id;
    if (Meteor.user() !== null && Meteor.user() !== undefined && Meteor.user().hasOwnProperty('status')) {
      if (Meteor.user().status) {
        connection_id = Meteor.user().status.connection_id;
      }
    }
    return {
      connection_id: connection_id
    };
  },

  render() {
    if (this.props.type === "follower") {
      return (
        <div className="relation-item">
          <div className="avatar"><img className="avatar-image" src={this.props.avatar}/></div>
          <div className="name">
            <a href={'/' + this.props.screen_name}>{this.props.name}</a>
            <div className="screen-name"> @{this.props.screen_name}</div>
          </div>
          <FollowButton screen_name={this.props.screen_name}
                        connection_id={this.data.connection_id}
                        isFollowing={this.props.following}
                        goingToFollow={true}
                        goingToUnfollow={false}>
          </FollowButton>
        </div>
      );
    } else {
      return (
        <div className="relation-item">
          <div className="avatar"><img className="avatar-image" src={this.props.avatar}/></div>
          <div className="name">
            <a href={'/' + this.props.screen_name}>{this.props.name}</a>
            <div className="screen-name"> @{this.props.screen_name}</div>
          </div>
          <FollowButton screen_name={this.props.screen_name}
                        connection_id={this.data.connection_id}
                        isFollowing={this.props.following}
                        goingToFollow={false}
                        goingToUnfollow={true}>
          </FollowButton>
        </div>
      );
    }
  }
});
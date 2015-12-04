var Button = ReactBootstrap.Button;

this.FollowButton = new React.createClass({
  getInitialState() {
    return {
      isFollowing: this.props.isFollowing,
      goingToFollow: this.props.goingToFollow,
      goingToUnfollow: this.props.goingToUnfollow
    }
  },

  onMouseOver() {
    var isFollowing = this.state.isFollowing;

    if (isFollowing) {
      this.setState({
        isFollowing: false,
        goingToFollow: false,
        goingToUnfollow: true
      })
    }
  },

  onMouseOut: function () {
    var goingToUnfollow = this.state.goingToUnfollow;

    if (goingToUnfollow) {
      this.setState({
        isFollowing: true
      })
    }
  },

  handleClick() {
    var goingToFollow = this.state.goingToFollow,
      goingToUnfollow = this.state.goingToUnfollow,
      user_id = User.id(), access_token_key, access_token_secret;
    if (user_id) {
      access_token_key = User.current().services.twitter.accessToken;
      access_token_secret = User.current().services.twitter.accessTokenSecret;
      if(goingToFollow) {
        Meteor.call('User.followUser', user_id, this.props.screen_name, access_token_key, access_token_secret, this.props.connection_id);
        this.setState({
          isFollowing: true,
          goingToFollow: false,
          goingToUnfollow: true
        })
      } else if (goingToUnfollow) {
        Meteor.call('User.unFollowUser', user_id, this.props.screen_name, access_token_key, access_token_secret, this.props.connection_id);
        this.setState({
          isFollowing: false,
          goingToFollow: true,
          goingToUnfollow: false
        })
      }
    }
  },

  render() {
    var isFollowing = this.state.isFollowing,
      goingToFollow = this.state.goingToFollow;
    if (isFollowing) {
      return (
        <Button
          className="relation-button following"
          onClick={this.handleClick}
          onMouseOver={this.onMouseOver}
          onMouseOut={this.onMouseOut}>
          Following
        </Button>
      );
    } else {
      if (goingToFollow) {
        return (
          <Button
            className="relation-button"
            bsStyle="default"
            onClick={this.handleClick}
            onMouseOver={this.onMouseOver}
            onMouseOut={this.onMouseOut}>
            Follow
          </Button>
        );
      } else {
        return (
          <Button
            className="relation-button"
            bsStyle="danger"
            onClick={this.handleClick}
            onMouseOver={this.onMouseOver}
            onMouseOut={this.onMouseOut}>
            Unfollow
          </Button>
        );
      }
    }
  }
});
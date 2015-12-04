/*global Tweet, User */

this.TweetItemFooter = new React.createClass({
  fieldsNeeded: {
    likeCount: 1,
    commentCount: 1
  },

  // *note* doesn't check for mult. like by same person on the backend
  likePost(e) {
    e.preventDefault();
    if (User.loggedOut()) return alert("You must be logged in to like!");
    Post.like(this.props._id);
  },

  render() {
    return (
      <div className="tweet-item__footer">
        <span className='by-people'>
          <i className="fa fa-retweet fa-lg retweet-icon">{this.props.retweet_count}</i>
        </span>

        <span className='by-people'>
          <i className="fa fa-star fa-lg favorite-icon">{this.props.favorite_count}</i>
        </span>
      </div>
    );
  }
});

/*global TweetItem */

this.TweetList = new React.createClass({
  // TODO break out more button into comp
  shouldComponentUpdate: function(nextProps, nextState) {
    if (nextProps.session !== undefined) {
      if (nextProps.session.first_load) {
        return true;
      } else {
          return nextProps.session.coming_tweets_count === 0;
      }
    } else {
      return true;
    }
  },

  render() {
    console.log("[TweetList] Rendering");
    return (
      <div className='home-stream'>
        {
          this.props.tweetItems.map(doc => {
            return <TweetItem key={doc._id}
              { ...doc }
              onClick={ ()=> this.setState({ open: !this.state.open })}
              destroyTweet={ doc.destroy }
              />;
          })
        }
      </div>
    );
  }
});

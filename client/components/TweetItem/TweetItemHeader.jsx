var SetIntervalMixin = React.addons.SetIntervalMixin;

this.TweetItemHeader = new React.createClass({
  mixins: [SetIntervalMixin],

  fieldsNeeded: {
    userName: 1,
    createdAt: 1
  },

  getInitialState: function() {
    return {minute: 0};
  },

  componentWillMount: function() {
    this.intervals = [];
  },

  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },

  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  },

  componentDidMount: function() {
    this.setInterval(this.tick, 60000); // Call a method on the mixin
  },

  tick: function() {
    this.setState({minute: this.state.minute + 1});
  },

  render() {
    if (this.props.original_author_screen_name === null) {
      return (
        <div className="tweet-item__header">
          <div className="avatar"><img className="avatar-image" src={this.props.avatar}/></div>
          <div className="name">
            <a href={'/' + this.props.screen_name}>{this.props.author}</a>
            <div className="screen-name"> @{this.props.screen_name}</div>
          </div>
          <div className="date">{this.formattedDate()}</div>
          { this.renderDeleteButton() }
        </div>
      )
    } else {
      return (
        <div className="tweet-item__header">
          <div className='retweet-mark'><i className="fa fa-retweet retweet-sign"></i>
            <a href={'/' + this.props.screen_name}>{this.props.author}</a> retweeted
          </div>
          <div className="avatar">
            <img className="avatar-image" src={this.props.avatar}/>
          </div>
          <div className="name">
            <a href={'/' + this.props.original_author_screen_name}>{this.props.original_author}</a>
            <div className="screen-name"> @{this.props.original_author_screen_name}</div>
          </div>
          <div className="date">{this.formattedDate()}</div>
          { this.renderDeleteButton() }
        </div>
      );
    }
  },

  // even if client can render this on all buttons, server will deny bad deletes
  renderDeleteButton() {
    if (this.props.ownerId === User.id()) {
      return (
        <div className="destroy" onClick={ this.destroyTweet }>
          Delete Tweet
        </div>
      );
    }
  },

  destroyTweet() {
    this.props.destroyTweet();
  },

  formattedDate() {
    var time = moment.unix(this.props.createdAt).fromNow();
    return time;
  }
});

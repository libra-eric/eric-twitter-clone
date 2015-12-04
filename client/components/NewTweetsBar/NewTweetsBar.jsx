var Collapse = ReactBootstrap.Collapse;
var Well = ReactBootstrap.Well;

this.NewTweetsBar = new React.createClass({
  getInitialState() {
    return {
      open: true,
      timeout: 1200,
      unmountOnExit: true,
      transitionAppear: true
    };
  },

  render() {
    if (!User.loggedIn() || this.props.session.coming_tweets_count === 0) {
      return (
        <div className='stream-item'>
        </div>
      );
    } else {
      return (
        <Collapse className='stream-item'
                  in={this.state.open}
                  timeout={this.state.timeout}
                  unmountOnExit={this.state.unmountOnExit}
                  transitionAppear={this.state.transitionAppear}>
          <Well className='new-tweets-bar' onClick={this.props.onClick}>
            <span className='new-tweets-notification'>View {this.props.session.coming_tweets_count} new Tweet</span>
          </Well>
        </Collapse>
      )
    }
  }
});
this.SessionData = new React.createClass({
  mixins: [ReactMeteorData],

  getMeteorData: function() {
    var session;
    var subscriptSessions = Meteor.subscribe("session", null, function() {
      console.log('subscribe session done.');
    });
    if (Meteor.user() !== null && Meteor.user() !== undefined && Meteor.user().hasOwnProperty('status')) {
      if (Meteor.user().status) {
        session = Sessions.find({ _id: Meteor.user().status.connection_id}).fetch()[0];
        Session.set('connection_id', Meteor.user().status.connection_id);
      }
    } else {
      session = Sessions.find({}).fetch()[0];
    }
    return {
      sessionLoading: !subscriptSessions.ready(),
      session: session
    };
  },

  _handleClickNewTweetBar: function() {
    Sessions.update({_id: this.data.session._id}, {$set:{"coming_tweets_count": 0, "first_load": false}});
    var newSession = this.data.session;
    newSession.first_load = false;
    newSession.coming_tweets_count = 0;
    this.setProps({session: newSession});
  },

  componentDidMount() {
    var div = document.getElementById('loginContainer');
    $(div).show();
  },

  render() {
    if (this.data.sessionLoading) {
      return (
        <div></div>
      );
    } else {
      return (
        <div className='session-data'>
          <TweetData session={this.data.session}
                     handleClickNewTweetBar={this._handleClickNewTweetBar}/>
        </div>
      )
    }
  }
});

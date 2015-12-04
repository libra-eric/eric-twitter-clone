/*global FlowRouter, FlowLayout */

this.PersonalPage = new React.createClass({

  render() {
    var screen_name = FlowRouter.getParam("screen_name");
    return (
      <div className="feed">
        <div className="container">

          <div className="col-25">
            <ProfileCard screen_name={screen_name}/>
          </div>

          <div className="col-50">
            <TweetData screen_name={screen_name}/>
          </div>

          <div className="col-25">
          </div>

        </div>
      </div>
    )
  }
});
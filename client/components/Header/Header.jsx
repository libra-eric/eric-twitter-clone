/*global Blaze */
this.Header = new React.createClass({

  getInitialState() {
    return {open: false};
  },

  handleMouseDown() {
    this.setState({open: !this.state.open});
  },

  backToTop() {
    $('html,body').animate({
      scrollTop: 0
    }, 400);
  },

  componentDidMount() {
    // insert Blaze login buttons, see this if you do this a lot
    // https://gist.github.com/emdagon/944472f39b58875045b6
    var div = document.getElementById('loginContainer');
    Blaze.renderWithData(Template.loginButtons, {align: 'right'}, div);
    if (!User.loggedIn()) {
      $(div).hide();
    }
  },

  render() {
    return (
      <div className="header">
        <div className="container">
          <div className="logo">
            <img src="icons/twitter-32-white.png"
              onClick={this.backToTop}/>
          </div>
          <div className="nav">
            <i className="fa fa-home fa-lg home-icon"></i><a href="/">Home</a>
            <div id="loginContainer" />
          </div>
        </div>
        <br />
      </div>
    );
  }
});

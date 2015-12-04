/*global
 TweetItemHeader,
 TweetItemFooter
 */
var Panel = ReactBootstrap.Panel;
var Collapse = ReactBootstrap.Collapse;
var Well = ReactBootstrap.Well;

this.TweetItem = new React.createClass({
  getInitialState() {
    return {
      open: false
    };
  },

  convertHashTags(originalText, convertedText, hashtags) {
    hashtags.map(function(hashtag, index) {
      var hashTagString =
        "<span class='hashtag'>#" + hashtag.text + "</span>";
      convertedText = convertedText.replace('#' + hashtag.text, hashTagString);
    });
    return convertedText;
  },

  convertUserMentions(originalText, convertedText, user_mentions) {
    user_mentions.map(function(user_mention, index) {
      var currentUserMention = originalText.substring(user_mention.indices[0], user_mention.indices[1]);
      convertedText = convertedText.replace(currentUserMention, '@' + user_mention.screen_name);

      var userMentionString =
        "<span class='user_mention'>@</span><a href='/" + user_mention.screen_name + "' class='user_mention'>" + user_mention.screen_name + "</a>";
      convertedText = convertedText.replace('@' + user_mention.screen_name, userMentionString);
    });
    return convertedText;
  },

  convertUrls(originalText, convertedText, urls) {
    urls.map(function(url, index) {
      var currentUrl = originalText.substring(url.indices[0], url.indices[1]);
      convertedText = convertedText.replace(currentUrl, url.url);

      var urlString =
        "<a href=\"javascript:\" onclick=\"window.open('" + url.url + "');\" target=\"_blank\"" +
        " data-expanded-url=" + url.expanded_url +
        "><span class='invisible'>http://</span>" +
        "<span class='js-display-url'>" + url.display_url + "</span></a>";
      convertedText = convertedText.replace(url.url, urlString);
    });
    return convertedText;
  },

  convertMedias(originalText, convertedText, medias) {
    var expand = this.state.open;
    medias.map(function(media, index) {
      var currentMedia = originalText.substring(media.indices[0], media.indices[1]);
      var mediaString = "";
      if (expand) {
        mediaString = "<div class=\"media-thumbnail-expanded\"><img class=\"media\" src=\"" + media.media_url + "\" /></div>";
      } else {
        mediaString = "<div class=\"media-thumbnail\"><img class=\"media\" src=\"" + media.media_url + "\" /></div>";
      }
      convertedText = convertedText.replace(currentMedia, mediaString);
    });
    return convertedText;
  },

  createMarkup(string) {
    return {__html: string};
  },

  expandTweet() {
    this.setState({ open: !this.state.open });
  },

  render() {
    //console.log("[TweetItem] rendering");
    var originalText = this.props.text;
    var convertedText = originalText;
    var entities = this.props.entities;
    var hashtags = entities.hashtags;
    var user_mentions = entities.user_mentions;
    var urls = entities.urls;
    var retweet_count, favorite_count;
    if (urls.length > 0) {
      convertedText = this.convertUrls(originalText, convertedText, urls);
    }
    if (hashtags.length > 0) {
      convertedText = this.convertHashTags(originalText, convertedText, hashtags);
    }
    if (user_mentions.length > 0) {
      convertedText = this.convertUserMentions(originalText, convertedText, user_mentions);
    }

    if (entities.hasOwnProperty('media')) {
      var medias = entities.media;
      convertedText = this.convertMedias(originalText, convertedText, medias);
    }
    retweet_count = this.props.retweet_count ? this.props.retweet_count : 0;
    favorite_count = this.props.favorite_count ? this.props.favorite_count : 0;

    return (
      <Panel className='tweet-item' onClick={this.expandTweet}>
        <TweetItemHeader {...this.props} />

        <div className='feed-item-desc'
          dangerouslySetInnerHTML={this.createMarkup(convertedText)}
        />
        <Collapse in={this.state.open}>
          <div>
            <Well>

              <div className="stats">
                <ul className="statList Arrange Arrange--bottom Arrange--equal">
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">RETWEETS</span>
                    <span className="statValue">{retweet_count}</span>
                  </li>
                  <li className="stat Arrange--sizeFit">
                    <span className="statLabel">FAVORITE</span>
                    <span className="statValue">{favorite_count}</span>
                  </li>
                </ul>
              </div>
              <div className='create-time'>{moment.unix(this.props.createdAt).format("h:mm a - Do MMMM YYYY")}</div>
            </Well>
          </div>
        </Collapse>
        <TweetItemFooter {...this.props} />
      </Panel>
    );
  }

});

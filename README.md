# VideoSWS – HTML5 Video Player Comparison

## What is VideoSWS

We’ll help you choosing the best HTML5 based video player for your next project. See the comparison chart online: [praegnanz.de/html5video](http://praegnanz.de/html5video/)

## How to contribute

Dear video player maker! You can help us keeping this comparison up to date. Just clone this repository, add your player with all necessary folders and files and send a pull request. After some automated tests, we’ll double-check your contribution manually and then update the website.

## Step by step

1. Clone the repository
2. Create a fresh project folder with a web-friendly name in the root directory (no spaces, lowercase, no special chars)
3. Two files are needed in the project folder:
  - `index.html` (contains only the core HTML code for your player – no header, footer, CSS or JS files)
  - `playerinfo.json` (contains all meta data for your player – see documentation below)
4. Additionally, put all files and subfolders into your project folder that are needed for displaying your player.
5. Send a pull request to us!

---------------------

## Your `index.html` file

Contains only the core HTML code for your player. Might contain the `video`-Element, but some players only use a wrapper-DIV and do the rest via JS. Here’s a typical example:

```html
<div class="ponyplayer_wrapper">
	<video id="my_player" poster="{{player.poster}}" controls="controls" preload="none">
	    <source type="video/mp4" src="{{player.video.mp4}}" />
	    <source type="video/webm" src="{{player.video.webm}}" />
	    <track kind="subtitles" src="{{player.subtitles.srt}}" srclang="en" />
	</video>
</div>

<script>
  $(function(){
    $('.ponyplayer_wrapper > video').ponyplayerinit({ awesome: true });
  });
</script>
```

You have to use placeholders for all content files. **Don’t use your own video!**

### Available placeholders

- `{{player.directory}}` – URL to player folder (contains trailing slash)
- `{{player.poster}}` – URL to video poster (JPG, PNG or other)
- `{{player.video.mp4}}`– URL to video (MP4)
- `{{player.video.ogv}}`– URL to video (OGG Video)
- `{{player.video.webm}}`– URL to video (WebM)
- `{{player.video.hls}}`– URL to video stream (HLS)
- `{{player.video.dash}}`– URL to video stream (Dash)
- `{{player.chapters.srt}}`– URL to chapters file (srt)
- `{{player.subtitles.en.srt}}`– URL to subtitles file (english, .srt format)
- `{{player.subtitles.de.srt}}`– URL to subtitles file (german, .srt format)
- `{{player.subtitles.it.srt}}`– URL to subtitles file (italian, .srt format)
- `{{player.subtitles.en.sbv}}`– URL to subtitles file (english, .sbv format)
- `{{player.subtitles.de.sbv}}`– URL to subtitles file (german, .sbv format)
- `{{player.subtitles.it.sbv}}`– URL to subtitles file (italian, .sbv format)
- `{{player.subtitles.en.sub}}`– URL to subtitles file (english, .sub format)
- `{{player.subtitles.de.sub}}`– URL to subtitles file (german, .sub format)
- `{{player.subtitles.it.sub}}`– URL to subtitles file (italian, .sub format)
- `{{player.subtitles.en.vtt}}`– URL to subtitles file (english, .vtt format)
- `{{player.subtitles.de.vtt}}`– URL to subtitles file (german, .vtt format)
- `{{player.subtitles.it.vtt}}`– URL to subtitles file (italian, .vtt format)


---------

## Your `playerinfo.json` file

**Please note:** All external URLs are required to start with either `http://` or `https://`. Also, we’ll do a HEAD request to check whether your site returns the required `200 OK` status. We only do this to detect offline or moved sites.

---------

### Required parameters

#### `name` (string)
Your player’s name, has to be 64 characters long or less.

#### `version` (string)
Player version you used in your example files. Has to be 32 characters long or less.

#### `url` (string)
Website URL (marketing website)

#### `description` (string)
Player description, max. 1024 characters.

#### `pricing.once` (boolean)
true, if one-time fee required to use player.

#### `pricing.subscription` (boolean)
true, if paid subscription is required to use player.

#### `pricing.freeAvailable` (boolean)
true, if there’s also a free version available. Only required if `pricing.once == true` or `pricing.subscription == true`.

#### `license` (string)
Your player’s license. You can use one of the licenses below or a URL to enter custom licenses. Create a github issue to add other liceses which are not written by yourself.

- apache
- bsd2
- bsd3
- cddl
- epl
- gnugpl
- lgpl
- mit
- mpl

#### `library` (string|string[])
Library / libraries your player needs to run. If your player doesn’t require any libraries, place an empty array: `[]` Create an issue to add other libraries. Available libraries are below.

- jquery
- mootools
- react

#### `hosted` (boolean|string)
One of the following values:

- __true__: it’s not allowed/possible to host the player by yourself, you have to use the CDN provided
- __"possible"__: it’s allowed to host the player by yourself or use the CDN provided
- __false__: there’s no offical CDN, you have to host the player by yourself

---------

### Optional parameters

#### `repository` (string)
URL for your source code repository (example: `https://github.com/praegnanz.de/awesome-player`).

#### `deprecated` (boolean)
Set this to true, to mark player as deprecated.

---------

### HTML/CSS/JS document parameters (all optional)

#### `example.html` (string)
Name of your example HTML, defaults to `index.html`.

#### `example.css` (string|string[])
We’ll add a &lt;link&gt; element in our &lt;head&gt; for every local CSS file (or URL) you defined here.

#### `example.jsHead` (string|string[])
We’ll add a &lt;script&gt; element in our &lt;head&gt; for every local JS file (or URL) you defined here.

#### `example.jsFoot` (string|string[])
We’ll add a &lt;script&gt; element before &lt;/body&gt; for every local JS file (or URL) you defined here.


---------

### Flag parameters (all optional)


---------

### Flag parameters (all optional)

#### `flags.flash` (boolean)
True, if your player provides a flash version.

#### `flags.api` (boolean)
True, if your player provides an API.

#### `flags.unifiedAPI` (boolean)
True, if your player provides an API, wich works for both &lt;video&gt; and the flash fallback.

#### `flags.unifiedLook` (boolean)
True, if your player’s flash fallback and the native video player looks the same.

#### `flags.fullscreen` (boolean)
True, if your player has native fullscreen support.

#### `flags.keyboard` (boolean)
True, if your player is accessable via keyboard.

#### `flags.subtitles` (boolean)
True, if your player has subtitles support.

#### `flags.playlists` (boolean)
True, if your player supports playlists.

#### `flags.responsive` (boolean)
True, if your player is responsive.

#### `flags.embeddable` (boolean)
True, if your player provides an “embed this video” functionality.

#### `flags.cms` (string|string[])
Content Management Systems, your player provides plugins for. Available CMS are below. Create an issue to add an additional CMS.

- contao
- drupal
- joomla
- kirby
- processwire
- typo3
- wordpress

#### `flags.services` (string|string[])
Services / Platforms, your player has special support for. Available services are below. Create an issue to add an additional service.

- dailymotion
- vimeo
- youtube

#### `flags.skinnable` (boolean)
True, if player is skinnable in a easy way or themes are provided.

#### `flags.audioOnly` (boolean)
True, if player has an audio only mode to display audio in a beautiful way.

#### `flags.speedControl` (boolean)
True, if player has the option to change playback speed (1&times;, 2&times;, …).

#### `flags.qualityControl` (boolean)
True, if player has the option to change video quality (480p, 720p, …).

#### `flags.aria` (boolean)
True, if player has WAI-ARIA attributes.

#### `flags.hls` (boolean)
True, if player supports HTTP Live Streaming.

#### `flags.dash` (boolean)
True, if player supports Dynamic Adaptive Streaming over HTTP.


-------------

### Example JSON

```json
{
  "name": "Little Pony Player",
  "version": "1.2.66beta",
  "url": "http://www.littleponyplayer.com/",
  "description": "The bestest player in town, because it makes everything colorful!",
  "repository": "https://github.com/ponymasters2000/littleponyplayer",
  "license": "gnugpl",
  "pricing": {
    "once": true,
    "subscription": false,
    "freeAvailable": true
  },

  "library": "jquery",
  "hosted": false,

  "example": {
    "css": ["css/ponybase.css", "css/ponytheme_a.css"],
    "jsHead": ["libs/jquery-1.9.1.min.js", "pony-script.min.js"]
  },

  "flags": {
    "flash": true,
<<<<<<< 0fedf76f1b1d43eccdf86a4b57ab920480ddbd84
    "services": "youtube",
=======
    "services": ["youtube"],
>>>>>>> Readme Update
    "unifiedLook": true,
    "api": true,
    "unifiedAPI": true,
    "responsive": false,
    "skinnable": true,
    "embeddable": false,
    "audioOnly": true,
<<<<<<< 0fedf76f1b1d43eccdf86a4b57ab920480ddbd84
    "cms": ["wordpress", "joomla"],
=======
    "cms": ["wordpress"],
>>>>>>> Readme Update
    "fullscreen": true,
    "keyboard": false,
    "aria": false,
    "subtitles": true,
    "playlists": true,
    "speedControl": false,
    "qualityControl": true,
    "hls": false,
    "dash": false
  }
}
```
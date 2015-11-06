# playerinfo.json

## Notes

### URLs
All URLs are required to start with either `http://` or `https://`. Also, we'll do a HEAD request to check, if your 
site returns the required `200 OK` status. We only do this to detect offline or moved sites.



## Attributes


### name (string, required)
Your player's name, has to be 64 characters long or less.


### version (string, required)
Player version you used in your example files. Has to be 32 characters long or less.


### url (string, required)
Player URL


### description (string, required)
Player description, has to be 1024 characters long or shorter.


### repository (string)
URL for your source code repository (example: `https://github.com/praegnanz.de/awesome-player`).


### license (string)
Your player's license. You can use one of the licenses below or a URL to enter custom licenses. Create an issue to add
other liceses which are not written by yourself.

#### Available licenses
- apache
- bsd2
- bsd3
- cddl
- epl
- gnugpl
- lgpl
- mit
- mpl


### pricing.once (boolean, required)
True, if one-time fee required to use player.

### pricing.subscription (boolean, required)
True, if paid subscription is required to use player.

### pricing.freeAvailable (boolean, sometimes required)
True, if there's also a free version available. Only required if `pricing.once = true` or `pricing.subscription = true`.


### example.html (string)
Name of your example html, defaults to `index.html`.

### example.jsHead (string|string[])
We'll add a &lt;script&gt; tag in our &lt;head&gt; for every local file or url you defined here.

### example.jsFoot (string|string[])
We'll add a &lt;script&gt; tag before &lt;/body&gt; for every local file or url you defined here.


### flags.library (string|string[])
Library / libraries your player needs to run. Create an issue to add other libraries.

#### Available libraries
- jquery
- mootools
- react

### flags.flash (boolean)
True, if your player provides a flash version.

### flags.api (boolean)
True, if your player provides an API.

### flags.unifiedAPI (boolean)
True, if your player provides an API, wich works for both &lt;video&gt; and the flash fallback.

### flags.unifiedLook (boolean)
True, if your player's flash fallback and the native video player looks the same.

### flags.fullscreen (boolean)
True, if your player has native fullscreen support.

### flags.keyboard (boolean)
True, if your player is accessable via keyboard.

### flags.subtitles (boolean)
True, if your player has subtitles support.

### flags.playlists (boolean)
True, if your player supports playlists.

### flags.responsive (boolean)
True, if your player is responsive.

### flags.embeddable
True, if your player provides an 'embed this video' functionality.

### flags.cms (string|string[])
Content management systems, your player provides plugins for.

#### Available CMS
- contao
- drupal
- joomla
- kirby
- processwire
- typo3
- wordpress

### flags.services (string|string[])
Services / Platforms, your player has special support for.

#### Available services
- dailymotion
- vimeo
- youtube

### flags.skinnable (boolean)
True, if player is skinnable in a easy way or themes are provided.

### flags.audioOnly (boolean)
True, if player has an audio only mode to display audio in a beautiful way.

### flags.speedControl (boolean)
True, if player has the option to change playback speed (1x, 2x, etc.).

### flags.qualityControl (boolean)
True, if player has the option to change video quality (480p, 720p, etc.).

### flags.hosted (boolean|string, required)
One of the following values

#### Available values for flags.hosted
- __true__: it's not allowed/possible to host the player by yourself, you have to use the CDN provided
- __"possible"__: it's allowed to host the player by yourself or use the CDN provided
- __false__: there's no offical CDN, you have to host the player by yourself

### flags.aria (boolean)
True, if player has WAI-ARIA attributes

### flags.hls (boolean)
True, if player supports HTTP Live Streaming.

### flags.dash (boolean)
True, if player supports Dynamic Adaptive Streaming over HTTP.



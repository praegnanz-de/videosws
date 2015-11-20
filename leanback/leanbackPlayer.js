/*
This Software is part of HTML5 Video Player [LeanBack Player] by Ronny Mennerich
Copyright (c) 2010 Ronny Mennerich <2010-11-09> <ronny@mennerich.name>

The Software and therefore the included functionality is distributed in the hope
that it will be useful for you.

The use of this Software is free for private, you can redistribute in
your private project(s) it and/or modify it to your needs.
For commercial use, at this time, you need the permission of the author!

The above copyright and permission notices shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/
// CLASS-Definition
var LBPlayer = function(o, v) {
	/*-----------------------*/
	// Default Options
    this.options = {
	};
	LBPlayer.mergeObjs(this.options, o);
	/*-----------------------*/
	// Global Variables
	this.vars = {
		autoplay: false,
		hasControls: false,
		proc: null,				// process-var
		loaded: 0,
		fullscreen: false,
		subProc: null,
		hideSubtitle: true,
		subs: new Array(),
		activeSub: null,
		activeSubId: -1,
		activeSubLang: this.options.language,
		poster: null,
		showControls: false,
		keyHolderCRTL: false,
		keyHolderTAB: false,
		waitingBar: 1,
		// Browser & Device Checks
		isIE: ((navigator.userAgent.toLowerCase().indexOf('msie') > -1) ? true : false),
		isChrome: ((navigator.userAgent.toLowerCase().indexOf('chrome') > -1) ? true : false),
		isOpera: ((navigator.userAgent.toLowerCase().indexOf('opera') > -1) ? true : false),
		isSafari: ((navigator.userAgent.toLowerCase().indexOf('safari') > -1) ? true : false),
	};
	LBPlayer.mergeObjs(this.vars, v);
	/*-----------------------*/
	// Video-Object
	this.vObj = LBPlayer.$(this.options.vid);
	/*-----------------------*/
	// preloading data - force minimum metadata
	if(this.vObj.preload === "none") {this.vObj.preload = "metadata";}
	/*-----------------------*/
	// function - init video
	this.initializeVideo(true);
};
// function - initialize video
LBPlayer.prototype.initializeVideo = function(i) {
	// fix iPad information
	if(i && LBPlayer.isIPad()) {
		this.vObj.play(); this.vObj.pause();
	}
	// Hide default video-controls
	if(i && !this.options.useStandardControls && !LBPlayer.isIPad()) {
		// hide standard controls
		this.vObj.controls = false;
	}
	/*-----------------------*/
	// readyState IDL: 0=HAVE_NOTHING, 1=HAVE_METADATA (loadedmetadata event), 2=HAVE_CURRENT_DATA (loadeddata event), 3=HAVE_FUTURE_DATA (canplay event), 4=HAVE_ENOUGH_DATA (canplaythrough event)
	// Wait until video is ready
	if(this.vObj.readyState === 0 || isNaN(this.vObj.duration)) {var self = this; this.vars.proc = window.setTimeout(function() {self.initializeVideo(false);}, 1050); }
	else {
		// on autoplay focus current video
		if(this.vObj.autoplay && LBPlayer.videoFocused === null) {this.vObj.pause(); this.vObj.autoplay = false; this.vars.autoplay = true;} else {this.vObj.pause(); this.vObj.autoplay = false;}
		// clean up
		window.clearTimeout(this.vars.proc); this.vars.proc = null;
		// now initialize player
		this.initializePlayer();
		return;
	}
};
// function - support older browsers that used "autobuffer" and not recognize "preload" on video-tag  (Firefox, ??)
LBPlayer.prototype.fixBuffering = function(){
    if (typeof this.vObj.hasAttribute == "function" && !this.vObj.hasAttribute("preload")) {
		this.vObj.autobuffer = this.options.vBuffer;	// Firefox goes here
    }
};
// function - initialize player
LBPlayer.prototype.initializePlayer = function() {
	var vid = this.options.vid;
	var pid = (LBPlayer.$(this.options.vid).parentNode).id;
	// add css class to video element and video parent
	LBPlayer.mergeObjs(LBPlayer.$(pid), {className: "h5_lb_player h5_lb_smallscreen h5_lb_unfocused"});
	LBPlayer.mergeObjs(LBPlayer.$(vid), {className: "h5_lb_video"});
	// function - resize and set video
	this.resizeVideo();
	// function - get subtitles
	if(this.options.showSubtitle) {this.getSubs();}
	// function - add controls
	this.addControls();
	// (fix) Buffering/Preloading video-source
	this.fixBuffering();
	/** Global Events */
	window.onresize = function() {if(LBPlayer.videoFocused !== null) { var vid = LBPlayer.videoFocused.id; var o = LBPlayer.getObj(LBPlayers, vid); if(LBPlayer.$(vid).focused && o){ o.setScreen(o.vars.fullscreen); }}};
	// do something on key down, if video-object has focus
	document.onkeydown = function(e) {
		if(LBPlayer.videoFocused !== null) {
			try {
				var vid = LBPlayer.videoFocused.id;
				var o = LBPlayer.getObj(LBPlayers, vid);
				if(LBPlayer.$(vid).focused && o) { o.setControlsTask(); o.onKeydown(e); }
			} catch(ex) { /*do nothing*/ }
			return LBPlayer.onKeyAction;
		}
	};
	// do something on key up
	document.onkeyup = function(e) {
		if(LBPlayer.videoFocused !== null) {
			try {
				var vid = LBPlayer.videoFocused.id;
				var o = LBPlayer.getObj(LBPlayers, vid);
				if(LBPlayer.$(vid).focused && o) { o.setControlsTask(); o.onKeyup(e); }
			} catch(ex) { /*do nothing*/ }
		}
		var ev = (e || window.event); ev = (ev.target || ev.srcElement);
		if(!LBPlayer.isVideoEvent && ev.getAttribute("id") !== null && ev.getAttribute("id").indexOf("h5v_id") !== -1) {
			if(LBPlayer.videoFocused !== null) {
				var ovid = LBPlayer.videoFocused.id;
				var o = LBPlayer.getObj(LBPlayers, ovid);
				if(o.vars.keyHolderTAB) {
					// blur old video element
					LBPlayer.focusVideo(false, ovid);
					o.vars.keyHolderTAB = false;
				}
			}
			// focus new video element
			var vid = (ev.getAttribute("id")).substr(0, 7);
			LBPlayer.focusVideo(true, vid);
		} else if(!LBPlayer.isVideoEvent) {
			if(LBPlayer.videoFocused !== null) {
				var vid = LBPlayer.videoFocused.id;
				var o = LBPlayer.getObj(LBPlayers, vid);
				if(o.vars.keyHolderTAB) {
					//blur old video element
					LBPlayer.focusVideo(false, vid);
					o.vars.keyHolderTAB = false;
				}
				LBPlayer.isVideoEvent = false;
			}
		}
		if(LBPlayer.videoFocused !== null) {
			return LBPlayer.onKeyAction;
		}
	};
	// do something on key press
	document.onkeypress = function(e) {
		if(LBPlayer.videoFocused !== null) {
			return LBPlayer.onKeyAction;
		}
	};
	// set focus to element
	document.onmousedown = function (e) {
		var e = (e || window.event); e = (e.target || e.srcElement);
		var vid = ((e.getAttribute("id") !== null) ? e.getAttribute("id") : null);
		if(vid === null && (e.parentNode).hasOwnProperty("id")) { vid = (e.parentNode).getAttribute("id"); }
		if(vid !== null && vid.indexOf("h5v_id") !== -1) {
			if(LBPlayer.videoFocused !== null) {
				var ovid = LBPlayer.videoFocused.id;
				var vid = vid.substr(0, 7);
				if(ovid !== vid) {
					// blur old video element
					LBPlayer.focusVideo(false, ovid);
					// focus new video element				
					LBPlayer.focusVideo(true, vid);
				}
			} else {
				// focus new video element
				var vid = vid.substr(0, 7);
				LBPlayer.focusVideo(true, vid);
			}
		} else {
			if(LBPlayer.videoFocused !== null) {
				// blur old video element
				var vid = LBPlayer.videoFocused.id;
				LBPlayer.focusVideo(false, vid);
			}
		}
	};
};
// function - resize and set video
LBPlayer.prototype.resizeVideo = function() {
	var vid = this.options.vid;
	this.vObj.height = this.vObj.videoHeight; this.vObj.width = this.vObj.videoWidth;
	LBPlayer.$(vid).style.height = parseInt(this.vObj.height, 10)+"px"; LBPlayer.$(vid).style.width = parseInt(this.vObj.width, 10)+"px";
	(LBPlayer.$(vid).parentNode).style.height = this.vObj.offsetHeight+"px"; (LBPlayer.$(vid).parentNode).style.width = this.vObj.offsetWidth+"px";
};
// function - add controls
LBPlayer.prototype.addControls = function() {
	var vid = this.options.vid;
	var self = this;
	// create controls
	if(!this.vars.hasControls) {
		var pid = (LBPlayer.$(this.options.vid).parentNode).id;
		// if poster, create img element for it
		if(this.vObj.poster) {this.vars.poster = LBPlayer.createHTMLEl(pid, "img", {id: this.options.vid+"_poster", className: "poster", src: this.vObj.poster}); this.setPoster();}
		// create embedding element
		LBPlayer.createHTMLEl(pid, "div", {id: vid+"_embed", className: "h5_lb_embed"});
		LBPlayer.createHTMLEl(vid+"_embed", "span", {id: vid+"_embed_info", className: "h5_lb_embed_inner", innerHTML: LBPlayer.Lang.EmbedInfo, title: LBPlayer.Lang.EmbedInfoTitle});
		LBPlayer.createHTMLEl(pid, "div", {id: vid+"_embed_code", className: "h5_lb_embed_code"});
		LBPlayer.createHTMLEl(vid+"_embed_code", "textarea", {id: vid+"_embed_code_user", className: "h5_lb_embed_code_user"});
		LBPlayer.createHTMLEl(vid+"_embed_code", "div", {id: vid+"_embed_code_txt", className: "h5_lb_embed_code_txt", innerHTML: LBPlayer.Lang.EmbedCodeTxt});
		LBPlayer.createHTMLEl(vid+"_embed_code", "button", {id: vid+"_embed_code_btn", className: "h5_lb_embed_code_btn", onclick: function() {LBPlayer.hideEl(vid+"_embed_code");}, innerHTML: LBPlayer.Lang.EmbedBtn, title: LBPlayer.Lang.EmbedBtn});
		// add events to embedding element
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_embed"), {onmousemove: function() {
			clearInterval(self.vars.embedTimeout);
			if(LBPlayer.$(vid+"_embed_video") === null) {
				while (LBPlayer.$(vid+"_embed").hasChildNodes()) { LBPlayer.$(vid+"_embed").removeChild(LBPlayer.$(vid+"_embed").firstChild); }
				LBPlayer.createHTMLEl(vid+"_embed", "div", {id: vid+"_embed_video", className: "h5_lb_embed_inner", onclick: function() {self.createEmbedCode("video");}, innerHTML: LBPlayer.Lang.EmbedVideo, title: LBPlayer.Lang.EmbedVideoTitle});
				LBPlayer.createHTMLEl(vid+"_embed", "div", {id: vid+"_embed_url", className: "h5_lb_embed_inner", onclick: function() {self.createEmbedCode("url");}, innerHTML: LBPlayer.Lang.EmbedURL, title: LBPlayer.Lang.EmbedURLTitle});
			}}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_embed"), {onmouseout: function() {
				self.vars.embedTimeout = setInterval(function(){
					while (LBPlayer.$(vid+"_embed").hasChildNodes()) { LBPlayer.$(vid+"_embed").removeChild(LBPlayer.$(vid+"_embed").firstChild); }
					LBPlayer.createHTMLEl(vid+"_embed", "span", {id: vid+"_embed_info", className: "h5_lb_embed_inner", innerHTML: LBPlayer.Lang.EmbedInfo, title: LBPlayer.Lang.EmbedInfoTitle});
					clearInterval(self.vars.embedTimeout);
				}, 2000);
			}});
		// create controls parent
		LBPlayer.createHTMLEl(pid, "div", {id: vid+"_controls", className: "h5_lb_controls"});
		// create play-button
		LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_play_control", className: "h5_lb_play_control", title: LBPlayer.Lang.Play});
		LBPlayer.createHTMLEl(vid+"_play_control", "div", {id: vid+"_play_inner0"});
		// create big play button
		LBPlayer.createHTMLEl(pid, "div", {id: vid+"_big_play_button", className: "big_play_button", title: LBPlayer.Lang.Play});
		LBPlayer.createHTMLEl(vid+"_big_play_button", "div", {id: vid+"_big_play_button_inner"});
		// create pause-button
		LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_pause_control", className: "h5_lb_pause_control", title: LBPlayer.Lang.Pause});
		LBPlayer.createHTMLEl(vid+"_pause_control", "div", {id: vid+"_pause_inner0"});
		LBPlayer.createHTMLEl(vid+"_pause_control", "div", {id: vid+"_pause_inner1"});
		// create stop button
		LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_stop_control", className: "h5_lb_stop_control", title: LBPlayer.Lang.Stop});
		LBPlayer.createHTMLEl(vid+"_stop_control", "div", {id: vid+"_stop_control_inner"});
		// create progress bar
		LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_progress_control", className: "h5_lb_progress_control"});
		LBPlayer.createHTMLEl(vid+"_progress_control", "div", {id: vid+"_progress_bar_bg", className: "progress_bar_bg"});
		LBPlayer.createHTMLEl(vid+"_progress_control", "div", {id: vid+"_progress_bar_played", className: "progress_bar_played"});
		LBPlayer.createHTMLEl(vid+"_progress_control", "div", {id: vid+"_progress_bar_buffered", className: "progress_bar_buffered"});
		LBPlayer.createHTMLEl(vid+"_progress_control", "div", {id: vid+"_progress_bar_time", className: "progress_bar_time"});
		LBPlayer.createHTMLEl(vid+"_progress_bar_time", "div", {id: vid+"_progress_bar_time_line", className: "progress_bar_time_line"});
		LBPlayer.createHTMLEl(vid+"_progress_bar_time", "div", {id: vid+"_progress_bar_time_txt", className: "progress_bar_time_txt"});
		// create timer
		LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_timer_control", className: "h5_lb_timer_control"});
		LBPlayer.createHTMLEl(vid+"_timer_control", "div", {id: vid+"_timer_control_inner"});
		// create mute-elements
		LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_volume_control", className: "h5_lb_volume_control"});
		LBPlayer.createHTMLEl(vid+"_volume_control", "div", {id: vid+"_mute", className: "h5_lb_mute", title: LBPlayer.Lang.Mute});
		LBPlayer.createHTMLEl(vid+"_mute", "div", {id: vid+"_mute0"});
		LBPlayer.createHTMLEl(vid+"_mute", "div", {id: vid+"_mute1"});
		LBPlayer.createHTMLEl(vid+"_mute", "div", {id: vid+"_mute2"});
		LBPlayer.createHTMLEl(vid+"_mute", "div", {id: vid+"_mute3"});
		LBPlayer.createHTMLEl(vid+"_mute", "div", {id: vid+"_mute4"});
		LBPlayer.createHTMLEl(vid+"_mute", "div", {id: vid+"_mute5"});
		LBPlayer.createHTMLEl(vid+"_mute", "div", {id: vid+"_mute6"});
		// create volume-elements
		LBPlayer.createHTMLEl(vid+"_volume_control", "div", {id: vid+"_volume", className: "h5_lb_volume"});
		for(var i=1; i<=8; i++) {
			LBPlayer.createHTMLEl(vid+"_volume", "div", {id: vid+"_vol"+i, title: LBPlayer.Lang.Volume});
		}
		
		// create playbackRate
		if(this.options.showPlaybackRate && this.vObj.playbackRate) {
			LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_playback_control", className: "h5_lb_playback_control", title: LBPlayer.Lang.PlaybackRate_title});
			LBPlayer.createHTMLEl(vid+"_playback_control", "div", {id: vid+"_playback_control_inner", innerHTML: LBPlayer.Lang.PlaybackRate_inner});
			LBPlayer.createHTMLEl(vid+"_playback_control_inner", "div", {id: vid+"_playback_nav", className: "playback_nav"});
			LBPlayer.createHTMLEl(vid+"_playback_nav", "div", {id: vid+"_pbr2", innerHTML: LBPlayer.Lang.PlaybackRate_2, title: LBPlayer.Lang.PlaybackRate_to+""+LBPlayer.Lang.PlaybackRate_2, onclick: function() {self.setPlaybackRate(2, LBPlayer.Lang.PlaybackRate_2);}});
			LBPlayer.createHTMLEl(vid+"_playback_nav", "div", {id: vid+"_pbr1", innerHTML: LBPlayer.Lang.PlaybackRate_1, title: LBPlayer.Lang.PlaybackRate_to+""+LBPlayer.Lang.PlaybackRate_1, onclick: function() {self.setPlaybackRate(1, LBPlayer.Lang.PlaybackRate_1);}});
			LBPlayer.createHTMLEl(vid+"_playback_nav", "div", {id: vid+"_pbr05", innerHTML: LBPlayer.Lang.PlaybackRate_05, title: LBPlayer.Lang.PlaybackRate_to+""+LBPlayer.Lang.PlaybackRate_05, onclick: function() {self.setPlaybackRate(0.5, LBPlayer.Lang.PlaybackRate_05);}});
			LBPlayer.createHTMLEl(vid+"_playback_nav", "div", {id: vid+"_pbr025", innerHTML: LBPlayer.Lang.PlaybackRate_025, title: LBPlayer.Lang.PlaybackRate_to+""+LBPlayer.Lang.PlaybackRate_025, onclick: function() {self.setPlaybackRate(0.25, LBPlayer.Lang.PlaybackRate_025);}});
			switch(this.vObj.playbackRate) {
				case 1: this.setPlaybackRate(1, LBPlayer.Lang.PlaybackRate_1); break;
				case 2: this.setPlaybackRate(2, LBPlayer.Lang.PlaybackRate_2); break;
				case 0.5: this.setPlaybackRate(0.5, LBPlayer.Lang.PlaybackRate_05); break;
				case 0.25: this.setPlaybackRate(0.25, LBPlayer.Lang.PlaybackRate_025); break;
			}
		}
		// create subtitle-element
		LBPlayer.createHTMLEl(pid, "div", {id: vid+"_subtitles", className: "h5_lb_subtitles"});
		if(this.options.showSubtitle && this.vars.activeSub !== null) {
			LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_subtitle_control", className: "h5_lb_subtitle_control", title: LBPlayer.Lang.Subtitle_title});
			LBPlayer.createHTMLEl(vid+"_subtitle_control", "div", {id: vid+"_subtitle_control_inner", innerHTML: LBPlayer.Lang.Subtitle_inner});
			// draw subtitle menu items
			if(this.options.showSubtitle && this.vars.activeSub !== null) {this.drawSubsMenu();}
		}
		// create fullscreen-button
		LBPlayer.createHTMLEl(vid+"_controls", "div", {id: vid+"_fullscreen_control", className: "h5_lb_fullscreen_control", title: LBPlayer.Lang.Fullscreen});
		LBPlayer.createHTMLEl(vid+"_fullscreen_control", "div", {id: vid+"_fullscreen_control_fs1", className: "h5_lb_fullscreen_control_fs1"});
		LBPlayer.createHTMLEl(vid+"_fullscreen_control", "div", {id: vid+"_fullscreen_control_fs2", className: "h5_lb_fullscreen_control_fs2"});
		
		// draw progress timer
		this.drawProgressTimer();
		
		// add events
		LBPlayer.addEvent(this.vObj, "progress", function(e) { self.onProgress(e);});
		LBPlayer.addEvent(this.vObj, "timeupdate", function() {self.drawProgressTimer(); if(self.options.showSubtitle) {self.drawSubtitles();}});
		LBPlayer.addEvent(this.vObj, "seeked", function() {self.onSeeked();});
		LBPlayer.addEvent(this.vObj, "ended", function() {if(self.vObj.loop) {self.onPlay();} else {self.onEnded();}}); //INFO: Event "ended" not in Opera??

		LBPlayer.mergeObjs(this.vObj, {onclick: function() {self.onPlay();}});
		LBPlayer.mergeObjs(this.vObj, {ondblclick: function() {self.setScreen(!self.vars.fullscreen);}});
		LBPlayer.mergeObjs(this.vObj, {onmousemove: function() {self.setControlsTask();}});
		LBPlayer.mergeObjs((LBPlayer.$(vid).parentNode), {onmouseover: function() {
				if(!self.vars.fullscreen) {
					var cssClass = "h5_lb_player h5_lb_smallscreen";
					(LBPlayer.$(vid).parentNode).removeAttribute("class");
					(LBPlayer.$(vid).parentNode).setAttribute("class", cssClass);
				}
			}});
		LBPlayer.mergeObjs((LBPlayer.$(vid).parentNode), {onmouseout: function() {
				if(!self.vars.fullscreen) {
					var cssClass = "h5_lb_player h5_lb_smallscreen h5_lb_unfocused";
					if(!LBPlayer.$(vid).focused) {
						(LBPlayer.$(vid).parentNode).removeAttribute("class");
						(LBPlayer.$(vid).parentNode).setAttribute("class", cssClass);
					}
				}
			}});
		
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_big_play_button"), {onclick: function() {self.onPlay();}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_play_control"), {onclick: function() {self.onPlay();}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_pause_control"), {onclick: function() {self.onPlay();}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_stop_control"), {onclick: function() {self.vObj.pause(); self.onStop();}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_progress_control"), {onclick: function(e) {self.onSeeking(e);}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_progress_control"), {onmouseover: function(e) {self.getProgressPosition(e);}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_progress_control"), {onmousemove: function(e) {self.getProgressPosition(e);}});
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_mute_control"), {onclick: function() {self.setVolume(0);}});
		for(var i=1; i<=8; i++) {
			LBPlayer.mergeObjs(LBPlayer.$(vid+"_vol"+i), {onclick: function() {self.setVolume(this.id);}});
		}
		LBPlayer.mergeObjs(LBPlayer.$(vid+"_fullscreen_control"), {onclick: function() {self.setScreen(!self.vars.fullscreen);}});
	}
	this.vars.hasControls = true;
	// (re-)calculate progress-bars
	var elementsWidth = parseInt(LBPlayer.$(vid+"_play_control").offsetWidth + LBPlayer.$(vid+"_pause_control").offsetWidth + LBPlayer.$(vid+"_stop_control").offsetWidth + LBPlayer.$(vid+"_timer_control").offsetWidth  + LBPlayer.$(vid+"_volume_control").offsetWidth + LBPlayer.$(vid+"_fullscreen_control").offsetWidth, 10);
	if(this.options.showPlaybackRate && this.vObj.playbackRate) { elementsWidth += LBPlayer.$(vid+"_playback_control").offsetWidth; }
	if(this.options.showSubtitle && this.vars.activeSub !== null) { elementsWidth += LBPlayer.$(vid+"_subtitle_control").offsetWidth; }
	// 
	var calcControlsWidth = parseInt(parseInt(this.vObj.offsetWidth, 10) - elementsWidth, 10);
	var calcWidth = parseInt(calcControlsWidth + elementsWidth, 10);
	calcWidth = parseInt(parseInt(this.vObj.width) - calcWidth, 10);
	// TODO irgendwo ist ein Pixel??
	LBPlayer.$(vid+"_progress_control").style.width = parseInt(calcControlsWidth + calcWidth - 1, 10)+"px";
	// calculate progress-seeking bar
	LBPlayer.$(vid+"_progress_bar_bg").style.width = parseInt(parseInt(LBPlayer.$(vid+"_progress_control").style.width, 10)-22, 10)+"px";
	LBPlayer.$(vid+"_progress_bar_time").style.width = parseInt(parseInt(LBPlayer.$(vid+"_progress_bar_bg").style.width, 10), 10)+"px";;
	// create preloading-bar
	if(this.vars.loaded < 1) {var self = this; this.vars.proc = setInterval(function() {self.onBuffering();}, 250);}
	// set volume
	this.setVolume(this.options.volume);
	// if autoplay - play video now
	if(this.vars.autoplay) {LBPlayer.focusVideo(true, this.options.vid); this.setVideoToFocus(this.options.vid); this.onPlay(); this.vars.autoplay = false;}
};
// function - if play-/pause-button clicked
LBPlayer.prototype.onPlay = function() {
	var vid = this.options.vid;
	if(parseFloat(this.vObj.currentTime) >= parseFloat(this.vObj.duration)) {this.vObj.currentTime = 0.00;}
	if(this.vObj.paused) { this.vObj.play(); LBPlayer.hideEl(vid+"_big_play_button"); LBPlayer.hideEl(vid+"_play_control"); LBPlayer.showEl(vid+"_pause_control"); LBPlayer.hideEl(vid+"_poster"); } 
	else { this.vObj.pause(); LBPlayer.showEl(vid+"_play_control"); LBPlayer.hideEl(vid+"_pause_control"); }
	if(this.vars.activeSub !== null && this.vars.activeSubId == -1) { this.setSubtitle(true); }
	
};
// function - if stop-button clicked
LBPlayer.prototype.onStop = function() {
	var vid = this.options.vid;
	if(parseFloat(this.vObj.currentTime) > 0) {
		this.vars.stoped = true; this.vObj.currentTime = 0.00; this.vObj.pause(); LBPlayer.showEl(vid+"_big_play_button"); LBPlayer.showEl(vid+"_play_control"); LBPlayer.hideEl(vid+"_pause_control");
	}
	this.setSubtitle(false);
	this.setPoster();
};
// function - if video ended
LBPlayer.prototype.onEnded = function() {
	var vid = this.options.vid;
	this.vObj.pause(); LBPlayer.showEl(vid+"_big_play_button"); LBPlayer.showEl(vid+"_play_control"); LBPlayer.hideEl(vid+"_pause_control");
	this.setSubtitle(false);
	this.setPoster();
};
// function - if seeking in video
LBPlayer.prototype.onSeeking = function(e) {
	var vid = this.options.vid;
	var obj = LBPlayer.$(vid+"_progress_control"); var pLeft = obj.offsetLeft;
	while(obj = obj.offsetParent) {pLeft += obj.offsetLeft;}
	var pos = Math.max(0, Math.min(1, (e.clientX - pLeft) / LBPlayer.$(vid+"_progress_control").offsetWidth));
	this.vObj.currentTime = parseFloat(this.vObj.duration * pos);
};
// function - if seeked to position
LBPlayer.prototype.onSeeked = function() {
	this.setSubtitle(false);
};
// function - set volume and draw volume-controls
LBPlayer.prototype.setVolume = function(v) {
	var vid = this.options.vid;
	if(v == "+" && this.options.volume <= 8) {v = parseInt(this.options.volume+1, 10);}
	else if(v == "-" && this.options.volume > 0) {v = parseInt(this.options.volume-1, 10);}
	else if(v === null) {if(this.options.volume === 0) {v = 8;} else {v = 0;}}
	else if(isNaN(v)) {
		if(v.length > 1) { v = parseInt(v.charAt(v.length-1)); }
		else { v = this.options.volume; }
	}
	// set css classes
	for(var i=1; i<=8; i++) {LBPlayer.$(vid+"_vol"+i).setAttribute("class", "isnot");}
	for(var j = 1; j <= v; j++) {LBPlayer.$(vid+"_vol"+j).setAttribute("class", "is");}
	// 
	if(v === 0) {for(var k = 0; k <= 3; k++) {LBPlayer.$(vid+"_mute"+k).setAttribute("class", "isnot");}}
	else {for(var l = 0; l <= 3; l++) {LBPlayer.$(vid+"_mute"+l).setAttribute("class", "is");}}
	LBPlayer.showEl(vid+"_mute5"); LBPlayer.showEl(vid+"_mute6");
	switch(v) {
		case 0: this.vObj.volume = 0; LBPlayer.hideEl(vid+"_mute5"); LBPlayer.hideEl(vid+"_mute6"); break;
		case 1: this.vObj.volume = 0.125; LBPlayer.hideEl(vid+"_mute5"); LBPlayer.hideEl(vid+"_mute6"); break;
		case 2: this.vObj.volume = 0.25; LBPlayer.hideEl(vid+"_mute5"); LBPlayer.hideEl(vid+"_mute6"); break;
		case 3: this.vObj.volume = 0.375; LBPlayer.hideEl(vid+"_mute5"); LBPlayer.hideEl(vid+"_mute6"); break;
		case 4: this.vObj.volume = 0.5; LBPlayer.hideEl(vid+"_mute6"); break;
		case 5: this.vObj.volume = 0.625; LBPlayer.hideEl(vid+"_mute6"); break;
		case 6: this.vObj.volume = 0.75; LBPlayer.hideEl(vid+"_mute6"); break;
		case 7: this.vObj.volume = 0.875; break;
		case 8: this.vObj.volume = 1; break;
	}
	this.options.volume = v;
	var self = this;
	if(v === 0) {  LBPlayer.mergeObjs(LBPlayer.$(vid+"_mute"), {onclick: function() {self.setVolume(8);}}); LBPlayer.$(vid+"_mute").setAttribute("title", LBPlayer.Lang.UnMute); }
	else { LBPlayer.mergeObjs(LBPlayer.$(vid+"_mute"), {onclick: function() {self.setVolume(0);}}); LBPlayer.$(vid+"_mute").setAttribute("title", LBPlayer.Lang.Mute); }
};
// function - set playback-rate; HINT: not supported by Opera 10.60+ (http://dev.opera.com/articles/view/everything-you-need-to-know-about-html5-video-and-audio/)
LBPlayer.prototype.setPlaybackRate = function(pbr, txt) {
	var vid = this.options.vid;
	this.vObj.playbackRate = pbr;
	LBPlayer.$(vid+"_playback_control_inner").childNodes[0].textContent = txt;
};
// function - check if enterFullscreen possible (Webkit??) - Only a placeholder at the moment
LBPlayer.prototype.onFullscreen = function() {
	if(this.vObj.webkitSupportsFullscreen && (typeof(this.vObj.webkitEnterFullscreen) !== "undefined")) {
		// to be implemented if ready in browser(s)
		this.vObj.webkitEnterFullscreen();
	}
};
// function - switch between smallscreen- and window-fullscreen-video
LBPlayer.prototype.setScreen = function(fs) {
	var vid = this.options.vid;
	
	if(this.vObj.webkitSupportsFullscreen && (typeof(this.vObj.webkitEnterFullscreen) !== "undefined")) { this.onFullscreen(); return;}
	if(fs) {
		// scroll to focused video
		window.scrollTo(0,0);
		// remove css class and reset to fullscreen
		(LBPlayer.$(vid).parentNode).removeAttribute("class");
		(LBPlayer.$(vid).parentNode).setAttribute("class", "h5_lb_player h5_lb_fullscreen");
		// get browser dimensions
		var bsXY = LBPlayer.getBrowserSizeXY();
		var pXY = LBPlayer.getPageSizeXY();
		// set video element dimensions
		LBPlayer.$(vid).style.width = parseInt(pXY.width, 10)+"px"; LBPlayer.$(vid).style.height = parseInt(bsXY.height, 10)+"px";
		// set player div
		(LBPlayer.$(vid).parentNode).style.height = LBPlayer.$(vid).offsetHeight+"px"; (LBPlayer.$(vid).parentNode).style.width = LBPlayer.$(vid).offsetWidth+"px";
		// set video to in-browser fullscreen
		this.vObj.width = parseInt(pXY.width, 10); this.vObj.height = parseInt(bsXY.height, 10);
		// video is fullscreen
		this.vars.fullscreen = true;
	} else {
		// style outer html5_player div
		(LBPlayer.$(vid).parentNode).removeAttribute("class");
		(LBPlayer.$(vid).parentNode).setAttribute("class", "h5_lb_player h5_lb_smallscreen");
		// resize and set Video
		this.resizeVideo();
		// video is not fullscreen
		this.vars.fullscreen = false;
		// set video in browser-focus
		if(LBPlayer.$(vid).focused) { this.setVideoToFocus(vid); }
	}
	//if(this.vars.showControls && this.vars.hasControls) {
		// add controls
		this.addControls();
		// redraw progress bar and timer
		this.drawProgressBar();
		this.drawProgressTimer();
		// redraw fullscreen icon
		this.drawFullscreenIcon();
		// set poster if available
		this.setPoster();
	//}
};
// function - set up poster if available
LBPlayer.prototype.setPoster = function() {
	var vid = this.options.vid;
	if(!this.vars.poster) {return;}
	// on ended reappear poster
	if(this.options.posterRestore && parseFloat(this.vObj.currentTime) >= parseFloat(this.vObj.duration)) {LBPlayer.showEl(vid+"_poster");}
	// on stoped reappear poster
	if(this.options.posterRestore && (this.vars.stoped || parseInt(this.vObj.currentTime, 10) === 0)) {LBPlayer.showEl(vid+"_poster");}
	// on playing hide poster
	if(!this.vObj.paused || parseFloat(this.vObj.currentTime) > 0 && parseFloat(this.vObj.currentTime) < parseFloat(this.vObj.duration)) {LBPlayer.hideEl(vid+"_poster");}
	// fit poster size to video size
	this.sizePoster();
	// add attributes
	var self = this;
	LBPlayer.mergeObjs(this.vars.poster, {onclick: function() {self.onPlay();}});
	LBPlayer.mergeObjs(this.vars.poster, {onmousemove: function() {self.setControlsTask();}});
};
// function - fit poster size to video size, if poster available
LBPlayer.prototype.sizePoster = function() {
	var vid = this.options.vid;
    if(this.vars.poster === false || this.vars.poster.style.display == 'none') {return;}
    this.vars.poster.style.height = parseInt(parseInt(this.vObj.height, 10), 10) + "px";
    this.vars.poster.style.width = parseInt(parseInt(this.vObj.width, 10), 10) + "px";
};
// function - draw fullscreen-icon
LBPlayer.prototype.drawFullscreenIcon = function() {
	var vid = this.options.vid;
	if(this.vars.fullscreen) {
		LBPlayer.hideEl(vid+"_fullscreen_control_fs1"); LBPlayer.showEl(vid+"_fullscreen_control_fs2");
		LBPlayer.$(vid+"_fullscreen_control").onmouseover = function() { LBPlayer.showEl(vid+"_fullscreen_control_fs1"); LBPlayer.hideEl(vid+"_fullscreen_control_fs2"); };
		LBPlayer.$(vid+"_fullscreen_control").onmouseout = function() { LBPlayer.hideEl(vid+"_fullscreen_control_fs1"); LBPlayer.showEl(vid+"_fullscreen_control_fs2"); };
		LBPlayer.$(vid+"_fullscreen_control").setAttribute("title", LBPlayer.Lang.Smallscreen);
	} else {
		LBPlayer.showEl(vid+"_fullscreen_control_fs1"); LBPlayer.hideEl(vid+"_fullscreen_control_fs2");
		LBPlayer.$(vid+"_fullscreen_control").onmouseover = function() { LBPlayer.hideEl(vid+"_fullscreen_control_fs1"); LBPlayer.showEl(vid+"_fullscreen_control_fs2"); };
		LBPlayer.$(vid+"_fullscreen_control").onmouseout = function() { LBPlayer.showEl(vid+"_fullscreen_control_fs1");	LBPlayer.hideEl(vid+"_fullscreen_control_fs2"); };
		LBPlayer.$(vid+"_fullscreen_control").setAttribute("title", LBPlayer.Lang.Fullscreen);
	}
};
// function - hide controls after x ms (set to 4000 ms)
LBPlayer.prototype.setControlsTask = function() {
	var vid = this.options.vid;
	// show controls
	this.vars.showControls = true; LBPlayer.showEl(vid+"_controls");
	// show embedding info
	LBPlayer.showEl(vid+"_embed");
	// this.vars.loaded will not be set in opera (10.6x+) yet
	if(this.options.hideControls && this.vars.loaded === 1) {
		clearInterval(this.vars.mouseMoveTimeout);
		var self = this; this.vars.mouseMoveTimeout = setInterval(function(){ 
			// hide controls
			self.vars.showControls = false; LBPlayer.hideEl(vid+"_controls");
			// hide embedding info
			LBPlayer.hideEl(vid+"_embed");
			clearInterval(self.vars.mouseMoveTimeout); }, parseInt(self.options.hideControlsTimeout*1000));
	}
};
// function - seek with jump (+/-) x sec.
LBPlayer.prototype.seekTo = function(s, sec) {
	var vid = this.options.vid;
	var seek = ((sec) ? this.options.seekSkipSec : parseFloat((this.vObj.duration*(this.options.seekSkipPerc/100))));
	this.vObj.currentTime = ((s == "+") ? parseFloat(this.vObj.currentTime + seek) : parseFloat(this.vObj.currentTime - seek));
	this.setSubtitle(false);
};
// function - helper for seeking, sets also the timer-bar to the progress-bar
LBPlayer.prototype.getProgressPosition = function(e) {
	var vid = this.options.vid;
	var o = LBPlayer.$(vid+"_progress_bar_bg");
	var pLeft = o.offsetLeft;
	while(o = o.offsetParent) {	pLeft += o.offsetLeft; }
	// calculate mousedown-position
	var pos = Math.max(0, Math.min(1, (e.clientX - pLeft) / parseInt(LBPlayer.$(vid+"_progress_bar_bg").style.width, 10)));
	// timer-bar in progress-bar
	LBPlayer.$(vid+"_progress_bar_time_txt").innerHTML = this.parseTimer(parseFloat(this.vObj.duration * pos));
	LBPlayer.$(vid+"_progress_bar_time_txt").style.left = parseInt(parseInt(LBPlayer.$(vid+"_progress_bar_bg").style.width, 10) * pos - 18, 10)+"px";
	LBPlayer.$(vid+"_progress_bar_time_line").style.left = parseInt(parseInt(LBPlayer.$(vid+"_progress_bar_bg").style.width, 10) * pos - 2, 10)+"px";
};
// function - if browser supports progress-event (Firefox, ??)
LBPlayer.prototype.onProgress = function(e) {
	if(e.total > 0) { this.vars.loaded = e.loaded/e.total; this.drawProgressBar(); }
};
// function - if browsers not support the progress-event (Opera, Google Chrome, ??)
LBPlayer.prototype.onBuffering = function(){
    if (this.vObj.buffered) {
		if (this.vObj.buffered.length >= 1) {
			this.vars.loaded = parseFloat(this.vObj.buffered.end(0)/this.vObj.duration); this.drawProgressBar();
			if (this.vObj.buffered.end(0) == this.vObj.duration) { clearInterval(this.vars.proc); }
		} else { this.vars.loaded = 1; this.drawProgressBar(); clearInterval(this.vars.proc); }
    } else { clearInterval(this.vars.proc); }
};
// function - draw progress-bar
LBPlayer.prototype.drawProgressBar = function() {
	var vid = this.options.vid;
	LBPlayer.$(vid+"_progress_bar_buffered").style.width = parseInt(parseInt(parseInt(LBPlayer.$(vid+"_progress_control").style.width, 10)*parseFloat(this.vars.loaded), 10)-22, 10)+"px";
};
// function - draw progress-timer
LBPlayer.prototype.drawProgressTimer = function() {
	var vid = this.options.vid;
	LBPlayer.$(vid+"_progress_bar_played").style.width = parseInt(parseFloat(parseInt(LBPlayer.$(vid+"_progress_bar_bg").style.width, 10)*parseFloat(this.vObj.currentTime)).toFixed(2)/parseFloat(this.vObj.duration).toFixed(2), 10)+"px";
	LBPlayer.$(vid+"_timer_control_inner").innerHTML = ((parseFloat(this.vObj.currentTime).toFixed(2) === 0.00) ? "00:00 / "+this.parseTimer(this.vObj.duration) : this.parseTimer(this.vObj.currentTime)+" / "+this.parseTimer(this.vObj.duration));
};
// function - parse time to correct output-format
LBPlayer.prototype.parseTimer = function(t) {
	var e;
	if(parseInt(t/60, 10) >= 0 && parseInt(t/60, 10) < 10) {e = "0"+this.getTimer(t);} else {e = this.getTimer(t);}
	return e;
};
// function - calculate correct time-format mm:ss
LBPlayer.prototype.getTimer = function(sec) {
    return Math.floor(sec/60)+":"+((parseInt(sec % 60, 10) < 10) ? "0"+parseInt(sec % 60, 10) : parseInt(sec % 60, 10));
};
// function - show/hide subtitle if available
LBPlayer.prototype.setSubtitle = function(v) {
	var vid = this.options.vid;
	if(v) { LBPlayer.$(vid+"_subtitles").innerHTML = ""; LBPlayer.showEl(vid+"_subtitles"); }
	else { LBPlayer.$(vid+"_subtitles").innerHTML = ""; LBPlayer.hideEl(vid+"_subtitles"); this.vars.activeSubId = -1; }
};
// function - get next available subtitle
LBPlayer.prototype.nextSubtitle = function(v) {
	var subs = [], i = 0, al = null, nl = 0;
	for(var t in this.vars.subs) { if(t === this.vars.activeSubLang) { al = i; } subs[i] = t; i++; }
	for(var j=0, k=subs.length; j<k;j++) { if(subs[j+1] === null) { nl = 0; break; } else if(j > al) { nl = j; break; } }
	i = 0;
	for(var t in this.vars.subs) { if(i === nl) { al = t } i++; }
	this.vars.activeSubLang = al;
	i = 0;
	for(var t in this.vars.subs[this.vars.activeSubLang]["track"]) {
		this.vars.activeSub[i] = this.vars.subs[this.vars.activeSubLang]["track"][t];
		i++;
	}
};
// function - draw subtitle
LBPlayer.prototype.drawSubtitles = function() {
	var vid = this.options.vid;
	if(this.vars.hideSubtitle || (this.vars.activeSub !== null && (this.vObj.currentTime > this.vars.activeSub[parseInt(this.vars.activeSub.length-1, 10)].to || parseFloat(this.vObj.currentTime) >= parseFloat(this.vObj.duration)))) {
		this.setSubtitle(false);
	} else if(this.vars.activeSub !== null) {
		for(var s in this.vars.activeSub) {
			// get current subtitle
			if(this.vars.activeSub[s].from >= this.vObj.currentTime && this.vObj.currentTime <= this.vars.activeSub[s].to) {
				break;
			}
			// show current subtitle
			if(parseFloat(this.vars.activeSubId) <= parseFloat(s)) {
				LBPlayer.showEl(vid+"_subtitles");
				this.vars.activeSubId = s;
				LBPlayer.$(vid+"_subtitles").innerHTML = this.vars.activeSub[s].txt;
			}
			// don't show subtitles in times where no subtitle is set
			if(this.vars.activeSubId >= 0 && this.vObj.currentTime > this.vars.activeSub[this.vars.activeSubId].to) {
				LBPlayer.$(vid+"_subtitles").innerHTML = "";
			}
		}
	}
};
// function - load subtitle
LBPlayer.prototype.getSubs = function() {
	var vid = this.options.vid;
	// get all track-elements
	var tracks = LBPlayer.$(vid).getElementsByTagName("track");
	for(var i = 0; i < tracks.length; i++) {
		// only one track/caption per language at the moment
		var src = tracks[i].getAttribute("src");
		var srclang = tracks[i].getAttribute("srclang");
		var label = tracks[i].getAttribute("label");
		if(!this.vars.subs[srclang]) {
			switch(tracks[i].getAttribute("type")) {
				case "text/plain":
				case "text/x-srt":
				case "application/x-subrip": this.resolveTextPlainSubs(src, srclang, label); break;
				case "application/vobsub": this.resolveTextPlainSubs(src, srclang, label); break;
				case "application/xml": this.resolveXMLSubs(src, srclang, label); break;
				case "application/ttaf+xml": this.resolveXMLTTSubs(src, srclang, label); break;
			}
		}
	}
	
	var j = 0, l = "";
	for(var t in this.vars.subs) { j++; if(l==""){l=t; break;} }
	
	if(this.vars.subs[this.vars.activeSubLang]) {
		this.vars.hideSubtitle = false;
		var j = 0; var t;
		for(t in this.vars.subs[this.vars.activeSubLang]["track"]) {
			if(j == 0) {this.vars.activeSub = new Array();}
			this.vars.activeSub[j] = this.vars.subs[this.vars.activeSubLang]["track"][t];
			j++;
		}
	} else if(j > 0) {
		this.vars.hideSubtitle = false;
		var j = 0; var t;
		this.vars.activeSubLang = l;
		for(t in this.vars.subs[this.vars.activeSubLang]["track"]) {
			if(j == 0) {this.vars.activeSub = new Array();}
			this.vars.activeSub[j] = this.vars.subs[this.vars.activeSubLang]["track"][t];
			j++;
		}
	}
};
// function - draw subtitle menu items
LBPlayer.prototype.drawSubsMenu = function() {
	var vid = this.options.vid;
	var self = this; 
	LBPlayer.createHTMLEl(vid+"_subtitle_control_inner", "div", {id: vid+"_subtitle_nav", className: "subtitle_nav"});
	LBPlayer.$(vid+"_subtitle_nav").style.top = "-12px";
	
	var i = 1;
	for(var t in this.vars.subs) {
		if(LBPlayer.$("subs_"+t) === null) {
			LBPlayer.createHTMLEl(vid+"_subtitle_nav", "div", {id: vid+"_subs_"+t, innerHTML: this.vars.subs[t]["label"]});
			LBPlayer.mergeObjs(LBPlayer.$(vid+"_subs_"+t+""), {title: LBPlayer.Lang.Subtitle_to+self.vars.subs[t]["label"], onclick: function() {self.vars.hideSubtitle = false; LBPlayer.showEl(vid+"_subtitles"); self.resetSubs(this.id);}});
		}
		i++;
	}
	LBPlayer.createHTMLEl(vid+"_subtitle_nav", "div", {id: vid+"_subs_off", innerHTML: LBPlayer.Lang.Subtitle_set, title: LBPlayer.Lang.Subtitle_onoff, onclick: function() {self.setSubtitle(false);}});
	LBPlayer.$(vid+"_subtitle_nav").style.top = "-"+parseInt(parseInt(i*parseInt(LBPlayer.getElemStyle(LBPlayer.$(vid+"_subs_off"), "height"), 10), 10)+2, 10)+"px";
};
// function - reset subtitle on user-click
LBPlayer.prototype.resetSubs = function(lang) {
	var vid = this.options.vid;
	lang = lang.replace(vid+"_subs_", "");
	if(this.vars.subs[lang]) {
		this.vars.activeSubLang = lang;
		var i = 0;
		for(var t in this.vars.subs[this.vars.activeSubLang]["track"]) {
			this.vars.activeSub[i] = this.vars.subs[this.vars.activeSubLang]["track"][t];
			i++;
		}
	}
};
// function - resolve srt/vobsub-subtitle
LBPlayer.prototype.resolveTextPlainSubs = function(src, lang, label) {
	var xhr = LBPlayer.XHR();
	xhr.open("GET", src, false);
	if(!this.vars.isIE) {
		xhr.overrideMimeType("text/html; charset=ISO-8859-1");
	}
	xhr.send();
	if(xhr.status == 404) {return;}
	var srt = xhr.responseText;
	srt = this.trimSubs(srt.replace(/\r\n|\r|\n/g, '\n'));
	srt = srt.split('\n\n');
	var i = 0; var isSub = false;
	this.vars.subs[lang] = new Object();
	this.vars.subs[lang]["label"] = new Object();
	this.vars.subs[lang]["label"] = label;
	this.vars.subs[lang]["track"] = new Object();
	for(var s in srt) {
		var st = srt[s].split('\n');
		var time; var j;
		if(st.length >= 2) {
			var t = "";
			var regex_srt = /^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})$/;
			var regex_sbv_sub = /^(\d{1,2}:\d{2}:\d{2}.\d{3}),(\d{1,2}:\d{2}:\d{2}.\d{3})$/;
			if(regex_srt.test(st[1])) {	// .srt
				time = regex_srt.exec(st[1]);
				j = 2;
				isSub = true;
			} else if(regex_sbv_sub.test(st[0])) { // .sbv + .sub
				time = regex_sbv_sub.exec(st[0]);
				j = 1;
				isSub = true;
			}
			if(isSub) {
				for(j; j < st.length; j++) { t += st[j]+'\n'; }
				if(t !== "") {
					this.vars.subs[lang]["track"][i] = new Object();
					LBPlayer.mergeObjs(this.vars.subs[lang]["track"][i], {from: this.toSecSubs(time[1]), to: this.toSecSubs(time[2]), txt: this.wrapSubs(t)});
					i++;
				}
			}
		}
	}
};
// function - resolve xml-subtitle
LBPlayer.prototype.resolveXMLSubs = function(src, lang, label){
	var xhr = LBPlayer.XHR();
	xhr.open("GET", src, false);
	if(!this.vars.isIE) {
		xhr.overrideMimeType("text/html; charset=ISO-8859-1");
	}
	xhr.send();
	if(xhr.status == 404) {return;}
	var srt = (new DOMParser()).parseFromString(xhr.responseText, "text/xml");
	var s, st, id, tf, tt, t = "";
	this.vars.subs[lang] = new Object();
	this.vars.subs[lang]["label"] = new Object();
	this.vars.subs[lang]["label"] = label;
	this.vars.subs[lang]["track"] = new Object();
	for(s in srt.childNodes[0].childNodes) {
		if(!isNaN(s)) {
			for(st in srt.childNodes[0].childNodes[s].childNodes) {
				if(!isNaN(st)) {
					switch(srt.childNodes[0].childNodes[s].childNodes[st].tagName) {
						case "id": id = parseInt(srt.childNodes[0].childNodes[s].childNodes[st].textContent, 10); break;
						case "from": tf = this.toSecSubs(srt.childNodes[0].childNodes[s].childNodes[st].textContent); break;
						case "to": tt = this.toSecSubs(srt.childNodes[0].childNodes[s].childNodes[st].textContent); break;
						case "text": t = this.wrapSubs(this.trimSubs(srt.childNodes[0].childNodes[s].childNodes[st].textContent)); break;
					}
				}
			}
			if(id !== undefined) {
				this.vars.subs[lang]["track"][id] = new Object();
				LBPlayer.mergeObjs(this.vars.subs[lang]["track"][id], {from: tf, to: tt, txt: t});
			}
		}
	}
};
// function - resolve xml_ttai1-subtitle
LBPlayer.prototype.resolveXMLTTSubs = function(src, lang, label){
	var xhr = LBPlayer.XHR();
	xhr.open("GET", src, false);
	if(!this.vars.isIE) {
		xhr.overrideMimeType("text/html; charset=ISO-8859-1");
	}
	xhr.send();
	if(xhr.status == 404) {return;}
	var srt = (new DOMParser()).parseFromString(xhr.responseText, "text/xml");
	var i = 0, s, st, stp, tf, tt, t = "";
	this.vars.subs[lang] = new Object();
	this.vars.subs[lang]["label"] = new Object();
	this.vars.subs[lang]["label"] = label;
	this.vars.subs[lang]["track"] = new Object();
	for(s in srt.childNodes[0].childNodes) {
		if(!isNaN(s) && srt.childNodes[0].childNodes[s].tagName == "body") {
			for(st in srt.childNodes[0].childNodes[s].childNodes) {
				if(!isNaN(st) && srt.childNodes[0].childNodes[s].childNodes[st].tagName == "div") {
					for(stp in srt.childNodes[0].childNodes[s].childNodes[st].childNodes) {
						if(!isNaN(st) && srt.childNodes[0].childNodes[s].childNodes[st].childNodes[stp].tagName == "p") {
							tf = this.toSecSubs(srt.childNodes[0].childNodes[s].childNodes[st].childNodes[stp].getAttribute("begin"));
							tt = this.toSecSubs(srt.childNodes[0].childNodes[s].childNodes[st].childNodes[stp].getAttribute("end"));
							t = this.wrapSubs(this.trimSubs(srt.childNodes[0].childNodes[s].childNodes[st].childNodes[stp].textContent));

							this.vars.subs[lang]["track"][i] = new Object();
							LBPlayer.mergeObjs(this.vars.subs[lang]["track"][i], {from: tf, to: tt, txt: t});
							i++;
						}
					}
				}
			}
		}
	}
};
// function - trim srt-subtitle, replace whitespace at begin/end
LBPlayer.prototype.trimSubs = function(txt) {
	return txt.replace(/(^\s+|\s+$)/g, "");
};
// function - wrap srt-subtitle
LBPlayer.prototype.wrapSubs = function(txt) {
	return txt.replace("\n", "<br/>");
};
// function - get subtitle-time in seconds
LBPlayer.prototype.toSecSubs = function(t) {
    var s = 0.0;
    if(t) {
		var p = t.split(':');
		for(var i = 0; i < p.length; i++) {s = s * 60 + parseFloat(p[i].replace(',', '.'));}
    }
    return s;
};
// function - do something if special keys pressed down
LBPlayer.prototype.onKeydown = function(e) {
	LBPlayer.onKeyAction = false;
	var vid = this.options.vid;
	
	if(LBPlayer.videoFocused == LBPlayer.$(vid)) { LBPlayer.isVideoEvent = true; }

	var kc  = (window.event) ? event.keyCode : e.keyCode; 	// MSIE or Firefox?
	var kTAB = (window.event) ? 9 : e.DOM_VK_TAB;			// for TAB
	var kCRTL = (window.event) ? 17 : e.DOM_VK_CONTROL;		// for CRTL & x
	var kESC = (window.event) ? 27 : e.DOM_VK_ESCAPE;		// leave fullscreen
	var kSPACE = (window.event) ? 32 : e.DOM_VK_SPACE;		// play
	var kEND = (window.event) ? 35 : e.DOM_VK_END;			// END key
	var kHOME = (window.event) ? 36 : e.DOM_VK_HOME;		// POS1 key
	var kLEFT = (window.event) ? 37 : e.DOM_VK_LEFT;		// left, jump-
	var kUP = (window.event) ? 38 : e.DOM_VK_UP;			// unmute
	var kRIGHT = (window.event) ? 39 : e.DOM_VK_RIGHT;		// right, jump+
	var kDOWN = (window.event) ? 40 : e.DOM_VK_DOWN;		// mute
	var kF = (window.event) ? 70 : e.DOM_VK_F;				// window fullscreen
	var kN = (window.event) ? 78 : e.DOM_VK_N;				// next video
	var kS = (window.event) ? 83 : e.DOM_VK_S;				// stop
	var kV = (window.event) ? 86 : e.DOM_VK_V;				// show/hide subtitle; with CTRL: cycle through the available subtitles
	var kF11 = (window.event) ? 122 : e.DOM_VK_F11;			// on Browser-fullscreen

	switch(kc) {
		case kTAB: if(!this.vars.fullscreen) {LBPlayer.onKeyAction = true; LBPlayer.isVideoEvent = false;} this.vars.keyHolderTAB = true; break;
		case kCRTL: this.vars.keyHolderCRTL = true; break;
		case kESC: this.setScreen(false); break;
		case kSPACE: this.onPlay(); break;
		case kEND: this.vObj.play(); this.vObj.currentTime = this.vObj.duration; break;
		case kHOME: this.vObj.pause(); this.onStop(); break;
		case kLEFT: if(this.vars.keyHolderCRTL) {this.seekTo("-", false);} else {this.seekTo("-", true);} break;
		case kRIGHT: if(this.vars.keyHolderCRTL) {this.seekTo("+", false);} else {this.seekTo("+", true);} break;
		case kUP: if(this.vars.keyHolderCRTL) {this.setVolume(8);} else {this.setVolume("+");} break;
		case kDOWN: if(this.vars.keyHolderCRTL) {this.setVolume(0);} else {this.setVolume("-");} break;
		case kF: if(this.vObj.webkitSupportsFullscreen && (typeof(this.vObj.webkitEnterFullscreen) !== "undefined")) {this.onFullscreen();} else {this.setScreen(!this.vars.fullscreen);} break;
		case kN: if(!this.vars.fullscreen) {this.getNextVideo();}; break;
		case kS: this.onStop(); break;
		case kV: if(this.vars.activeSub !== null) { if(this.vars.keyHolderCRTL) {this.nextSubtitle();} else {this.vars.hideSubtitle = !this.vars.hideSubtitle; this.setSubtitle(this.vars.hideSubtitle);} } break;
		case kF11: LBPlayer.onKeyAction = true; LBPlayer.isVideoEvent = true; break;
		default: LBPlayer.onKeyAction = true; LBPlayer.isVideoEvent = false; break;
	}
};
// function - do something if special keys released
LBPlayer.prototype.onKeyup = function(e) {
	var kc  = (window.event) ? event.keyCode : e.keyCode; 	// MSIE or Firefox?
	var kCRTL = (window.event) ? 17 : e.DOM_VK_CONTROL;		// for CRTL & x
	
	switch(kc) {
		case kCRTL: this.vars.keyHolderCRTL = false; break;
		default: break;
	}
};
// function - try to find next suitable video element
LBPlayer.prototype.getNextVideo = function() {
	if(LBPlayer.videoFocused !== null) {
		var vid = LBPlayer.videoFocused.id;
		for(var i = 0, j=LBPlayers.length; i<j; i++) {
			if(vid === LBPlayers[i].options.vid && LBPlayers[parseInt(i+1, 10)] != "undefined") {
				this.setVideoToFocus(LBPlayers[parseInt(i+1, 10)].options.vid); return;
			} else {
				this.setVideoToFocus(LBPlayers[0].options.vid); return;
			}
		}
	}
};
// function - set video element in window focus
LBPlayer.prototype.setVideoToFocus = function(vid) {
	var el = LBPlayer.$(vid);
	if(el !== null) {
		if(LBPlayer.videoFocused !== null) {
			var ovid = LBPlayer.videoFocused.id;
			if(ovid !== vid) {
				// blur old video element
				LBPlayer.focusVideo(false, ovid);
				// focus new video element
				LBPlayer.focusVideo(true, vid);
			}
		} else {
			// focus new video element
			LBPlayer.focusVideo(true, vid);
		}
		// get position of focused video
		var selectedPosX = 0, selectedPosY = 0, top = 50;
		while(el != null) {
			selectedPosX += el.offsetLeft;
			selectedPosY += el.offsetTop;
			el = el.offsetParent;
		}
		// scroll to focused video
		window.scrollTo(selectedPosX, selectedPosY - top);
	}
};
// function - create and set embed code
LBPlayer.prototype.createEmbedCode = function(type) {
	var vid = this.options.vid;
	LBPlayer.$(vid+"_embed_code_user").innerHTML = "";
	// get domain url
	var url = self.location.href;
	var pos = url.lastIndexOf('/');
	url = url.substring(0, pos+1);
	// create embed code for video
	var lbp = "";
	var cssStyles = document.getElementsByTagName("link");
	for(var i=0, j=cssStyles.length; i<j; i++) { if((cssStyles[i].href).toLowerCase().indexOf('leanbackplayer') > -1) { 
		var pos = (cssStyles[i].href).lastIndexOf('?');
		pos = ((pos > 0) ? pos : (cssStyles[i].href).length);
		var cssHref = (cssStyles[i].href).substring(0, pos);
		var css = document.createElement("link");
		LBPlayer.mergeObjs(css, {rel: "stylesheet", media: "screen", type: "text/css", title: "theme", href: cssHref});
		var p = document.createElement("div"); p.appendChild(css);
		lbp += (p.innerHTML).replace(url, "");
	}}
	var jsCode = document.getElementsByTagName("script");
	for(var i=0, j=jsCode.length; i<j; i++) { if((jsCode[i].src).toLowerCase().indexOf('leanbackplayer') > -1) { 
		var pos = (jsCode[i].src).lastIndexOf('?');
		pos = ((pos > 0) ? pos : (jsCode[i].src).length);
		var jsSrc = (jsCode[i].src).substring(0, pos);
		var js = document.createElement("script");
		LBPlayer.mergeObjs(js, {type: "text/javascript", src: jsSrc});
		var p = document.createElement("div"); p.appendChild(js);
		lbp += (p.innerHTML).replace(url, "");
	}}
	var txt = lbp+this.vars.embedCode;
	// change sources (href,src,poster)
	var url = self.location.href;
	var pos = url.lastIndexOf('/');
	url = url.substring(0, pos+1);
	txt = txt.replace(/src="/g, 'src="'+url);
	txt = txt.replace(/href="/g, 'href="'+url);
	txt = txt.replace(/poster="/g, 'poster="'+url);
	txt = txt.replace(/\/.\//g, '/');
	txt = txt.replace(/(\s)\s+/g, "$1");
	LBPlayer.showEl(vid+"_embed_code");
	switch(type) {
		case "video": LBPlayer.$(vid+"_embed_code_user").value = "<div>"+txt+"</div>"; LBPlayer.$(vid+"_embed_code_user").select(); break;
		case "url": LBPlayer.$(vid+"_embed_code_user").value = self.location.href; LBPlayer.$(vid+"_embed_code_user").select(); break;
	}
};
/** ------------------------------ */
// function - add event to given object
LBPlayer.addEvent = function(obj, type, fn) {
	if (obj.addEventListener) { obj.addEventListener(type, fn, false);
	} else if (obj.attachEvent) {
		obj["e"+type+fn] = fn;
		obj[type+fn] = function() { obj["e"+type+fn]( window.event ); };
		obj.attachEvent( "on"+type, obj[type+fn] );
	}
};
// function - create element and append element as child to object
LBPlayer.createHTMLEl = function(objId, tagName, attr){
	var el = document.createElement(tagName); el = LBPlayer.mergeObjs(el, attr);
	if(objId !== "" && objId !== null) {LBPlayer.$(objId).appendChild(el);}
	return el;
};
// function - merge two objects
LBPlayer.mergeObjs = function(obj1, obj2){ if(obj1 !== null) {for(var attrname in obj2) {obj1[attrname] = obj2[attrname];};} return obj1; };
// function - blur/focus video element
LBPlayer.focusVideo = function(f, vid) {
	var cssClass = "h5_lb_player h5_lb_smallscreen";
	if(f) {
		// focus video
		LBPlayer.$(vid).focused = true;
		(LBPlayer.$(vid).parentNode).removeAttribute("class");
		LBPlayer.mergeObjs((LBPlayer.$(vid).parentNode), {className: cssClass});
		LBPlayer.videoFocused = LBPlayer.$(vid);
	} else {
		// blur video
		LBPlayer.$(vid).focused = false;
		(LBPlayer.$(vid).parentNode).removeAttribute("class");
		LBPlayer.mergeObjs((LBPlayer.$(vid).parentNode), {className: cssClass+" h5_lb_unfocused"});
		LBPlayer.showEl(vid+"_big_play_button");
		// pause video when focused lost
		var o = LBPlayer.getObj(LBPlayers, vid);
		if(!o.vObj.paused) {o.onPlay();}
		LBPlayer.videoFocused = null;
	}
};
// function - maybe used by IFrame embedding page
LBPlayer.scrollToVideo = function(vid) {
	var el = LBPlayer.$(vid);
	// get position of focused video
	var selectedPosX = 0, selectedPosY = 0, top = 50;
	while(el != null) {
		selectedPosX += el.offsetLeft;
		selectedPosY += el.offsetTop;
		el = el.offsetParent;
	}
	// scroll to focused video
	window.scrollTo(selectedPosX, selectedPosY - top);
};
// function - get player by id from players-list
LBPlayer.getObj = function(parent, id) {
    for(var i = 0, j = LBPlayers.length; i<j; i++) {if(LBPlayers[i].options.vid === id) { return LBPlayers[i]; }}
};
// function - get size of browser
LBPlayer.getBrowserSizeXY = function() {
	var intH = 0, intW = 0;
	if(typeof window.innerWidth  == 'number' ) { //Non-IE
		intH = window.innerHeight; intW = window.innerWidth;
	} else if(document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) { //IE 6+ in 'standards compliant mode'
		intH = document.documentElement.clientHeight; intW = document.documentElement.clientWidth;
	} else if(document.body && (document.body.clientWidth || document.body.clientHeight)) { //IE 4 compatible
		intH = document.body.clientHeight;	intW = document.body.clientWidth;
	}
	return { width: parseInt(intW, 10), height: parseInt(intH, 10) };
};
// function - get size of visible page
LBPlayer.getPageSizeXY = function() {
	var intH = 0, intW = 0;
	intH = document.documentElement.scrollHeight; intW = document.documentElement.scrollWidth;
	if(window.innerWidth<intW) {intW=window.innerWidth;}
	if(window.innerHeight<intH) {intH=window.innerHeight;}
	return { width: parseInt(intW, 10), height: parseInt(intH, 10) };
};
// function - get css-style attribute of element
LBPlayer.getElemStyle = function(el, styleProp) {
	if(!el) {return 0;}
	var y;
	if(el.currentStyle) {y = el.currentStyle[styleProp];}
	else if(window.getComputedStyle){y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);}
	return y;
};
// function - log to console
LBPlayer.log = function(o) {
	if(typeof opera == 'object' && typeof opera.postError == 'function') {	// Opera console
		opera.postError(o);
	} else if(typeof console == 'object' && typeof console.log == 'function') {	// IE+Safari console
		console.log(o);
	} else if(typeof window.console == 'object' && typeof window.console.log == 'function') {	// Gecko+Webkit+??? console
		window.console.log(o);
	}
};
// function - show element
LBPlayer.showEl = function(el) {if(LBPlayer.$(el) !== null) {LBPlayer.$(el).style.display = "block";}};
// function - hide element
LBPlayer.hideEl = function(el) {if(LBPlayer.$(el) !== null) {LBPlayer.$(el).style.display = "none";}};
// function - get an element by given "id"
LBPlayer.$ = function(id) {
	if(typeof(document.getElementById(id)) != "object" && document.getElementById(id).tagName.toUpperCase() != "OBJECT") {return null;}
	else {return document.getElementById(id);}
};
// function - create XML Http Request
LBPlayer.XHR = function() {
	var xhr;
	try {
		xhr = new XMLHttpRequest();
	} catch(ms) {
		try {
			xhr = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (nonms) {
			try {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (failed) {
				xhr = null;
			}
		}			
	}
	return xhr;
};
// function - todo if Android
LBPlayer.onAndroid = function(v, source) {
	var hasID = true;
	var pid = null;
	if((v.parentNode).getAttribute("id") !== null && (v.parentNode).getAttribute("id") !== "") {
		pid = (v.parentNode).getAttribute("id");
	} else {
		pid = "h5vp_id_android";
		hasID = false;
	}
	LBPlayer.mergeObjs(v.parentNode, {id: pid});
	// add css class to video element and video parent
	LBPlayer.mergeObjs(LBPlayer.$(pid), {className: "h5_lb_player h5_lb_smallscreen"});
	LBPlayer.mergeObjs(v, {className: "h5_lb_video"});
	// create and add big play button
	var bid = "android_play"+LBPlayer.videoCount;
	LBPlayer.createHTMLEl(pid, "div", {id: bid, className: "big_play_button", onclick: function() {v.play();}, title: LBPlayer.Lang.Play});
	LBPlayer.createHTMLEl(bid, "div");
	if(!hasID) {(v.parentNode).removeAttribute("id");}
	/*-----------------------*/
	// force source to load
	v.src = source; // forcing first playable source
	return;
};
// function - todo if iOS 3.x (for the poster-bug)
LBPlayer.onIOS = function(v, source) {
	/*-----------------------*/
	// prepare
	var hasID = true;
	var pid = null;
	if((v.parentNode).getAttribute("id") !== null && (v.parentNode).getAttribute("id") !== "") {
		pid = (v.parentNode).getAttribute("id");
	} else {
		pid = "h5vp_id_android";
		hasID = false;
	}
	LBPlayer.mergeObjs(v.parentNode, {id: pid});
	/*-----------------------*/
	// add css classes to video element and video parent
	LBPlayer.mergeObjs(LBPlayer.$(pid), {className: "h5_lb_player h5_lb_smallscreen"});
	LBPlayer.mergeObjs(v, {className: "h5_lb_video"});
	/*-----------------------*/
	// add iOS3.2 Big Play Button on iPhone, iPod
	/*
	if(LBPlayer.isIOS3_2() && LBPlayer.videoCount == 0) {
		v.controls = false;
		//create and add big play button
		var bid = "ios_play"+LBPlayer.videoCount;
		LBPlayer.createHTMLEl(pid, "div", {id: bid, className: "ios_big_play_button", onclick: function() {LBPlayer.hideEl(bid); v.play(); v.controls = true;}, title: LBPlayer.Lang.Play});
		LBPlayer.createHTMLEl(bid, "div");
	}
	*/
	/*-----------------------*/
	// clean up
	if(!hasID) {(v.parentNode).removeAttribute("id");}
	/*-----------------------*/
	// force source to load
	v.src = source; // forcing first playable source
	// as explained in http://developer.apple.com/library/safari/#documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/AudioandVideoTagBasics/AudioandVideoTagBasics.html
	// video.load() has no effect on iOS (TODO: test without it!!)
	v.load(); // forcing the source on this devices
	/*-----------------------*/
	return;
};
// OS & Device Checks
LBPlayer.isAndroid = function() {return ((navigator.userAgent.toLowerCase().indexOf('android') > -1) ? true : false);};
LBPlayer.isIPad = function() {return ((navigator.userAgent.toLowerCase().indexOf('ipad') > -1) ? true : false);};
LBPlayer.isIPhone = function() {return ((navigator.userAgent.toLowerCase().indexOf('iphone') > -1) ? true : false);};
LBPlayer.isIPod = function() {return ((navigator.userAgent.toLowerCase().indexOf('ipod') > -1) ? true : false);};
LBPlayer.isIOS3_2 = function() {return ((navigator.userAgent.toLowerCase().indexOf('os 3_2') > -1) ? true : false);};
LBPlayer.isIOS4_0_1 = function() {return ((navigator.userAgent.toLowerCase().indexOf('os 4_0_1') > -1) ? true : false);};
LBPlayer.isIOS4_1 = function() {return ((navigator.userAgent.toLowerCase().indexOf('os 4_1') > -1) ? true : false);};
LBPlayer.isIOS4_2 = function() {return ((navigator.userAgent.toLowerCase().indexOf('os 4_2') > -1) ? true : false);};
LBPlayer.hasSubtitle = function(v) {
	var c = v.children;
    for (var i=0, j = c.length; i<j; i++) {if (c[i].tagName !== null && c[i].tagName.toLowerCase() == "track") {return true;}}
	return false;
};
LBPlayer.videoCount = 0;
// function - check if video is available and sources playable
LBPlayer.checkVideoSource = function(v) {
	var c = v.children;
    for (var i=0, j = c.length; i<j; i++) {
		if (c[i].tagName !== null && c[i].tagName.toLowerCase() == "source") {
			var playType = v.canPlayType(c[i].type);
			// first check of android device
			if (LBPlayer.isAndroid() && (c[i].src.match(/mp4/) || c[i].src.match(/m4v/))) {
				// @video, @firstPlayableSource
				LBPlayer.onAndroid(v, c[i].src);
				LBPlayer.videoCount++;
				return true;
			} else if(playType == "probably" || playType == "maybe") { // check for other browsers and devices
				if(LBPlayer.isIPad() || LBPlayer.isIPhone() || LBPlayer.isIPod()) { // check if iPad, iPhone, iPod
					// @video, @firstPlayableSource
					LBPlayer.onIOS(v, c[i].src);
				}
				LBPlayer.videoCount++;
				return true;
			}
		}
    }
    return false;
};
// function - setup
LBPlayer.setup = function(options) {
	var vars = {};
	var elements = document.getElementsByTagName("video");
	for(var i=0,j=elements.length; i<j; i++) {
		if(LBPlayer.checkVideoSource(elements[i])) {
			if(!LBPlayer.isAndroid() && !LBPlayer.isIPad() && !LBPlayer.isIPhone() && !LBPlayer.isIPod()) {
				var p = elements[i].parentNode;
				LBPlayer.mergeObjs(vars, {embedCode: p.innerHTML});
				var pid = "h5vp_id"+i;
				LBPlayer.mergeObjs(p, {id: pid});
				var vid = "h5v_id"+i;
				LBPlayer.mergeObjs(elements[i], {id: vid, tabIndex: "0"});
				// autobuffer only first video
				if(i > 0) {options.vBuffer = false;}
				// add video-id to options-vars
				LBPlayer.mergeObjs(options, {vid: vid});
				// add vars to player
				LBPlayer.mergeObjs(vars, {firstPlayable: LBPlayer.trash, vidCount: i});
				// create reference for video-tag elements to handle
				LBPlayers.push(new LBPlayer(options, vars));
			}
		}
	}
	// add tabindex to body - not an attribute, but it works to tab (opera fix for the second tab-round in page)
	if(navigator.userAgent.toLowerCase().indexOf('opera') > -1) {
		LBPlayer.mergeObjs(document.body, {tabIndex: "0"});
	}
};
/**
	variables and attributes for Leanback player
 */
// list of players on the page
var LBPlayers = new Array();
// to store video that has focus
LBPlayer.videoFocused = null;
// to store if (key)event is a video interaction
LBPlayer.isVideoEvent = false;
// if key pressed that supports feature in browser
LBPlayer.onKeyAction = false;
// language object
LBPlayer.Lang = {};
/**---------------------------------------------------------------*/
/**-------------------- LEANBACK PLAYER ABOVE --------------------*/
/**---------------------------------------------------------------*/
/** 
	HERE YOU CAN CHANGE and SETUP YOUR PLAYER by CHANGING ATTRIBUTES
 */
// function - if window loaded do something
window.onload = function() {
	// to be changed
	LBPlayer.setup({
		useStandardControls: false, // use standard browser controls
		hideControls: true,			// delayed hiding of (new) controls
		hideControlsTimeout: 4,		// delayed hiding of (new) controls after x seconds
		vBuffer: true,				// buffering first video, if browser supports "autobuffer" and not "preload" attribute
		showPlaybackRate: true,		// if browser supports playbackrate, show controls element
		showSubtitle: true,			// if there are subtitles, show controls element to change
		posterRestore: true,		// if poster-image should reappear once video ended
		volume: 3,					// set up start-volume (0 - 8)
		seekSkipSec: 3,				// set up seek-skip in sec., to jump back or forward x sec.
		seekSkipPerc: 10,			// set up seek-skip in percent., to jump back or forward x percent.
		language: "en",				// set up default language, en = english, de = german, fr = french, ...
	});
}
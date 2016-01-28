(function ($) {
  AblePlayer.prototype.initDescription = function() { 

    // set default mode for delivering description (open vs closed) 
    // based on availability and user preference       
    
    // called when player is being built, or when a user  
    // toggles the Description button or changes a description-related preference 
    // In the latter two scendarios, this.refreshingDesc == true via control.js > handleDescriptionToggle()
    
    // The following variables are applicable to delivery of description: 
    // prefDesc == 1 if user wants description (i.e., Description button is on); else 0 
    // prefDescFormat == either 'video' or 'text'
    // prefDescPause == 1 to pause video when description starts; else 0 
    // prefVisibleDesc == 1 to visibly show text-based description area; else 0 
    // hasOpenDesc == true if a described version of video is available via data-desc-src attribute
    // hasClosedDesc == true if a description text track is available 
    // this.useDescFormat == either 'video' or 'text'; the format ultimately delivered 
    // descOn == true if description of either type is on

    if (!this.refreshingDesc) { 
      // this is the initial build 
      // first, check to see if there's an open-described version of this video  
      // checks only the first source since if a described version is provided, 
      // it must be provided for all sources  
      this.descFile = this.$sources.first().attr('data-desc-src');
      if (typeof this.descFile !== 'undefined') { 
        this.hasOpenDesc = true;
      }
      else { 
        this.hasOpenDesc = false;              
      }
    }
    
    // update this.useDescFormat based on media availability & user preferences   
    if (this.prefDesc) {
      if (this.hasOpenDesc && this.hasClosedDesc) { 
        // both formats are available. Use whichever one user prefers 
        this.useDescFormat = this.prefDescFormat; 
        this.descOn = true; 
      }
      else if (this.hasOpenDesc) { 
        this.useDescFormat = 'video'; 
        this.descOn = true; 
      }
      else if (this.hasClosedDesc) { 
        this.useDescFormat = 'text'; 
        this.descOn = true; 
      }
    }
    else { // description button is off 
      if (this.refreshingDesc) { // user just now toggled it off 
        this.prevDescFormat = this.useDescFormat;
        this.useDescFormat = false; 
        this.descOn = false; 
      }
      else { // desc has always been off
        this.useDescFormat = false;        
      }
    }

    if (this.descOn) {

      if (this.useDescFormat === 'video') { 
        if (!this.usingAudioDescription()) {
          this.swapDescription();   
        }
        // hide description div 
        this.$descDiv.hide();
        this.$descDiv.removeClass('able-clipped');     
        this.showAlert(this.tt.alertDescribedVersion);                   
      }
      else if (this.useDescFormat === 'text') {
        if (this.usingAudioDescription()) {
        // switch from described version to non-described version 
          this.swapDescription();   
        }        
        this.$descDiv.show();
        if (this.prefVisibleDesc) { // make it visible to everyone
          this.$descDiv.removeClass('able-clipped');
        }
        else { // keep it visible to screen readers, but hide from everyone else
          this.$descDiv.addClass('able-clipped'); 
        }
        this.showDescription(this.getElapsed());
      }
    }
    else { // description is off. 
      if (this.prevDescFormat === 'video') { // user was previously using description via video 
        if (this.usingAudioDescription()) {
          this.swapDescription();   
        }
      }
      else if (this.prevDescFormat === 'text') { // user was previously using text description 
        // hide description div from everyone, including screen reader users
        this.$descDiv.hide();
        this.$descDiv.removeClass('able-clipped');        
      }
    }
    this.refreshingDesc = false; 
  };

  // Returns true if currently using audio description, false otherwise.
  AblePlayer.prototype.usingAudioDescription = function () {
    
    return (this.$sources.first().attr('data-desc-src') === this.$sources.first().attr('src'));
  };

  AblePlayer.prototype.swapDescription = function() { 
    // swap described and non-described source media, depending on which is playing
    // this function is only called in two circumstances: 
    // 1. Swapping to described version when initializing player (based on user prefs & availability)
    // 2. User is toggling description 

    var i, origSrc, descSrc, srcType, jwSourceIndex, newSource;

    if (!this.usingAudioDescription()) {
      
      for (i=0; i < this.$sources.length; i++) { 
        // for all <source> elements, replace src with data-desc-src (if one exists)
        // then store original source in a new data-orig-src attribute 
        origSrc = this.$sources[i].getAttribute('src');
        descSrc = this.$sources[i].getAttribute('data-desc-src'); 
        srcType = this.$sources[i].getAttribute('type');
        if (descSrc) {
          this.$sources[i].setAttribute('src',descSrc);
          this.$sources[i].setAttribute('data-orig-src',origSrc);
        }       
        if (srcType === 'video/mp4') { 
          jwSourceIndex = i;
        }       
      }
      if (this.initializing) { // user hasn't pressed play yet 
        this.swappingSrc = false; 
      }
      else { 
        this.swappingSrc = true; 
      }
    }   
    else { 
      // the described version is currently playing
      // swap back to the original 
      for (i=0; i < this.$sources.length; i++) { 
        // for all <source> elements, replace src with data-orig-src
        origSrc = this.$sources[i].getAttribute('data-orig-src');
        srcType = this.$sources[i].getAttribute('type');        
        if (origSrc) {
          this.$sources[i].setAttribute('src',origSrc);
        }       
        if (srcType === 'video/mp4') { 
          jwSourceIndex = i;
        }
      }
      // No need to check for this.initializing 
      // This function is only called during initialization 
      // if swapping from non-described to described
      this.swappingSrc = true; 
    }
    // now reload the source file.
    if (this.player === 'html5') {
      this.media.load();
    }
    else if (this.player === 'jw' && this.jwPlayer) { 
      newSource = this.$sources[jwSourceIndex].getAttribute('src');
      this.jwPlayer.load({file: newSource}); 
    }
    else if (this.player === 'youtube') {
      // Can't switch youtube tracks, so do nothing.
      // TODO: Disable open descriptions button with Youtube.
    }
  };

  AblePlayer.prototype.showDescription = function(now) { 

    // there's a lot of redundancy between this function and showCaptions 
    // Trying to combine them ended up in a mess though. Keeping as is for now. 

    var d, thisDescription;
    var flattenComponentForDescription = function (component) {
      var result = [];
      if (component.type === 'string') {
        result.push(component.value);
      }
      else {
        for (var ii in component.children) {
          result.push(flattenComponentForDescription(component.children[ii]));
        }
      }
      return result.join('');
    }
  
    var cues;
    if (this.selectedDescriptions) {
      cues = this.selectedDescriptions.cues;
    }
    else if (this.descriptions.length >= 1) {
      cues = this.descriptions[0].cues;
    }
    else {
      cues = [];
    }
    for (d in cues) {
      if ((cues[d].start <= now) && (cues[d].end > now)) {      
        thisDescription = d;
        break;
      }
    }
    if (typeof thisDescription !== 'undefined') {  
      if (this.currentDescription !== thisDescription) { 
        // load the new description into the container div 
        this.$descDiv.html(flattenComponentForDescription(cues[thisDescription].components));
        if (this.prefDescPause) { 
          this.pauseMedia();
        }
        this.currentDescription = thisDescription;
      } 
    }
    else {     
      this.$descDiv.html('');
      this.currentDescription = -1;
    } 
  };

})(jQuery);

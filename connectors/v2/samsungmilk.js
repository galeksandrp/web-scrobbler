'use strict';

/* global Connector */

Connector.playerSelector = '.play.playing';

Connector.getArtistTrack = function () {
  $('.famous-surface').each(function () {
	if ($(this).css('z-index') === '-1') {
	  console.log($(this));
	  return {artist: $(this).find('.track-info h1').text(), track: $(this).find('.track-info h2').text()};
	}
  });
};

Connector.isPlaying = function () {
  return $('.play.playing').hasClass('active');
};

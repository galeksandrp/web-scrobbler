'use strict';

/* global Connector */

Connector.playerSelector = '#playing';

Connector.getArtistTrack = function () {
	var text = $('.active.music .fnn-title').text();
	var separator = this.findSeparator(text);

	var artist = null;
	var track = null;

	if (separator !== null) {
		artist = text.substr(0, separator.index).trim();
		track = text.substr(separator.index + separator.length).trim();
	}

	return {artist: artist, track: track};
};

Connector.isPlaying = function () {
	return !$('#controls a[title=Play] i').is(':visible');
};

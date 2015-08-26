'use strict';

/* global Connector */

Connector.playerSelector = '.album-tracks';

Connector.getArtistTrack = function () {
	var text = $('.play').attr('download');
	var separator = this.findSeparator(text);

	var artist = null;
	var track = null;

	if (separator !== null) {
		artist = text.substr(0, separator.index);
		track = text.substr(separator.index + separator.length);
	}

	return {artist: artist, track: track};
};

Connector.isPlaying = function () {
	return $('.play').text() === 'll';
};

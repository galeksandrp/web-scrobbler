'use strict';

/* global Connector */

Connector.playerSelector = 'body';

Connector.artistSelector = '.track_metadata .artist_title';

Connector.trackSelector = '.track_metadata .song_title';

Connector.isPlaying = function () {
	return $('.play_pause').hasClass('playing');
};

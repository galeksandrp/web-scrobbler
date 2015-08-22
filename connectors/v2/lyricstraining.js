'use strict';

/* global Connector */

Connector.playerSelector = '#page';

Connector.artistSelector = '#lyrics-info h2 a';

Connector.trackSelector = '#lyrics-info h1';

Connector.isPlaying = function () {
	return !$('#focus-warn').hasClass('show');
};

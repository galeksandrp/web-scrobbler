'use strict';

Connector.playerSelector = '#player-logo';

Connector.artistTrackSelector = '#track';

Connector.isPlaying = () => {
	const pauseButton = document.querySelector('#player-control-playing');
	return pauseButton.style['display'] === 'inline';
};

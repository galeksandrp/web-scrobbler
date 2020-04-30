'use strict';

const PLAYER_TYPES = {
	// https://www.residentadvisor.net/tracks ("Popular tracks" at the top)
	// https://www.residentadvisor.net/tracks/931382 ("Popular tracks" at the bottom)
	POPULAR: 'Popular tracks',
	// https://www.residentadvisor.net/tracks ("Archived tracks" in the middle)
	ARCHIVED: 'Archived tracks',
	// https://www.residentadvisor.net/tracks/931382 ("Single track" in the middle)
	SINGLE: 'Single track',
	// https://www.residentadvisor.net/record-label.aspx?id=15687&show=tracks (Label tracks)
	// https://www.residentadvisor.net/dj/hotsince82/tracks (DJ tracks)
	DJ_OR_LABEL: 'DJ tracks or label tracks',
	// https://www.residentadvisor.net/dj/secretsundaze/top10?chart=214484 (Chart tracks)
	CHART: 'Chart track',

	UNKNOWN: 'Unknown player'
};

Connector.playerSelector = '.content-list';

// This identifies the track element depending on the parents of the play button
function getTrackContainer() {
	// Iterate through all parents until it also finds a cover art
	const playButtons = document.querySelectorAll('.play.paused');
	for (const button of playButtons) {
		let parent = button.parentElement;
		while (parent) {
			if (parent.querySelector('img[src^="/images/cover/"]') !== null) {
				return parent;
			}

			parent = parent.parentElement;
		}
	}

	return null;
}

function typeOfTrack(trackContainer) {
	const containerTagName = trackContainer.tagName.toLowerCase();

	if (containerTagName === 'article') {
		return PLAYER_TYPES.POPULAR;
	} else if (containerTagName === 'ul') {
		return PLAYER_TYPES.ARCHIVED;
	} else if (containerTagName === 'div') {
		return PLAYER_TYPES.SINGLE;
	}

	const parentContainer = trackContainer.parentNode;
	if (containerTagName === 'li') {
		if (parentContainer.classList.contains('tracks')) {
			return PLAYER_TYPES.DJ_OR_LABEL;
		} else if (parentContainer.classList.contains('chart')) {
			return PLAYER_TYPES.CHART;
		}
	}

	Util.debugLog('Player not found', 'warn');
	return PLAYER_TYPES.UNKNOWN;
}

Connector.getTrackInfo = () => {
	const trackContainer = getTrackContainer();
	if (!trackContainer) {
		return null;
	}

	let track = null;
	let artist = null;
	let trackArt = null;
	let uniqueID = null;

	switch (typeOfTrack(trackContainer)) {
		case PLAYER_TYPES.POPULAR: {
			const artistTrack = trackContainer.querySelector('div a');
			if (artistTrack !== null) {
				const artistTrackStr = artistTrack.textContent;
				({ artist, track } = Util.splitArtistTrack(artistTrackStr));
			}
			break;
		}

		case PLAYER_TYPES.SINGLE: {
			const artistTrackStr = Util.getTextFromSelectors('#sectionHead h1');
			({ artist, track } = Util.splitArtistTrack(artistTrackStr));
			break;
		}

		case PLAYER_TYPES.DJ_OR_LABEL: {
			const titleElement = trackContainer.querySelector('.title');
			if (titleElement) {
				const linkElements = titleElement.querySelectorAll('a');
				if (linkElements.length > 1) {
					artist = linkElements[1].textContent;
					track = linkElements[0].textContent;
				}
			}
			break;
		}

		case PLAYER_TYPES.CHART: {
			const artistNode = trackContainer.querySelector('.artist a');
			const trackNode = trackContainer.querySelector('.track a');

			artist = artistNode && artistNode.textContent;
			track = trackNode && trackNode.textContent;
			break;
		}

		case PLAYER_TYPES.ARCHIVED: {
			const artistNode = trackContainer.querySelector('li:last-child .pr8 div.f24');
			const trackNode = trackContainer.querySelector('li:last-child .pr8 a.f24');

			artist = artistNode && artistNode.textContent;
			track = trackNode && trackNode.textContent;
			break;
		}

		case PLAYER_TYPES.UNKNOWN:
			return null;
	}

	const trackArtElement = trackContainer.querySelector('img[src^="/images/cover/"]');
	if (trackArtElement) {
		trackArt = trackArtElement.src;
	}
	const uniqueIdElement = trackContainer.querySelector('.play.player');
	if (uniqueIdElement) {
		uniqueID = uniqueIdElement.getAttribute('data-trackid');
	}

	return { artist, track, uniqueID, trackArt };
};

Connector.pauseButtonSelector = '.play.paused';

Connector.isTrackArtDefault = (trackArtUrl) => {
	return trackArtUrl.endsWith('images/cover/blank.jpg');
};

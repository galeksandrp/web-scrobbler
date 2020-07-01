<template>
	<div class="main-container" @click.alt="showDebugInfo()">
		<a class="album-art" :href="getAlbumArt()" target="_blank">
			<img
				class="album-art"
				alt="Cover art"
				:src="getAlbumArt()"
				:title="L('infoOpenAlbumArt')"
			/>
		</a>
		<div class="popup-container" v-if="isInfoMode()">
			<div class="info-fields">
				<div class="song-field track">
					<a
						href="#"
						target="_blank"
						:href="song.metadata.artistUrl"
						:title="L('infoViewArtistPage')"
					>
						{{ song.getTrack() }}
					</a>
				</div>
				<div class="song-field">
					<a
						href="#"
						target="_blank"
						:href="song.metadata.trackUrl"
						:title="L('infoViewTrackPage')"
					>
						{{ song.getArtist() }}
					</a>
				</div>
				<div class="song-field">
					<a
						href="#"
						target="_blank"
						:href="song.metadata.albumUrl"
						:title="L('infoViewAlbumPage')"
					>
						{{ song.getAlbum() }}
					</a>
				</div>
				<div class="song-field">
					{{ song.getAlbumArtist() }}
				</div>
				<div class="tags">
					<span class="tag counter">
						<sprite-icon class="tag-icon" :icon="lastFm" />

						<span
							:title="
								L(
									'infoYourScrobbles',
									song.metadata.userPlayCount
								)
							"
							>{{ song.metadata.userPlayCount }}</span
						>
					</span>
					<span class="tag">{{ label }}</span>
				</div>
			</div>
			<div class="edit-controls">
				<button
					type="button"
					class="edit-btn control-btn"
					:disabled="isSongControlDisabled()"
					:title="L(getEditTitleId())"
					@click="setEditMode()"
				>
					<sprite-icon :icon="pencilSquare" />
				</button>
				<button
					type="button"
					class="revert-btn control-btn"
					v-if="song.flags.isCorrectedByUser"
					:disabled="isSongControlDisabled()"
					:title="L(getRevertTitleId())"
					@click="revertSong()"
				>
					<sprite-icon :icon="arrowCounterClockwise" />
				</button>
				<button
					type="button"
					class="unskip-btn control-btn"
					v-if="song.flags.isSkipped"
					:title="L('infoSkippedTitle')"
				>
					<sprite-icon :icon="slashCircle" />
				</button>
				<button
					type="button"
					class="skip-btn control-btn"
					v-else
					:disabled="isSongControlDisabled()"
					:title="L(getSkipTitleId())"
					@click="skipSong"
				>
					<sprite-icon :icon="slashCircle" />
				</button>
				<button
					type="button"
					class="unlove-btn control-btn"
					v-if="song.metadata.userloved"
					:title="L('infoUnlove')"
					@click="setSongLoved(false)"
				>
					<sprite-icon :icon="heartFill" />
				</button>
				<button
					type="button"
					class="love-btn control-btn"
					v-else
					:title="L('infoLove')"
					@click="setSongLoved(true)"
				>
					<sprite-icon :icon="heart" />
				</button>
			</div>
		</div>
		<div id="edit" class="popup-container" v-if="isEditMode()">
			<div>
				<input
					type="text"
					tabindex="1"
					v-model="track"
					:placeholder="L('trackPlaceholder')"
				/>
				<input
					type="text"
					tabindex="2"
					v-model="artist"
					:placeholder="L('artistPlaceholder')"
				/>
				<input
					type="text"
					tabindex="3"
					v-model="album"
					:placeholder="L('albumPlaceholder')"
				/>
				<input
					type="text"
					tabindex="4"
					v-model="albumArtist"
					:placeholder="L('albumArtistPlaceholder')"
				/>
			</div>
			<div class="edit-controls">
				<button
					type="button"
					class="submit-btn control-btn"
					:disabled="isEditControlDisabled()"
					:title="L(getSubmitTitleId())"
					@click="submitChanges()"
				>
					<sprite-icon :icon="check2Square" />
				</button>
				<button
					type="button"
					class="swap-btn control-btn"
					:disabled="isEditControlDisabled()"
					:title="L(getSwapTitleId())"
					@click="swapArtistAndTrack()"
				>
					<sprite-icon :icon="arrowLeftRight" />
				</button>
			</div>
		</div>
		<div class="debug-container" v-if="isDebugInfoVisible">
			<pre>{{ song.toString() }}</pre>
		</div>
	</div>
</template>

<script>
import { extension, runtime } from 'webextension-polyfill';

import arrowCounterClockwise from 'bootstrap-icons/icons/arrow-counterclockwise.svg';
import arrowLeftRight from 'bootstrap-icons/icons/arrow-left-right.svg';
import check2Square from 'bootstrap-icons/icons/check2-square.svg';
import heart from 'bootstrap-icons/icons/heart.svg';
import heartFill from 'bootstrap-icons/icons/heart-fill.svg';
import lastFm from 'simple-icons/icons/last-dot-fm.svg';
import pencilSquare from 'bootstrap-icons/icons/pencil-square.svg';
import slashCircle from 'bootstrap-icons/icons/slash-circle.svg';

import SpriteIcon from '@/ui/shared/sprite-icon.vue';

import { BASE_FIELDS } from 'object/song';

const { webScrobbler } = extension.getBackgroundPage();

const modeEdit = 0;
const modeInfo = 1;

const defaultTrackArt = '/icons/cover_art_default.png';

export default {
	data() {
		return {
			mode: modeInfo,
			song: null,
			label: null,

			artist: null,
			track: null,
			album: null,
			albumArtist: null,
			isSubmitAllowed: true,

			isDebugInfoVisible: false,

			arrowCounterClockwise,
			arrowLeftRight,
			check2Square,
			heart,
			heartFill,
			lastFm,
			pencilSquare,
			slashCircle,
		};
	},
	created() {
		runtime.onMessage.addListener((request) => {
			if (request.type !== 'EVENT_SONG_UPDATED') {
				return;
			}

			this.updateCurrentSong();
		});

		this.updateCurrentSong();
	},
	components: { SpriteIcon },
	methods: {
		getAlbumArt() {
			return this.song.getTrackArt() || defaultTrackArt;
		},

		/** Actions */

		revertSong() {
			webScrobbler.revertNowPlayingSong();
		},

		skipSong() {
			webScrobbler.skipNowPlayingSong();
		},

		setSongLoved(isLoved) {
			webScrobbler.setNowPlayingSongLoved(isLoved);
		},

		swapArtistAndTrack() {
			const { artist, track } = this;

			this.artist = track;
			this.track = artist;
		},

		submitChanges() {
			this.setInfoMode();

			if (!this.isSongInfoChanged()) {
				return;
			}

			const { artist, track, album, albumArtist } = this;
			webScrobbler.correctNowPlayingSong({
				artist,
				track,
				album,
				albumArtist,
			});
		},

		/** Controls */

		getEditTitleId() {
			return this.isSongControlDisabled()
				? 'infoEditUnableTitle'
				: 'infoEditTitle';
		},

		getRevertTitleId() {
			return this.isSongControlDisabled()
				? 'infoRevertUnableTitle'
				: 'infoRevertTitle';
		},

		getSkipTitleId() {
			return this.isSongControlDisabled()
				? 'infoSkipUnableTitle'
				: 'infoSkipTitle';
		},

		getSubmitTitleId() {
			return this.isEditControlDisabled()
				? 'infoSubmitUnableTitle'
				: 'infoSubmitTitle';
		},

		getSwapTitleId() {
			return this.isEditControlDisabled()
				? 'infoSwapUnableTitle'
				: 'infoSwapTitle';
		},

		isEditControlDisabled() {
			return !(this.artist && this.track);
		},

		isSongControlDisabled() {
			return this.song.flags.isScrobbled;
		},

		/** View modes */

		isEditMode() {
			return this.isMode(modeEdit);
		},

		isInfoMode() {
			return this.isMode(modeInfo);
		},

		isMode(mode) {
			return this.mode === mode;
		},

		setEditMode() {
			for (const fieldName of BASE_FIELDS) {
				this[fieldName] = this.song.getField(fieldName);
			}

			this.setMode(modeEdit);
		},

		setInfoMode() {
			this.setMode(modeInfo);
		},

		setMode(mode) {
			this.mode = mode;
		},

		/** Misc */

		isSongInfoChanged() {
			for (const fieldName of BASE_FIELDS) {
				if (this[fieldName] !== this.song.getField(fieldName)) {
					return true;
				}
			}

			return false;
		},

		showDebugInfo() {
			this.isDebugInfoVisible = true;
			console.log(2223);
		},

		updateCurrentSong() {
			this.song = webScrobbler.getNowPlayingSong();
			this.label = webScrobbler.getActiveConnectorLabel();
		},
	},
};
</script>

<style>
/**
 * Generic.
 */

html {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
		'Helvetica Neue', Arial, sans-serif;
}

body {
	background-color: #fff;
	color: #212529;
	font-size: 13px;
	margin: 0px;
	overflow: hidden;
	padding: 0px;
}

a {
	color: #212529;
	text-decoration: none;
}

input {
	width: 199px;
}

/**
 * Containers.
 */

.main-container {
	display: grid;
	grid-template-columns: 136px 224px;
	min-height: 136px;
}

.popup-container {
	display: grid;
	grid-template-columns: 209px;
	grid-template-rows: auto auto;
	margin: 5px;
	margin-left: 10px;
}

.debug-container {
	margin-left: 10px;
	max-width: 360px;
}

/**
 * Controls.
 */

.album-art {
	grid-column: 1;
	grid-row: 1;
	height: 136px;
	width: 136px;
}

.edit-fields,
.info-fields {
	grid-column: 1;
	grid-row: 1;
	line-height: 1.4em;
}

.edit-controls {
	align-self: end;
	grid-column: 1;
	grid-row: 2;
	justify-self: start;
}

.song-field {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.track {
	font-weight: 600;
}

.control-btn {
	background: none;
	border: none;
	color: #495053;
	cursor: pointer;
	margin-right: 0.25rem;
	outline: none;
	padding: 0rem;
	text-align: center;
	width: 1rem;
}

.control-btn[disabled] {
	cursor: default;
}

.control-btn:not([disabled]):hover {
	color: #247ba0;
}

.skip-btn:hover:not([disabled]) {
	color: #d51007;
}

.control-btn.submit-btn:not([disabled]):hover {
	color: #65a858;
}

.control-btn.unskip-btn {
	color: #d51007;
}

.control-btn.unskip-btn:hover {
	color: #d51007;
	cursor: default;
}

.control-btn.love-btn:hover {
	color: #d51007;
}

.control-btn.unlove-btn {
	color: #d51007;
}

.control-btn.unlove-btn:hover {
	color: #495053;
}

/**
 * Tags.
 */

.tags {
	margin-top: 5px;
	white-space: nowrap;
}

.tag {
	background-color: #247ba0;
	border-radius: 3px;
	color: white;
	display: inline-block;
	font-size: 12px;
	height: 20px;
	padding: 0px 5px;
}

.tag-icon {
	color: white;
	height: 16px;
	vertical-align: bottom;
	width: 16px;
}

/**
 * Helpers.
 */

[disabled] {
	color: #aaa;
}
</style>

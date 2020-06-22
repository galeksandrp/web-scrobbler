<template>
	<div role="tabpanel" @click.alt="showHiddenOptions()">
		<div class="options-section">
			<h5>{{ L('optionsGeneral') }}</h5>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionUseNotificationsTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="USE_NOTIFICATIONS"
					/>
					{{ L('optionUseNotifications') }}
				</label>
			</div>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionUnrecognizedNotificationsTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="USE_UNRECOGNIZED_SONG_NOTIFICATIONS"
					/>
					{{ L('optionUnrecognizedNotifications') }}
				</label>
			</div>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionForceRecognizeTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="FORCE_RECOGNIZE"
					/>
					{{ L('optionForceRecognize') }}
				</label>
			</div>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionDisableGaTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="DISABLE_GA"
					/>
					{{ L('optionDisableGa') }}
				</label>
			</div>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionScrobblePodcastsTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="SCROBBLE_PODCASTS"
					/>
					{{ L('optionScrobblePodcasts') }}
				</label>
			</div>
		</div>

		<div class="options-section">
			<h5>Tidal</h5>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionTdlShortTrackNamesTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="Tidal_useShortTrackNames"
					/>
					{{ L('optionTdlShortTrackNames') }}
				</label>
			</div>
		</div>

		<div class="options-section">
			<h5>YouTube</h5>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionYtMusicOnlyTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="YouTube_scrobbleMusicOnly"
					/>
					{{ L('optionYtMusicOnly') }}
				</label>
			</div>
			<div class="form-check">
				<label
					class="form-check-label"
					:title="L('optionYtEntertainmentOnlyTitle')"
				>
					<input
						class="form-check-input"
						type="checkbox"
						v-model="YouTube_scrobbleEntertainmentOnly"
					/>
					{{ L('optionYtEntertainmentOnly') }}
				</label>
			</div>

			<p class="mt-2">
				<small class="text-muted">{{ L('optionYtDesc') }}</small>
			</p>
		</div>

		<div class="options-section" v-if="areHiddenOptionVisible">
			<h5>{{ L('optionsHidden') }}</h5>
			<div class="form-group">
				<label>{{ L('optionScrobblePercent') }}</label>
				<select
					class="custom-select custom-select-sm"
					v-model="SCROBBLE_PERCENT"
				>
					<option v-for="percent in percentValues">
						{{ percent }}
					</option>
				</select>
				<label>% {{ L('optionScrobblePercentSuffix') }}</label>
			</div>
			<p class="mt-2">
				<small class="text-muted">{{ L('optionPercentDesc') }}</small>
			</p>
		</div>

		<div class="options-section">
			<h5>{{ L('optionsSupportedWebsites') }}</h5>
			<div>
				<p>{{ L('optionsEnableDisableHint') }}</p>
				<p>
					<span>{{ L('optionspatternsCustomPatternsHint') }}</span>
					<a
						target="_blank"
						href="https://github.com/web-scrobbler/web-scrobbler/wiki/Custom-URL-patterns"
					>
						{{ L('learnMoreLabel') }}
					</a>
				</p>
			</div>
			<div class="options-section" id="connectors">
				<div class="input-group mb-2">
					<div class="form-check form-switch no-icon">
						<label class="form-check-label font-weight-bold">
							<input
								class="form-check-input"
								type="checkbox"
								v-model="toggleConnectorsValue"
							/>
							{{ L('optionsToggle') }}
						</label>
					</div>
				</div>

				<div
					class="input-group mb-2"
					v-for="connector in connectors"
					:key="connector.id"
				>
					<a href="#" @click.prevent="showModal(connector)">
						<sprite-icon :icon="gearIcon" class="connector-icon" />
					</a>
					<div class="form-check form-switch">
						<label class="form-check-label">
							<input
								class="form-check-input"
								type="checkbox"
								:checked="isConnectorEnabled(connector)"
								@input="
									setConnectorEnabled(
										connector,
										$event.target.checked
									)
								"
							/>
							{{ connector.label }}
						</label>
					</div>
				</div>
			</div>
		</div>
		<add-patterns-modal
			v-if="isModalActive"
			:connector="editedConnector"
			:patterns="getCustomPatterns(editedConnector)"
			@onOkClick="updateCustomPatterns"
			@onClose="hideModal"
		/>
	</div>
</template>

<script>
import AddPatternsModal from '@/ui/options/modals/add-patterns-modal.vue';
import SpriteIcon from '@/ui/shared/sprite-icon.vue';

import { extension } from 'webextension-polyfill';

import { getSortedConnectors } from 'util/util-connector';
import CustomPatterns from 'storage/custom-patterns';

import gearIcon from 'bootstrap-icons/icons/gear.svg';

const { options } = extension.getBackgroundPage();
const {
	getConnectorOption,
	getConnectorOptions,
	getConnectorsList,
	getOption,
	isConnectorEnabled,
	setAllConnectorsEnabled,
	setConnectorEnabled,
	setConnectorOption,
	setOption,
} = options;

const {
	DISABLED_CONNECTORS,
	DISABLE_GA,
	FORCE_RECOGNIZE,
	SCROBBLE_PERCENT,
	SCROBBLE_PODCASTS,
	USE_NOTIFICATIONS,
	USE_UNRECOGNIZED_SONG_NOTIFICATIONS,
} = options;

const connectors = getSortedConnectors();

function makeComputedProperties() {
	const properties = {};
	const optionsList = {
		DISABLE_GA,
		FORCE_RECOGNIZE,
		SCROBBLE_PERCENT,
		SCROBBLE_PODCASTS,
		USE_NOTIFICATIONS,
		USE_UNRECOGNIZED_SONG_NOTIFICATIONS,
	};

	for (const propertyName in optionsList) {
		const optionName = optionsList[propertyName];

		properties[propertyName] = {
			get() {
				return getOption(optionName);
			},
			set(value) {
				setOption(optionName, value);
			},
		};
	}

	for (const connectorLabel of getConnectorsList()) {
		const connectorOptions = getConnectorOptions(connectorLabel);

		for (const optionName of connectorOptions) {
			const propertyName = `${connectorLabel}_${optionName}`;

			properties[propertyName] = {
				get() {
					return getConnectorOption(connectorLabel, optionName);
				},
				set(value) {
					setConnectorOption(connectorLabel, optionName, value);
				},
			};
		}
	}

	return properties;
}

function getToggleConnectorsState() {
	const disabledConnectors = getOption(DISABLED_CONNECTORS);
	return Object.keys(disabledConnectors).length !== connectors.length;
}

export default {
	created() {
		this.loadCustomPatterns();
	},
	data() {
		return {
			connectors,

			gearIcon,

			areHiddenOptionVisible: false,
			customPatterns: {},
			percentValues: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
			toggleConnectorsValue: getToggleConnectorsState(),

			isModalActive: false,
			editedConnector: {},
		};
	},
	components: { AddPatternsModal, SpriteIcon },
	watch: {
		toggleConnectorsValue(newValue) {
			const isEnabled = newValue;

			setAllConnectorsEnabled(isEnabled);
		},
	},
	computed: makeComputedProperties(),
	props: {
		active: Boolean,
	},
	methods: {
		isConnectorEnabled,
		setConnectorEnabled,

		async loadCustomPatterns() {
			this.customPatterns = await CustomPatterns.getData();
		},

		async updateCustomPatterns(patterns) {
			const connectorId = this.editedConnector.id;
			if (patterns.length > 0) {
				this.$set(this.customPatterns, connectorId, patterns);
			} else {
				this.$delete(this.customPatterns, connectorId);
			}
			await CustomPatterns.saveData(this.customPatterns);

			this.hideModal();
		},

		getCustomPatterns(connector) {
			return this.customPatterns[connector.id] || [];
		},

		showHiddenOptions() {
			this.areHiddenOptionVisible = true;
		},

		showModal(connector) {
			this.editedConnector = connector;

			this.isModalActive = true;
		},

		hideModal() {
			this.isModalActive = false;
		},
	},
};
</script>

<style>
.connector-icon {
	height: 1.2rem;
	margin-bottom: 0.2rem;
	margin-right: 0.5rem;
	width: 1.2rem;
}

.no-icon {
	margin-left: 1.65rem;
}
</style>

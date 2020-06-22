<template>
	<div role="tabpanel">
		<div
			class="options-section"
			v-for="(data, scrobblerId) in accountsData"
			:key="scrobblerId"
		>
			<h5>{{ data.scrobbler.getLabel() }}</h5>

			<div class="mb-2">
				<template v-if="data.isSignedIn">
					{{ L('accountsSignedInAs', data.userName) }}
				</template>
				<template v-else>
					{{ L('accountsNotSignedIn') }}
				</template>
			</div>

			<div>
				<a
					class="card-link"
					href="#"
					@click.prevent="showModal(data.scrobbler)"
					v-if="data.hasUserProperties"
				>
					{{ L('accountsScrobblerProps') }}
				</a>
				<template v-if="data.isSignedIn">
					<a
						class="card-link"
						target="_blank"
						:href="data.profileUrl"
						v-if="data.hasProfileUrl"
					>
						{{ L('accountsProfile') }}
					</a>
					<a
						class="card-link"
						href="#"
						@click.prevent="signOut(data.scrobbler)"
					>
						{{ L('accountsSignOut') }}
					</a>
				</template>
				<template v-else>
					<a
						class="card-link"
						href="#"
						@click.prevent="signIn(data.scrobbler)"
					>
						{{ L('accountsSignIn') }}
					</a>
				</template>
			</div>
		</div>
		<user-properties-modal
			v-if="isModalActive"
			:label="editedAccount.getLabel()"
			:properties="createUserProperties(editedAccount)"
			@onOkClick="saveUserProperties"
			@onClose="hideModal"
		/>
	</div>
</template>

<script>
import { extension, tabs } from 'webextension-polyfill';
import { getCurrentTab } from 'util/util-browser';

import UserPropertiesModal from '@/ui/options/modals/user-properties-modal.vue';

const { webScrobbler } = extension.getBackgroundPage();

const ScrobbleService = webScrobbler.getScrobbleService();

const anonimousName = 'anonimous';

async function makeAccountsDataFromScrobbler(scrobbler) {
	let userName = null;
	let profileUrl = null;
	let isSignedIn = false;
	let hasProfileUrl = false;

	const hasUserProperties = scrobbler.getUsedDefinedProperties().length > 0;

	try {
		const { sessionName } = await scrobbler.getSession();

		profileUrl = await scrobbler.getProfileUrl();
		userName = sessionName || anonimousName;

		isSignedIn = true;
		hasProfileUrl = profileUrl !== null;
	} catch (err) {
		// Do nothing
	}

	return {
		isSignedIn,
		hasProfileUrl,
		hasUserProperties,
		profileUrl,
		scrobbler,
		userName,
	};
}

const scrobblerPropertiesMap = {
	listenbrainz: {
		userApiUrl: {
			titleId: 'accountsUserApiUrl',
			placeholderId: 'accountsUserApiUrlPlaceholder',
		},
		userToken: {
			type: 'password',
			titleId: 'accountsUserToken',
			placeholderId: 'accountsUserTokenPlaceholder',
		},
	},
};

export default {
	data() {
		return {
			accountsData: {},

			isModalActive: false,
			editedAccount: null,
		};
	},
	created() {
		this.setupEventListeners();
		this.loadAccounts();
	},
	components: { UserPropertiesModal },
	methods: {
		async loadAccounts() {
			const accountsData = {};
			const scrobblers = ScrobbleService.getRegisteredScrobblers();

			for (const scrobbler of scrobblers) {
				accountsData[
					scrobbler.getId()
				] = await makeAccountsDataFromScrobbler(scrobbler);
			}

			this.accountsData = accountsData;
		},

		async setupEventListeners() {
			const tab = await getCurrentTab();
			tabs.onActivated.addListener((activeInfo) => {
				if (tab.id === activeInfo.tabId) {
					this.loadAccounts();
				}
			});
		},

		createUserProperties(scrobbler) {
			const properties = [];

			const scrobblerId = scrobbler.getId();
			const scrobblerProperties = scrobblerPropertiesMap[scrobblerId];

			for (const name of scrobbler.getUsedDefinedProperties()) {
				const { type, titleId, placeholderId } = scrobblerProperties[
					name
				];
				const value = scrobbler[name];

				properties.push({ name, value, type, titleId, placeholderId });
			}

			return properties;
		},

		async saveUserProperties(properties) {
			await webScrobbler.applyUserProperties(
				this.editedAccount,
				properties
			);
			await this.refreshAccount(this.editedAccount);

			this.hideModal();
		},

		signIn(scrobbler) {
			webScrobbler.authenticateScrobbler(scrobbler);
		},

		async signOut(scrobbler) {
			await scrobbler.signOut();
			await this.refreshAccount(scrobbler);
		},

		async refreshAccount(scrobbler) {
			console.log(scrobbler);
			this.$set(
				this.accountsData,
				scrobbler.getId(),
				await makeAccountsDataFromScrobbler(scrobbler)
			);
		},

		hideModal() {
			console.log(222);
			this.isModalActive = false;
			this.editedAccount = null;
		},

		showModal(scrobbler) {
			this.editedAccount = scrobbler;
			this.isModalActive = true;
		},
	},
};
</script>

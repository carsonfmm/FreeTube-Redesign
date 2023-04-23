<template>
  <ft-settings-section
    :title="$t('Settings.Subscription Settings.Subscription Settings')"
  >

  <div class="main-content">
    <div class="switch-column-wrapper">
      <!-- <div class="switchColumnGrid"> -->
        <div class="switchColumn">
          <ft-toggle-switch
            :label="$t('Settings.Subscription Settings.Fetch Automatically')"
            :default-value="fetchSubscriptionsAutomatically"
            :tooltip="$t('Tooltips.Subscription Settings.Fetch Automatically')"
            :compact="true"
            @change="updateFetchSubscriptionsAutomatically"
          />

          <ft-toggle-switch
            :label="$t('Settings.Subscription Settings.Fetch Feeds from RSS')"
            :default-value="useRssFeeds"
            :tooltip="$t('Tooltips.Subscription Settings.Fetch Feeds from RSS')"
            :compact="true"
            @change="updateUseRssFeeds"
          />

          <ft-toggle-switch
            :label="$t('Settings.Subscription Settings.Hide Videos on Watch')"
            :default-value="hideWatchedSubs"
            :compact="true"
            @change="updateHideWatchedSubs"
          />

            <ft-button
              class="manage-subs"
              :label="$t('View Subscriptions')"
              @click="openProfileSettings"
            />

        </div>
    </div>

      <div class="subscription-wrapper">
        <ft-flex-box>
          <p>
            <a href="https://docs.freetubeapp.io/usage/importing-subscriptions/">
              {{ $t("Settings.Data Settings.How do I import my subscriptions?") }}
            </a>
          </p>
        </ft-flex-box>

        <ft-flex-box class="import-flex-box">
          <ft-button
            class="import-settings-btn"
            :label="$t('Settings.Data Settings.Import Subscriptions')"
            @click="importSubscriptions"
          />
        </ft-flex-box>

        <ft-flex-box class="export-flex-box">
          <ft-button
            class="export-settings-btn"
            :label="$t('Settings.Data Settings.Export Subscriptions')"
            @click="showExportSubscriptionsPrompt = true"
          />
        </ft-flex-box>
      </div>
    </div>

    <ft-prompt
      v-if="showExportSubscriptionsPrompt"
      :label="$t('Settings.Data Settings.Select Export Type')"
      :option-names="exportSubscriptionsPromptNames"
      :option-values="subscriptionsPromptValues"
      :show-close="true"
      @click="exportSubscriptions"
    />



  </ft-settings-section>
</template>

<script src="./subscription-settings.js" />
<style scoped src="./subscription-settings.css"/>

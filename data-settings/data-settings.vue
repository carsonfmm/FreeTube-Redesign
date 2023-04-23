<template>
  <ft-settings-section
    :title="$t('Settings.Data Settings.Data Settings')"
  >

    <ft-flex-box>
      <h2 class="import-data data-headers">Import Data</h2>
      <h2 class="export-data data-headers">Export Data</h2>
    </ft-flex-box>

    <ft-flex-box>
      <ft-button
        class="data-btns"
        :label="$t('Import Watch History')"
        @click="importHistory"
      />
      <ft-button
        class="data-btns"
        :label="$t('Export Watch History')"
        @click="exportHistory"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        class="data-btns"
        :label="$t('Settings.Data Settings.Import Playlists')"
        @click="importPlaylists"
      />
      <ft-button
        class="data-btns"
        :label="$t('Settings.Data Settings.Export Playlists')"
        @click="exportPlaylists"
      />
    </ft-flex-box>


  </ft-settings-section>
</template>

<script src="./data-settings.js" />
<style scoped src="./data-settings.css"/>


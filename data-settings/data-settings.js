import Vue from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import { mapActions, mapMutations } from 'vuex'
import FtButton from '../ft-button/ft-button.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import { MAIN_PROFILE_ID } from '../../../constants'

import ytch from 'yt-channel-info'
import { calculateColorLuminance, getRandomColor } from '../../helpers/colors'
import {
  copyToClipboard,
  readFileFromDialog,
  showOpenDialog,
  showSaveDialog,
  showToast,
  writeFileFromDialog
} from '../../helpers/utils'
import { invidiousAPICall } from '../../helpers/api/invidious'

export default Vue.extend({
  name: 'DataSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-button': FtButton,
    'ft-flex-box': FtFlexBox,
  },
  data: function () {
    return {
    }
  },
  computed: {
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
    },
    saveWatchedProgress: function () {
      return this.$store.getters.getSaveWatchedProgress
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    allPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },
    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },
    usingElectron: function () {
      return process.env.IS_ELECTRON
    },
    primaryProfile: function () {
      return JSON.parse(JSON.stringify(this.profileList[0]))
    }
  },
  methods: {
    openProfileSettings: function () {
      this.$router.push({
        path: '/settings/profile/'
      })
    },

    importHistory: async function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: this.$t('Settings.Data Settings.History File'),
            extensions: ['db']
          }
        ]
      }

      const response = await showOpenDialog(options)
      if (response.canceled || response.filePaths?.length === 0) {
        return
      }
      let textDecode
      try {
        textDecode = await readFileFromDialog(response)
      } catch (err) {
        const message = this.$t('Settings.Data Settings.Unable to read file')
        showToast(`${message}: ${err}`)
        return
      }
      textDecode = textDecode.split('\n')
      textDecode.pop()

      textDecode.forEach((history) => {
        const historyData = JSON.parse(history)
        // We would technically already be done by the time the data is parsed,
        // however we want to limit the possibility of malicious data being sent
        // to the app, so we'll only grab the data we need here.
        const requiredKeys = [
          '_id',
          'author',
          'authorId',
          'description',
          'isLive',
          'lengthSeconds',
          'paid',
          'published',
          'timeWatched',
          'title',
          'type',
          'videoId',
          'viewCount',
          'watchProgress'
        ]

        const historyObject = {}

        Object.keys(historyData).forEach((key) => {
          if (!requiredKeys.includes(key)) {
            showToast(`Unknown data key: ${key}`)
          } else {
            historyObject[key] = historyData[key]
          }
        })

        if (Object.keys(historyObject).length < (requiredKeys.length - 2)) {
          showToast(this.$t('Settings.Data Settings.History object has insufficient data, skipping item'))
        } else {
          this.updateHistory(historyObject)
        }
      })

      showToast(this.$t('Settings.Data Settings.All watched history has been successfully imported'))
    },

    exportHistory: async function () {
      const historyDb = this.historyCache.map((historyEntry) => {
        return JSON.stringify(historyEntry)
      }).join('\n') + '\n'
      const date = new Date().toISOString().split('T')[0]
      const exportFileName = 'freetube-history-' + date + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: this.$t('Settings.Data Settings.Playlist File'),
            extensions: ['db']
          }
        ]
      }

      const response = await showSaveDialog(options)
      if (response.canceled || response.filePath === '') {
        // User canceled the save dialog
        return
      }

      try {
        await writeFileFromDialog(response, historyDb)
      } catch (writeErr) {
        const message = this.$t('Settings.Data Settings.Unable to write file')
        showToast(`${message}: ${writeErr}`)
      }
      showToast(this.$t('Settings.Data Settings.All watched history has been successfully exported'))
    },

    importPlaylists: async function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: this.$t('Settings.Data Settings.Playlist File'),
            extensions: ['db']
          }
        ]
      }

      const response = await showOpenDialog(options)
      if (response.canceled || response.filePaths?.length === 0) {
        return
      }
      let data
      try {
        data = await readFileFromDialog(response)
      } catch (err) {
        const message = this.$t('Settings.Data Settings.Unable to read file')
        showToast(`${message}: ${err}`)
        return
      }
      const playlists = JSON.parse(data)

      playlists.forEach(async (playlistData) => {
        // We would technically already be done by the time the data is parsed,
        // however we want to limit the possibility of malicious data being sent
        // to the app, so we'll only grab the data we need here.
        const requiredKeys = [
          'playlistName',
          'videos'
        ]

        const optionalKeys = [
          '_id',
          'protected',
          'removeOnWatched'
        ]

        const requiredVideoKeys = [
          'videoId',
          'title',
          'author',
          'authorId',
          'published',
          'lengthSeconds',
          'timeAdded',
          'isLive',
          'paid',
          'type'
        ]

        const playlistObject = {}

        Object.keys(playlistData).forEach((key) => {
          if (!requiredKeys.includes(key) && !optionalKeys.includes(key)) {
            const message = `${this.$t('Settings.Data Settings.Unknown data key')}: ${key}`
            showToast(message)
          } else if (key === 'videos') {
            const videoArray = []
            playlistData.videos.forEach((video) => {
              let hasAllKeys = true
              requiredVideoKeys.forEach((videoKey) => {
                if (!Object.keys(video).includes(videoKey)) {
                  hasAllKeys = false
                }
              })

              if (hasAllKeys) {
                videoArray.push(video)
              }
            })

            playlistObject[key] = videoArray
          } else {
            playlistObject[key] = playlistData[key]
          }
        })

        const objectKeys = Object.keys(playlistObject)

        if ((objectKeys.length < requiredKeys.length) || playlistObject.videos.length === 0) {
          const message = this.$t('Settings.Data Settings.Playlist insufficient data', { playlist: playlistData.playlistName })
          showToast(message)
        } else {
          const existingPlaylist = this.allPlaylists.find((playlist) => {
            return playlist.playlistName === playlistObject.playlistName
          })

          if (existingPlaylist !== undefined) {
            playlistObject.videos.forEach((video) => {
              const existingVideo = existingPlaylist.videos.find((x) => {
                return x.videoId === video.videoId
              })

              if (existingVideo === undefined) {
                const payload = {
                  playlistName: existingPlaylist.playlistName,
                  videoData: video
                }

                this.addVideo(payload)
              }
            })
          } else {
            this.addPlaylist(playlistObject)
          }
        }
      })

      showToast(this.$t('Settings.Data Settings.All playlists has been successfully imported'))
    },

    exportPlaylists: async function () {
      const date = new Date().toISOString().split('T')[0]
      const exportFileName = 'freetube-playlists-' + date + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: 'Database File',
            extensions: ['db']
          }
        ]
      }

      const response = await showSaveDialog(options)
      if (response.canceled || response.filePath === '') {
        // User canceled the save dialog
        return
      }
      try {
        await writeFileFromDialog(response, JSON.stringify(this.allPlaylists))
      } catch (writeErr) {
        const message = this.$t('Settings.Data Settings.Unable to write file')
        showToast(`${message}: ${writeErr}`)
        return
      }
      showToast(`${this.$t('Settings.Data Settings.All playlists has been successfully exported')}`)
    },

    convertOldFreeTubeFormatToNew(oldData) {
      const convertedData = []
      for (const channel of oldData) {
        const listOfProfilesAlreadyAdded = []
        for (const profile of channel.profile) {
          let index = convertedData.findIndex(p => p.name === profile.value)
          if (index === -1) { // profile doesn't exist yet
            const randomBgColor = getRandomColor()
            const contrastyTextColor = calculateColorLuminance(randomBgColor)
            convertedData.push({
              name: profile.value,
              bgColor: randomBgColor,
              textColor: contrastyTextColor,
              subscriptions: [],
              _id: channel._id
            })
            index = convertedData.length - 1
          } else if (listOfProfilesAlreadyAdded.indexOf(index) !== -1) {
            continue
          }
          listOfProfilesAlreadyAdded.push(index)
          convertedData[index].subscriptions.push({
            id: channel.channelId,
            name: channel.channelName,
            thumbnail: channel.channelThumbnail
          })
        }
      }
      return convertedData
    },

    getChannelInfoInvidious: function (channelId) {
      return new Promise((resolve, reject) => {
        const subscriptionsPayload = {
          resource: 'channels',
          id: channelId,
          params: {}
        }

        invidiousAPICall(subscriptionsPayload).then((response) => {
          resolve(response)
        }).catch((err) => {
          console.error(err)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${err.responseJSON.error}`, 10000, () => {
            copyToClipboard(err.responseJSON.error)
          })

          if (process.env.IS_ELECTRON && this.backendFallback && this.backendPreference === 'invidious') {
            showToast(this.$t('Falling back to the local API'))
            resolve(this.getChannelInfoLocal(channelId))
          } else {
            resolve([])
          }
        })
      })
    },

    getChannelInfoLocal: function (channelId) {
      return new Promise((resolve, reject) => {
        ytch.getChannelInfo({ channelId: channelId }).then(async (response) => {
          resolve(response)
        }).catch((err) => {
          console.error(err)
          const errorMessage = this.$t('Local API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })

          if (this.backendFallback && this.backendPreference === 'local') {
            showToast(this.$t('Falling back to the Invidious API'))
            resolve(this.getChannelInfoInvidious(channelId))
          } else {
            resolve([])
          }
        })
      })
    },

    /*
    TODO: allow default thumbnail to be used to limit requests to YouTube
    (thumbnail will get updated when user goes to their channel page)
    Returns:
    -1: an error occured
    0: already subscribed
    1: successfully subscribed
    */
    async subscribeToChannel({ channelId, subscriptions, channelName = null, thumbnail = null, count = 0, total = 0 }) {
      let result = 1
      if (this.isChannelSubscribed(channelId, subscriptions)) {
        return { subscription: null, successMessage: 0 }
      }

      let channelInfo
      let subscription = null
      if (channelName === null || thumbnail === null) {
        try {
          if (this.backendPreference === 'invidious') {
            channelInfo = await this.getChannelInfoInvidious(channelId)
          } else {
            channelInfo = await this.getChannelInfoLocal(channelId)
          }
        } catch (err) {
          console.error(err)
          result = -1
        }
      } else {
        channelInfo = { author: channelName, authorThumbnails: [null, { url: thumbnail }] }
      }

      if (typeof channelInfo.author !== 'undefined') {
        subscription = {
          id: channelId,
          name: channelInfo.author,
          thumbnail: channelInfo.authorThumbnails[1].url
        }
      } else {
        result = -1
      }
      const progressPercentage = (count / (total - 1)) * 100
      this.setProgressBarPercentage(progressPercentage)
      return { subscription, result }
    },

    isChannelSubscribed(channelId, subscriptions) {
      if (channelId === null) { return true }
      const subExists = this.primaryProfile.subscriptions.findIndex((sub) => {
        return sub.id === channelId
      }) !== -1

      const subDuplicateExists = subscriptions.findIndex((sub) => {
        return sub.id === channelId
      }) !== -1
      return subExists || subDuplicateExists
    },

    ...mapActions([
      'updateProfile',
      'compactProfiles',
      'updateShowProgressBar',
      'updateHistory',
      'compactHistory',
      'addPlaylist',
      'addVideo'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})

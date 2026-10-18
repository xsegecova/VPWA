import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import {
  backendChangeEvent,
  getChannelsForUser,
  getCurNickname,
  getUser,
  userStatuses,
  type Channel,
} from './tempBackend'
import { useChannel } from './useChannel'
import { useTerminal } from './useTerminal'

const knownMessageKeys = new Set<string>()
let notificationTrackerInitialized = false

function messageKey(channelName: string, message: Channel['messages'][number]) {
  return `${channelName}:${message.kedy}:${message.fromUser}`
}

function rememberMessages(channels: Channel[]) {
  for (const channel of channels) {
    for (const message of channel.messages) {
      knownMessageKeys.add(messageKey(channel.name, message))
    }
  }
}

function messageMentionsUser(text: string, nickname: string) {
  const escapedNickname = nickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\s)@${escapedNickname}(?=\\s|$|[.,!?])`, 'i').test(text)
}

function truncateMessage(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized
}

async function requestDesktopNotifications() {
  if (typeof Notification === 'undefined') {
    console.error('Desktop notifications are not supported by this browser')
    return false
  }

  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch (error) {
    console.error('Could not request desktop notification permission', error)
    return false
  }
}

export function useChat() {
  const $q = useQuasar()
  const channel = useChannel()
  const currentMessages = computed(() => channel.activeChannel.value?.currentMessages ?? [])
  const terminal = useTerminal({
    activeChannelName: channel.activeChannelName,
    activeChannel: channel.activeChannel,
    commandError: channel.commandError,
    commandMessage: channel.commandMessage,
    commandMessageType: channel.commandMessageType,
    text: channel.text,
    refreshChannels: channel.refreshChannels,
    loadMessages: channel.loadMessages,
    requireOnlineUser: channel.requireOnlineUser,
    setCurrentMessage: channel.setCurrentMessage,
    cancelActiveChannel: channel.cancelActiveChannel,
    saveMessage: channel.saveMessage,
    kickUserFromChannel: channel.kickUserFromChannel,
    leaveChannel: channel.leaveChannel,
    showChannelInfo: channel.showChannelInfo,
    logout: channel.logout,
  })

  watch(
    channel.activeChannelName,
    () => {
      channel.showChannelInfo.value = false
      channel.loadMessages()
    },
    { immediate: true },
  )

  const refreshFromEvent = () => {
    const currentUser = getCurNickname()
    const latestChannels = currentUser ? getChannelsForUser() : []
    const currentStatus = currentUser ? getUser(currentUser)?.status : userStatuses.offline

    if (currentStatus === userStatuses.offline) {
      rememberMessages(latestChannels)
      return
    }

    if (currentStatus === userStatuses.dnd) {
      channel.refresh()
      rememberMessages(latestChannels)
      return
    }

    if (!notificationTrackerInitialized) {
      rememberMessages(latestChannels)
      notificationTrackerInitialized = true
    } else if (currentUser && currentStatus === userStatuses.online && !$q.appVisible) {
      for (const latestChannel of latestChannels) {
        for (const message of latestChannel.messages) {
          const key = messageKey(latestChannel.name, message)
          if (
            knownMessageKeys.has(key) ||
            message.fromUser === currentUser ||
            (getUser(currentUser)?.notificationsDirectOnly &&
              !messageMentionsUser(message.text, currentUser))
          ) {
            knownMessageKeys.add(key)
            continue
          }

          showDesktopNotification(latestChannel.name, message)
          knownMessageKeys.add(key)
        }
      }
    } else {
      rememberMessages(latestChannels)
    }

    channel.refresh()
  }

  onMounted(() => {
    channel.refresh()
    window.addEventListener(backendChangeEvent, refreshFromEvent)
    window.addEventListener('storage', refreshFromEvent)
  })

  onUnmounted(() => {
    window.removeEventListener(backendChangeEvent, refreshFromEvent)
    window.removeEventListener('storage', refreshFromEvent)
  })

  return {
    ...channel,
    ...terminal,
    channelMessages: channel.messages,
    currentMessages,
    requestDesktopNotifications,
  }
}

function showDesktopNotification(channelName: string, message: Channel['messages'][number]) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  const notification = new Notification(message.fromUser, {
    body: `[${channelName}] ${truncateMessage(message.text)}`,
    tag: messageKey(channelName, message),
  })
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

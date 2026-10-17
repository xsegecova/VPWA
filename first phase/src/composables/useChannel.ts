import { computed, ref } from 'vue'
import {
  acceptInvite as acceptBackendInvite,
  cancelChannel,
  changeNotificationPreference,
  changeUserStatus,
  getChannelsForUser,
  getInvitesForUser,
  getMessages,
  getUser,
  kickUserFromChannel,
  leaveChannel,
  logout as logoutBackend,
  rejectInvite as rejectBackendInvite,
  sendMessage as saveMessage,
  userStatuses,
  type Channel,
  type Invite,
  type UserStatus,
} from './tempBackend'

export type MessageMentionMatcher = (text: string, nickname: string) => boolean

type ChannelState = ReturnType<typeof createChannelState>
let sharedChannelState: ChannelState | null = null

export function getCurrentNickname(): string | null {
  return sessionStorage.getItem('serpent-current-user')
}

export function getCurrentUser() {
  const nickname = getCurrentNickname()
  return nickname ? getUser(nickname) : null
}

function getLatestMessageTime(channel: Channel): number {
  const latestMessage = channel.messages[channel.messages.length - 1]
  return latestMessage ? Date.parse(latestMessage.kedy) : 0
}

function getReadMessages(): Record<string, string> {
  const nickname = getCurrentNickname()
  if (!nickname) return {}

  const saved = sessionStorage.getItem(`serpent-read-messages-${nickname}`)
  if (!saved) return {}

  try {
    const parsed: unknown = JSON.parse(saved)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {}
  } catch (error) {
    console.error('Could not read message state', error)
    return {}
  }
}

export function useChannel() {
  if (!sharedChannelState) {
    sharedChannelState = createChannelState()
  }
  return sharedChannelState
}

function createChannelState() {
  const nickname = getCurrentNickname()
  const channels = ref<Channel[]>(nickname ? getChannelsForUser(nickname) : [])
  const invites = ref<Invite[]>([])
  const messages = ref<ReturnType<typeof getMessages>>([])
  const activeChannelName = ref<string | null>(null)
  const userStatus = ref<UserStatus>(userStatuses.online)
  const notificationsDirectOnly = ref(false)
  const text = ref('')
  const commandError = ref('')
  const showChannelInfo = ref(false)
  let loadedUser = nickname

  const activeChannel = computed(
    () => channels.value.find((channel) => channel.name === activeChannelName.value) ?? null,
  )
  const isChannelAdmin = computed(() => {
    const currentNickname = getCurrentNickname()
    return !!currentNickname && activeChannel.value?.owner === currentNickname
  })
  const sortedChannels = computed(() =>
    [...channels.value].sort(
      (first, second) => getLatestMessageTime(second) - getLatestMessageTime(first),
    ),
  )

  function messageMentionsUser(messageText: string, currentNickname: string) {
    const escapedNickname = currentNickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|\\s)@${escapedNickname}(?=\\s|$|[.,!?])`, 'i').test(messageText)
  }

  function markChannelAsRead(channelName: string) {
    const channel = channels.value.find((item) => item.name === channelName)
    const latestMessage = channel?.messages[channel.messages.length - 1]
    const currentNickname = getCurrentNickname()
    if (!latestMessage || !currentNickname) return

    const readMessages = getReadMessages()
    readMessages[channelName] = latestMessage.kedy
    sessionStorage.setItem(`serpent-read-messages-${currentNickname}`, JSON.stringify(readMessages))
  }

  const unreadChannels = computed(() => {
    const readMessages = getReadMessages()
    return new Set(
      channels.value
        .filter((channel) => {
          const latestMessage = channel.messages[channel.messages.length - 1]
          return (
            latestMessage &&
            latestMessage.kedy > (readMessages[channel.name] ?? '') &&
            channel.name !== activeChannelName.value
          )
        })
        .map((channel) => channel.name),
    )
  })

  const mentionedChannels = computed(() => {
    const currentNickname = getCurrentNickname()
    if (!currentNickname) return new Set<string>()
    const readMessages = getReadMessages()

    return new Set(
      channels.value
        .filter((channel) => channel.name !== activeChannelName.value)
        .filter((channel) => {
          const readAt = readMessages[channel.name] ?? ''
          return channel.messages.some(
            (message) =>
              message.kedy > readAt &&
              message.fromUser !== currentNickname &&
              messageMentionsUser(message.text, currentNickname),
          )
        })
        .map((channel) => channel.name),
    )
  })

  function refreshUserState() {
    const user = getCurrentUser()
    userStatus.value = user?.status ?? userStatuses.online
    notificationsDirectOnly.value = user?.notificationsDirectOnly ?? false
  }

  function loadMessages() {
    const currentNickname = getCurrentNickname()
    if (
      !activeChannelName.value ||
      !currentNickname ||
      getCurrentUser()?.status === userStatuses.offline
    ) {
      messages.value = []
      return
    }

    messages.value = getMessages(activeChannelName.value, currentNickname)
    markChannelAsRead(activeChannelName.value)
  }

  function refreshChannels() {
    const currentNickname = getCurrentNickname()
    if (currentNickname !== loadedUser) {
      activeChannelName.value = null
      messages.value = []
      loadedUser = currentNickname
    }

    channels.value = currentNickname ? getChannelsForUser(currentNickname) : []
    invites.value = currentNickname ? getInvitesForUser(currentNickname) : []
    refreshUserState()

    if (
      activeChannelName.value &&
      !channels.value.some((channel) => channel.name === activeChannelName.value)
    ) {
      activeChannelName.value = null
      messages.value = []
    }
    if (!activeChannelName.value && channels.value.length > 0) {
      activeChannelName.value = channels.value[0].name
    }
  }

  function requireOnlineUser(message: string): string | null {
    const currentNickname = getCurrentNickname()
    if (!currentNickname) return null
    if (getCurrentUser()?.status === userStatuses.offline) {
      commandError.value = message
      return null
    }
    return currentNickname
  }

  function refresh() {
    refreshChannels()
    loadMessages()
  }

  function setUserStatus(status: UserStatus) {
    const currentNickname = getCurrentNickname()
    if (!currentNickname) return
    try {
      changeUserStatus(currentNickname, status)
      refresh()
    } catch (error) {
      console.error('Could not change user status', error)
    }
  }

  function setNotificationsDirectOnly(directOnly: boolean) {
    const currentNickname = getCurrentNickname()
    if (!currentNickname) return
    try {
      changeNotificationPreference(currentNickname, Boolean(directOnly))
      refreshUserState()
    } catch (error) {
      console.error('Could not change channel activity preference', error)
    }
  }

  function acceptInvite(invite: Invite) {
    const currentNickname = requireOnlineUser('You must be online to manage invitations')
    if (!currentNickname) return
    try {
      acceptBackendInvite(invite, currentNickname)
      refreshChannels()
      activeChannelName.value = invite.channel
    } catch (error) {
      console.error('Could not accept invite', error)
    }
  }

  function rejectInvite(invite: Invite) {
    const currentNickname = requireOnlineUser('You must be online to manage invitations')
    if (!currentNickname) return
    try {
      rejectBackendInvite(invite, currentNickname)
      refreshChannels()
    } catch (error) {
      console.error('Could not reject invite', error)
    }
  }

  function cancelActiveChannel(): boolean {
    const currentNickname = getCurrentNickname()
    const channelName = activeChannelName.value
    if (!currentNickname || !channelName) return false
    try {
      cancelChannel(channelName, currentNickname)
      refreshChannels()
      return true
    } catch (error) {
      console.error('Could not leave or cancel channel', error)
      return false
    }
  }

  function openChannel(name: string) {
    activeChannelName.value = name
    markChannelAsRead(name)
  }

  function logout() {
    logoutBackend()
    activeChannelName.value = null
    messages.value = []
    channels.value = []
    invites.value = []
    window.location.hash = '#/'
  }

  return {
    channels,
    invites,
    messages,
    activeChannelName,
    activeChannel,
    isChannelAdmin,
    userStatus,
    notificationsDirectOnly,
    commandError,
    text,
    showChannelInfo,
    sortedChannels,
    unreadChannels,
    mentionedChannels,
    messageMentionsUser,
    refresh,
    refreshChannels,
    loadMessages,
    requireOnlineUser,
    setUserStatus,
    setNotificationsDirectOnly,
    acceptInvite,
    rejectInvite,
    cancelActiveChannel,
    openChannel,
    logout,
    kickUserFromChannel,
    leaveChannel,
    saveMessage,
  }
}

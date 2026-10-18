import { computed, ref } from 'vue'
import {
  acceptInvite as acceptBackendInvite,
  changeNotificationPreference,
  changeUserStatus,
  getChannelsForUser,
  getInvitesForUser,
  getMessages,
  updateCurrentMessage,
  getUser,
  kickUserFromChannel,
  leaveChannel,
  getCurNickname,
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

export function getCurrentUser() {
  const nickname = getCurNickname()
  return nickname ? getUser(nickname) : null
}

function getLatestMessageTime(channel: Channel): number {
  const latestMessage = channel.messages[channel.messages.length - 1]
  return latestMessage ? Date.parse(latestMessage.kedy) : 0
}

export function useChannel() {
  if (!sharedChannelState) {
    sharedChannelState = createChannelState()
  }
  return sharedChannelState
}

function createChannelState() {
  const nickname = getCurNickname()
  const channels = ref<Channel[]>(nickname ? getChannelsForUser() : [])
  const invites = ref<Invite[]>([])
  const messages = ref<ReturnType<typeof getMessages>>([])
  const activeChannelName = ref<string | null>(null)
  const userStatus = ref<UserStatus>(userStatuses.online)
  const notificationsDirectOnly = ref(false)
  const text = ref('')
  const commandError = ref('')
  const commandMessage = ref('')
  const commandMessageType = ref<'success' | 'error'>('success')
  const showChannelInfo = ref(false)
  let loadedUser = nickname

  const activeChannel = computed(
    () => channels.value.find((channel) => channel.name === activeChannelName.value) ?? null,
  )
  const isChannelAdmin = computed(() => {
    const currentNickname = getCurNickname()
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

  const unreadChannels = computed(() => {
    const currentNickname = getCurNickname()
    if (!currentNickname) return new Set<string>()

    return new Set(
      channels.value
        .filter((channel) => {
          const latestMessage = channel.messages[channel.messages.length - 1]
          return (
            latestMessage &&
            !latestMessage.readBy.includes(currentNickname) &&
            channel.name !== activeChannelName.value
          )
        })
        .map((channel) => channel.name),
    )
  })

  const mentionedChannels = computed(() => {
    const currentNickname = getCurNickname()
    if (!currentNickname) return new Set<string>()

    return new Set(
      channels.value
        .filter((channel) => channel.name !== activeChannelName.value)
        .filter((channel) => {
          return channel.messages.some(
            (message) =>
              !message.readBy.includes(currentNickname) &&
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
    const currentNickname = getCurNickname()
    if (!activeChannelName.value || !currentNickname) {
      messages.value = []
      return
    }

    if (getCurrentUser()?.status === userStatuses.offline) return

    messages.value = getMessages(activeChannelName.value)
  }

  function refreshChannels() {
    const currentNickname = getCurNickname()
    if (currentNickname !== loadedUser) {
      activeChannelName.value = null
      messages.value = []
      loadedUser = currentNickname
    }

    channels.value = currentNickname ? getChannelsForUser() : []
    invites.value = currentNickname ? getInvitesForUser() : []
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
    const currentNickname = getCurNickname()
    if (!currentNickname) return null
    if (getCurrentUser()?.status === userStatuses.offline) {
      commandError.value = message
      return null
    }
    return currentNickname
  }

  function setCurrentMessage(text: string) {
    if (!activeChannelName.value || !getCurNickname()) return
    updateCurrentMessage(activeChannelName.value, text)
    refreshChannels()
  }

  function refresh() {
    refreshChannels()
    loadMessages()
  }

  function setUserStatus(status: UserStatus) {
    const currentNickname = getCurNickname()
    if (!currentNickname) return
    try {
      changeUserStatus(status)
      refresh()
    } catch (error) {
      console.error('Could not change user status', error)
    }
  }

  function setNotificationsDirectOnly(directOnly: boolean) {
    const currentNickname = getCurNickname()
    if (!currentNickname) return
    try {
      changeNotificationPreference(Boolean(directOnly))
      refreshUserState()
    } catch (error) {
      console.error('Could not change channel activity preference', error)
    }
  }

  function acceptInvite(invite: Invite) {
    const currentNickname = requireOnlineUser('You must be online to manage invitations')
    if (!currentNickname) return
    try {
      acceptBackendInvite(invite)
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
      rejectBackendInvite(invite)
      refreshChannels()
    } catch (error) {
      console.error('Could not reject invite', error)
    }
  }

  function cancelActiveChannel(): boolean {
    const currentNickname = getCurNickname()
    const channelName = activeChannelName.value
    if (!currentNickname || !channelName) return false
    try {
      leaveChannel(channelName)
      refreshChannels()
      return true
    } catch (error) {
      console.error('Could not leave or cancel channel', error)
      return false
    }
  }

  function openChannel(name: string) {
    activeChannelName.value = name
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
    commandMessage,
    commandMessageType,
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
    setCurrentMessage,
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

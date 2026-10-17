import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  acceptInvite,
  backendChangeEvent,
  joinChannel,
  cancelChannel,
  createInvite,
  getChannelsForUser,
  getInvitesForUser,
  getMessages,
  kickUserFromChannel,
  leaveChannel,
  logout,
  rejectInvite,
  sendMessage as saveMessage,
  type Channel,
  type Invite,
} from './tempBackend'

const text = ref('')
const messages = ref<ReturnType<typeof getMessages>>([])
const commandIndex = ref(0)
const currentUser = sessionStorage.getItem('serpent-current-user')
let loadedUser = currentUser
const channels = ref<Channel[]>(currentUser ? getChannelsForUser(currentUser) : [])
const activeChannelName = ref<string | null>(null)
const invites = ref<Invite[]>([])
const showChannelInfo = ref(false)

function getLatestMessageTime(channel: Channel): number {
  const latestMessage = channel.messages[channel.messages.length - 1]
  return latestMessage ? Date.parse(latestMessage.kedy) : 0
}

function getReadMessages(): Record<string, string> {
  const nickname = sessionStorage.getItem('serpent-current-user')
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

function markChannelAsRead(channelName: string) {
  const channel = channels.value.find((item) => item.name === channelName)
  const latestMessage = channel?.messages[channel.messages.length - 1]
  const nickname = sessionStorage.getItem('serpent-current-user')
  if (!latestMessage || !nickname) return

  const readMessages = getReadMessages()
  readMessages[channelName] = latestMessage.kedy
  sessionStorage.setItem(`serpent-read-messages-${nickname}`, JSON.stringify(readMessages))
}

const sortedChannels = computed(() =>
  [...channels.value].sort(
    (first, second) => getLatestMessageTime(second) - getLatestMessageTime(first),
  ),
)

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

function refreshChannels() {
  const nickname = sessionStorage.getItem('serpent-current-user')
  if (nickname !== loadedUser) {
    activeChannelName.value = null
    messages.value = []
    loadedUser = nickname
  }

  channels.value = nickname ? getChannelsForUser(nickname) : []
  invites.value = nickname ? getInvitesForUser(nickname) : []

  if (
    activeChannelName.value &&
    !channels.value.some((channel) => channel.name === activeChannelName.value)
  ) {
    activeChannelName.value = null
    messages.value = []
  }
}

type Command = {
  name: string
  syntax: string
}

const commands: Command[] = [
  { name: '/join', syntax: '/join {channelName} [private]' },
  { name: '/invite', syntax: '/invite {nickname}' },
  { name: '/kick', syntax: '/kick {nickname}' },
  { name: '/leave', syntax: '/leave' },
  { name: '/quit', syntax: '/quit' },
  { name: '/cancel', syntax: '/cancel' },
  { name: '/list', syntax: '/list' },
  { name: '@', syntax: '@{nickName}' },
]

const filteredCommands = computed(() => {
  if (!text.value.startsWith('/')) return []

  return commands.filter((command) => command.name.startsWith(text.value))
})

function loadMessages() {
  const nickname = sessionStorage.getItem('serpent-current-user')
  if (!activeChannelName.value || !nickname) {
    messages.value = []
    return
  }

  messages.value = getMessages(activeChannelName.value, nickname)
  markChannelAsRead(activeChannelName.value)
}

function sendMessage() {
  const messageText = text.value.trim()
  const parts = messageText.split(/\s+/)
  const commandName = parts[0]
  const nickname = sessionStorage.getItem('serpent-current-user')

  if (commandName === '/quit') {
  if (!activeChannel.value) return

  if (!isChannelAdmin.value) {
    console.warn('Kanál môže zrušiť iba správca')
    return
  }

  cancelActiveChannel()
  return
}

  if (commandName === '/invite') {
    const receiver = parts[1]
    const channelName = activeChannelName.value
    if (!nickname || !receiver || !channelName) return

    try {
      createInvite(nickname, receiver, channelName)
      text.value = ''
    } catch (error) {
      console.error('Could not invite user', error)
    }
    return
  }

  if (commandName === '/kick') {
    const user = parts[1]
    const channelName = activeChannelName.value
    if (!nickname || !user || !channelName) return

    try {
      kickUserFromChannel(user, channelName, nickname)
      refreshChannels()
      text.value = ''
    } catch (error) {
      console.error('Could not kick user', error)
    }
    return
  }

  if (commandName === '/leave') {
    const channelName = activeChannelName.value
    if (!nickname || !channelName) return

    try {
      leaveChannel(channelName, nickname)
      refreshChannels()
      activeChannelName.value = null
      messages.value = []
      text.value = ''
    } catch (error) {
      console.error('Could not leave channel', error)
    }
    return
  }

  if (commandName === '/join') {
  const channelName = parts[1]
  const visibility = parts[2]

  if (!nickname || !channelName) return
  if (visibility && visibility !== 'private') return

  try {
    const channel = joinChannel(
      nickname,
      channelName,
      visibility === 'private'
    )

    refreshChannels()
    activeChannelName.value = channel.name
    text.value = ''
  } catch (error) {
    console.error('Nepodarilo sa pripojiť ku kanálu', error)
  }

  return
  }

  if (commandName === '/cancel') {
    cancelActiveChannel()
    return
  }

  if (commandName === '/list') {
  if (!nickname || !activeChannel.value) return

  showChannelInfo.value = true
  text.value = ''
  return
  }

  const channelName = activeChannelName.value
  const fromUser = sessionStorage.getItem('serpent-current-user')

  if (!messageText || !channelName || !fromUser) return

  try {
    saveMessage(channelName, fromUser, messageText)
    loadMessages()
    text.value = ''
  } catch (error) {
    console.error('Could not send message', error)
  }
}

function logoutFromChat() {
  logout()
  activeChannelName.value = null
  messages.value = []
  channels.value = []
  invites.value = []
  text.value = ''
  window.location.hash = '#/'
}

function refreshChat() {
  refreshChannels()
  loadMessages()
}

const activeChannel = computed(() =>
  channels.value.find(channel =>
    channel.name === activeChannelName.value
  ) ?? null
)

const isChannelAdmin = computed(() => {
  const nickname = sessionStorage.getItem('serpent-current-user')
  return !!nickname && activeChannel.value?.owner === nickname
})

function cancelActiveChannel(): boolean {
  const nickname = sessionStorage.getItem('serpent-current-user')
  const channelName = activeChannelName.value

  if (!nickname || !channelName) return false

  try {
    cancelChannel(channelName, nickname)
    refreshChannels()
    text.value = ''
    return true
  } catch (error) {
    console.error('Nepodarilo sa opustiť alebo zrušiť kanál', error)
    return false
  }
}

export function useChat() {
  watch(activeChannelName, () => {
  showChannelInfo.value = false
  loadMessages()
  }, { immediate: true })

  onMounted(() => {
    refreshChat()
    window.addEventListener(backendChangeEvent, refreshChat)
    window.addEventListener('storage', refreshChat)
  })

  onUnmounted(() => {
    window.removeEventListener(backendChangeEvent, refreshChat)
    window.removeEventListener('storage', refreshChat)
  })

  return {
    channels,
    invites,
    refreshChannels,
    text,
    messages,
    commandIndex,
    sendMessage,
    logout: logoutFromChat,
    filteredCommands,
    channelMessages: messages,
    activeChannelName,
    activeChannel,
    cancelActiveChannel,
    isChannelAdmin,
    showChannelInfo,
    acceptInvite: (invite: Invite) => {
      const nickname = sessionStorage.getItem('serpent-current-user')
      if (!nickname) return

      try {
        acceptInvite(invite, nickname)
        refreshChannels()
        activeChannelName.value = invite.channel
      } catch (error) {
        console.error('Could not accept invite', error)
      }
    },
    rejectInvite: (invite: Invite) => {
      const nickname = sessionStorage.getItem('serpent-current-user')
      if (!nickname) return

      try {
        rejectInvite(invite, nickname)
      } catch (error) {
        console.error('Could not reject invite', error)
      }
    },
    openChannel: (name: string) => {
      activeChannelName.value = name
      markChannelAsRead(name)
    },
    sortedChannels,
    unreadChannels,
  }
}

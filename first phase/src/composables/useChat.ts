import { computed, onMounted, ref, watch } from 'vue'
import {
  createChannel,
  getChannelsForUser,
  getMessages,
  sendMessage as saveMessage,
  type Channel
} from './tempBackend'

const text = ref('')
const messages = ref<ReturnType<typeof getMessages>>([])
const commandIndex = ref(0)
const currentUser = sessionStorage.getItem('serpent-current-user')
let loadedUser = currentUser
const channels = ref<Channel[]>(
  currentUser ? getChannelsForUser(currentUser) : []
)
const activeChannelName = ref<string | null>(null)

function refreshChannels() {
  const nickname = sessionStorage.getItem('serpent-current-user')
  if (nickname !== loadedUser) {
    activeChannelName.value = null
    messages.value = []
    loadedUser = nickname
  }

  channels.value = nickname ? getChannelsForUser(nickname) : []

  if (
    activeChannelName.value &&
    !channels.value.some(channel => channel.name === activeChannelName.value)
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
  { name: '/invite', syntax: '/invite {nickName}' },
  { name: '/revoke', syntax: '/revoke {nickName}' },
  { name: '/kick', syntax: '/kick {nickName}' },
  { name: '/quit', syntax: '/quit' },
  { name: '/cancel', syntax: '/cancel' },
  { name: '/list', syntax: '/list' },
  { name: '@', syntax: '@{nickName}' }
]

const filteredCommands = computed(() => {
  if (!text.value.startsWith('/')) return []

  return commands.filter(command => command.name.startsWith(text.value))
})

function loadMessages() {
  const nickname = sessionStorage.getItem('serpent-current-user')
  if (!activeChannelName.value || !nickname) {
    messages.value = []
    return
  }

  messages.value = getMessages(activeChannelName.value, nickname)
}

function sendMessage() {
  const messageText = text.value.trim()
  const parts = messageText.split(/\s+/)
  const commandName = parts[0]

  if (commandName === '/join') {
    const channelName = parts[1]
    const visibility = parts[2]

    if (!channelName || (visibility && visibility !== 'private')) return

    const owner = sessionStorage.getItem('serpent-current-user')
    if (!owner) return

    try {
      createChannel(owner, channelName, visibility === 'private')
      channels.value = getChannelsForUser(owner)
      activeChannelName.value = channelName
      text.value = ''
    } catch (error) {
      console.error('Could not create channel', error)
    }
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

watch(activeChannelName, loadMessages, { immediate: true })

onMounted(() => {
  refreshChannels()
})

export function useChat() {
  return {
    channels,
    refreshChannels,
    text,
    messages,
    commandIndex,
    sendMessage,
    filteredCommands,
    channelMessages: messages,
    activeChannelName,
    openChannel: (name: string) => {
      activeChannelName.value = name
    }
  }
}

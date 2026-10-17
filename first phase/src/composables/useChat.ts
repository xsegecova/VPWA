import {ref,computed} from 'vue'
import { useChannels } from './createChannels'



const text = ref('')
const messages = ref<{
  name: string | null
  text: string
  channelName: string
}[]>([])

const commandIndex = ref(0)
const savedMessages = localStorage.getItem('serpent-messages') //nacitanie predoslych sprav
const { createChannels, activeChannelName } = useChannels()

type Commands = {
  name: string
  syntax: string
}

const command: Commands[] = [
  { name: '/join', syntax: '/join {channelName} [private]' }, //private je volitelny paramter :D
  { name: '/invite', syntax: '/invite {nickName}' },
  { name: '/revoke', syntax: '/revoke {nickName}' },
  { name: '/kick', syntax: '/kick {nickName}' },
  { name: '/quit', syntax: '/quit' },
  { name: '/cancel', syntax:'/cancel'},
  { name: '/list', syntax: '/list'},
  { name: '@', syntax:'@{nickName}'}
]

const filteredCommands = computed(() => {
  if (!text.value.startsWith('/')) return []

  return command.filter(command =>
    command.name.startsWith(text.value)
  )
})

function sendMessage() {
  const message = text.value
  if (message.trim() === '') return

  const parts = message.trim().split(/\s+/)
  const commandName = parts[0]
  const channelName = parts[1]
  const visibility = parts[2]

  if (commandName === '/join') {
    if (!channelName) return
    if (visibility && visibility !== 'private') return

    const status = visibility === 'private' ? 'private' : 'public'
    const created = createChannels(channelName, status)

    if (created) {
      text.value = ''
    }

    return
  }

  const currentChannelName = activeChannelName.value
  if (!currentChannelName) return

  messages.value.push({
    name: localStorage.getItem('serpent-nickname'),
    text: message,
    channelName: currentChannelName
  })

  localStorage.setItem(
    'serpent-messages',
    JSON.stringify(messages.value)
  )

  text.value = ''
}


if (savedMessages !== null) {
  messages.value = JSON.parse(savedMessages)
}

const channelMessages = computed(() =>
  messages.value.filter(message =>
    message.channelName === activeChannelName.value
  )
)

export function useChat() {
  return {
    text,
    messages,
    commandIndex,
    sendMessage,
    filteredCommands,
    channelMessages,
    activeChannelName
  }
}

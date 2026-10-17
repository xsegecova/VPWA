import {ref} from 'vue'

type Channel = {
  name: string
  admin: string
  status: 'public' | 'private'
  members: string[]
  lastMessageAt : number
}

const channels = ref<Channel[]>([])


function createChannels (name:string, status: 'public' | 'private'){
  const exists = channels.value.some(channel => channel.name === name)
  if (exists) {
    return
  }

  const nickName = sessionStorage.getItem('serpent-current-user')
  if(!nickName) return

  const new_channel : Channel = {
    name:name,
    status:status,
    admin: nickName,
    members: [nickName],
    lastMessageAt: Date.now()
  }

  channels.value.push(new_channel)

  localStorage.setItem('serpent-channels',JSON.stringify(channels.value))

  activeChannelName.value = name
  return true
}

const activeChannelName = ref<string | null>(null)
const savedChannels = localStorage.getItem('serpent-channels')

if (savedChannels !== null) {
  channels.value = JSON.parse(savedChannels)
}

function openChannel(name: string) {
  activeChannelName.value = name
}

export function useChannels() {
  return { channels, createChannels, activeChannelName, openChannel }
}

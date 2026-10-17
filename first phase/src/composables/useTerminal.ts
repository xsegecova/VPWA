import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { createInvite, joinChannel } from './tempBackend'
import { getCurrentNickname } from './useChannel'

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

type ChannelActions = {
  activeChannelName: Ref<string | null>
  activeChannel: ComputedRef<unknown>
  commandError: Ref<string>
  text: Ref<string>
  refreshChannels: () => void
  loadMessages: () => void
  requireOnlineUser: (message: string) => string | null
  cancelActiveChannel: () => boolean
  saveMessage: (channel: string, from: string, text: string) => unknown
  kickUserFromChannel: (user: string, channel: string, by: string) => unknown
  leaveChannel: (channel: string, nickname: string) => unknown
  showChannelInfo: Ref<boolean>
  logout: () => void
}

export function useTerminal(channel: ChannelActions) {
  const text = channel.text
  const commandError = channel.commandError
  const commandIndex = ref(0)
  const filteredCommands = computed(() => {
    if (!text.value.startsWith('/')) return []
    return commands.filter((command) => command.name.startsWith(text.value))
  })

  function sendMessage() {
    const messageText = text.value.trim()
    commandError.value = ''
    const parts = messageText.split(/\s+/)
    const commandName = parts[0]
    const nickname = getCurrentNickname()

    if (commandName === '/quit') {
      channel.logout()
      return
    }

    if (commandName === '/invite') {
      const receiver = parts[1]
      const channelName = channel.activeChannelName.value
      if (!receiver || !channelName) {
        commandError.value = 'Usage: /invite {nickname} while a channel is open'
        return
      }
      const onlineNickname = channel.requireOnlineUser('You must be online to send invitations')
      if (!onlineNickname) return
      try {
        createInvite(onlineNickname, receiver, channelName)
        text.value = ''
      } catch (error) {
        console.error('Could not invite user', error)
      }
      return
    }

    if (commandName === '/kick') {
      const user = parts[1]
      const channelName = channel.activeChannelName.value
      if (!nickname || !user || !channelName) {
        commandError.value = 'Usage: /kick {nickname} while a channel is open'
        return
      }
      try {
        channel.kickUserFromChannel(user, channelName, nickname)
        channel.refreshChannels()
        text.value = ''
      } catch (error) {
        console.error('Could not kick user', error)
      }
      return
    }

    if (commandName === '/leave') {
      const channelName = channel.activeChannelName.value
      if (!nickname || !channelName) {
        commandError.value = 'Usage: /leave while a channel is open'
        return
      }
      try {
        channel.leaveChannel(channelName, nickname)
        channel.refreshChannels()
        channel.activeChannelName.value = null
        text.value = ''
      } catch (error) {
        console.error('Could not leave channel', error)
      }
      return
    }

    if (commandName === '/join') {
      const channelName = parts[1]
      const visibility = parts[2]
      if (!channelName || (visibility && visibility !== 'private')) {
        commandError.value = 'Usage: /join {channelName} [private]'
        return
      }
      const onlineNickname = channel.requireOnlineUser('You must be online to join a channel')
      if (!onlineNickname) return
      try {
        const joinedChannel = joinChannel(onlineNickname, channelName, visibility === 'private')
        channel.refreshChannels()
        channel.activeChannelName.value = joinedChannel.name
        text.value = ''
      } catch (error) {
        console.error('Could not join channel', error)
      }
      return
    }

    if (commandName === '/cancel') {
      channel.cancelActiveChannel()
      return
    }

    if (commandName === '/list') {
      if (nickname && channel.activeChannel.value) {
        channel.showChannelInfo.value = true
        text.value = ''
      }
      return
    }

    const channelName = channel.activeChannelName.value
    if (!messageText || !channelName) return

    const fromUser = channel.requireOnlineUser('You must be online to send messages')
    if (!fromUser) return

    try {
      channel.saveMessage(channelName, fromUser, messageText)
      channel.loadMessages()
      text.value = ''
    } catch (error) {
      console.error('Could not send message', error)
      commandError.value = error instanceof Error ? error.message : 'Could not send message'
    }
  }

  return { text, commandError, commandIndex, filteredCommands, sendMessage }
}

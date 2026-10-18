import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { createInvite, joinChannel, getCurNickname } from './tempBackend'

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
  commandMessage: Ref<string>
  commandMessageType: Ref<'success' | 'error'>
  text: Ref<string>
  refreshChannels: () => void
  loadMessages: () => void
  requireOnlineUser: (message: string) => string | null
  setCurrentMessage: (text: string) => void
  cancelActiveChannel: () => boolean
  saveMessage: (channel: string, text: string) => unknown
  kickUserFromChannel: (user: string, channel: string) => unknown
  leaveChannel: (channel: string) => unknown
  showChannelInfo: Ref<boolean>
  logout: () => void
}

export function useTerminal(channel: ChannelActions) {
  const text = channel.text
  const commandError = channel.commandError
  const commandMessage = channel.commandMessage
  const commandMessageType = channel.commandMessageType
  const commandIndex = ref(0)
  const filteredCommands = computed(() => {
    if (!text.value.startsWith('/')) return []
    return commands.filter((command) => command.name.startsWith(text.value))
  })

  function sendMessage() {
    const messageText = text.value.trim()
    commandError.value = ''
    commandMessage.value = ''
    const parts = messageText.split(/\s+/)
    const commandName = parts[0]
    const nickname = getCurNickname()

    if (commandName === '/quit') {
      channel.setCurrentMessage('')
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
        createInvite(receiver, channelName)
        text.value = ''
        channel.setCurrentMessage('')
        commandMessageType.value = 'success'
        commandMessage.value = `Invitation sent to "${receiver}"`
      } catch (error) {
        console.error('Could not invite user', error)
        commandMessageType.value = 'error'
        commandMessage.value = error instanceof Error ? error.message : 'Could not send invitation'
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
        channel.kickUserFromChannel(user, channelName)
        channel.refreshChannels()
        text.value = ''
        channel.setCurrentMessage('')
        commandMessageType.value = 'success'
        commandMessage.value = `Removed "${user}" from the channel`
      } catch (error) {
        console.error('Could not kick user', error)
        commandMessageType.value = 'error'
        commandMessage.value = error instanceof Error ? error.message : 'Could not remove user'
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
        channel.leaveChannel(channelName)
        channel.refreshChannels()
        channel.activeChannelName.value = null
        text.value = ''
        channel.setCurrentMessage('')
        commandMessageType.value = 'success'
        commandMessage.value = `Left "${channelName}"`
      } catch (error) {
        console.error('Could not leave channel', error)
        commandMessageType.value = 'error'
        commandMessage.value = error instanceof Error ? error.message : 'Could not leave channel'
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
        const joinedChannel = joinChannel(channelName, visibility === 'private')
        channel.refreshChannels()
        channel.activeChannelName.value = joinedChannel.name
        text.value = ''
        channel.setCurrentMessage('')
        commandMessageType.value = 'success'
        commandMessage.value = `Joined "${joinedChannel.name}"`
      } catch (error) {
        console.error('Could not join channel', error)
        commandMessageType.value = 'error'
        commandMessage.value = error instanceof Error ? error.message : 'Could not join channel'
      }
      return
    }

    if (commandName === '/cancel') {
      const cancelled = channel.cancelActiveChannel()
      if (cancelled) {
        text.value = ''
        channel.setCurrentMessage('')
        commandMessageType.value = 'success'
        commandMessage.value = 'Message cancelled'
      }
      return
    }

    if (commandName === '/list') {
      if (nickname && channel.activeChannel.value) {
        channel.showChannelInfo.value = true
        text.value = ''
        channel.setCurrentMessage('')
        commandMessageType.value = 'success'
        commandMessage.value = 'Displayed channel information'
      }
      return
    }

    const channelName = channel.activeChannelName.value
    if (!messageText || !channelName) return

    if (!channel.requireOnlineUser('You must be online to send messages')) return

    try {
      channel.saveMessage(channelName, messageText)
      channel.loadMessages()
      text.value = ''
      channel.setCurrentMessage('')
    } catch (error) {
      console.error('Could not send message', error)
      commandMessageType.value = 'error'
      commandMessage.value = error instanceof Error ? error.message : 'Could not send message'
    }
  }

  return {
    text,
    commandError,
    commandMessage,
    commandMessageType,
    commandIndex,
    filteredCommands,
    sendMessage,
  }
}

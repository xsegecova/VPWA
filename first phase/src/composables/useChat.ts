import { onMounted, onUnmounted, watch } from 'vue'
import { backendChangeEvent } from './tempBackend'
import { useChannel } from './useChannel'
import { useTerminal } from './useTerminal'

export function useChat() {
  const channel = useChannel()
  const terminal = useTerminal({
    activeChannelName: channel.activeChannelName,
    activeChannel: channel.activeChannel,
    commandError: channel.commandError,
    text: channel.text,
    refreshChannels: channel.refreshChannels,
    loadMessages: channel.loadMessages,
    requireOnlineUser: channel.requireOnlineUser,
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
  }
}

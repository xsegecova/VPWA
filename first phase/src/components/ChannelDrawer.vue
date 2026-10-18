<template>
  <q-drawer
    :model-value="drawerOpen"
    class="chat-sidebar channel-drawer"
    show-if-above
    side="left"
    bordered
    @update:model-value="$emit('update:drawer-open', $event)"
  >
    <div class="chat-list-header">
      <div class="text-h5 text-main">Chats</div>
      <q-btn
        flat
        dense
        icon="add"
        color="accent"
        aria-label="Create channel"
        class="create-channel-button"
        @click="$emit('create-channel')"
      >
        <q-tooltip>Create channel</q-tooltip>
      </q-btn>
    </div>

    <q-separator size="3px" />

    <q-list v-if="invites.length > 0" bordered>
      <q-item-label header>
        <q-icon name="fiber_new" color="primary" class="q-mr-sm" />
        New invitations
      </q-item-label>
      <q-item
        v-for="invite in invites"
        :key="`${invite.sender}-${invite.channel}-${invite.sendTime}`"
      >
        <q-item-section class="channel-content">
          <q-item-label class="channel-text">{{ invite.channel }}</q-item-label>
          <q-item-label caption>Invited by {{ invite.sender }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row q-gutter-xs">
            <q-btn
              flat
              round
              dense
              icon="check"
              color="positive"
              aria-label="Accept invitation"
              @click="$emit('accept-invite', invite)"
            />
            <q-btn
              flat
              round
              dense
              icon="close"
              color="negative"
              aria-label="Reject invitation"
              @click="$emit('reject-invite', invite)"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <q-list>
      <q-item
        v-for="channel in sortedChannels"
        :key="channel.name"
        clickable
        :active="activeChannelName === channel.name"
        class="channel-item"
        :class="channelClasses(channel)"
        @click="$emit('open-channel', channel.name)"
      >
        <q-item-section class="channel-content">
          <div class="channel-name">
            <q-icon
              v-if="channel.owner === currentUser"
              name="key"
              size="14px"
              class="owner-channel-icon"
              aria-label="Channel owner"
            />
            <q-icon
              v-if="channel.isPrivate"
              name="lock"
              size="15px"
              class="private-channel-icon"
              aria-label="Private channel"
            />
            <span class="channel-text">{{ channel.name }}</span>
          </div>
          <q-item-label
            v-if="channelPreview(channel)"
            caption
            class="message-preview"
            :class="{ 'mention-preview': shouldHighlightMention(channel) }"
          >
            <strong>{{ channelPreview(channel)?.fromUser }}:</strong>
            {{ channelPreview(channel)?.text }}
          </q-item-label>
        </q-item-section>

        <q-item-section side class="channel-meta">
          <div class="row items-center q-gutter-sm">
            <q-badge
              v-if="unreadChannels.has(channel.name) && shouldShowActivity(channel)"
              label="new"
              color="positive"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import type { Channel, Invite } from '@/composables/tempBackend'
import type { MessageMentionMatcher } from '@/composables/useChat'

const props = defineProps<{
  invites: Invite[]
  sortedChannels: Channel[]
  activeChannelName: string | null
  drawerOpen: boolean
  notificationsDirectOnly: boolean
  mentionedChannels: Set<string>
  unreadChannels: Set<string>
  currentUser: string
  messageMentionsUser: MessageMentionMatcher
}>()

defineEmits<{
  'create-channel': []
  'accept-invite': [invite: Invite]
  'reject-invite': [invite: Invite]
  'open-channel': [name: string]
  'update:drawer-open': [open: boolean]
}>()

function channelPreview(channel: Channel) {
  return channel.messages[channel.messages.length - 1]
}

function channelHasMention(channel: Channel) {
  const preview = channelPreview(channel)
  return !!preview && props.messageMentionsUser(preview.text, props.currentUser)
}

function shouldShowActivity(channel: Channel) {
  return !props.notificationsDirectOnly || props.mentionedChannels.has(channel.name)
}

function shouldHighlightMention(channel: Channel) {
  return channelHasMention(channel)
}

function channelClasses(channel: Channel) {
  return {
    'unread-channel': props.unreadChannels.has(channel.name) && shouldShowActivity(channel),
    'active-channel': props.activeChannelName === channel.name,
    'mention-channel': !props.notificationsDirectOnly && props.mentionedChannels.has(channel.name),
  }
}
</script>

<style scoped>
.channel-drawer :deep(.q-drawer__content) {
  overflow-y: auto;
}

.chat-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 8px 16px;
}

.create-channel-button {
  background: rgba(209, 164, 93, 0.1);
  border: 1px solid rgba(209, 164, 93, 0.45);
}

.create-channel-button:hover {
  background: rgba(209, 164, 93, 0.2);
}

.channel-item {
  min-height: 52px;
  min-width: 0;
  margin: 0 8px;
  border-bottom: 1px solid rgba(70, 91, 73, 0.45);
  transition:
    background-color 120ms ease,
    border-color 120ms ease;
}

.channel-content {
  min-width: 0;
}

.channel-text,
.message-preview {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-item:hover {
  background: rgba(70, 91, 73, 0.28);
}

.active-channel {
  background: #35482d !important;
  border-left: 3px solid #d1a45d;
  border-bottom-color: #d1a45d;
  color: #f0f4e9;
}

.unread-channel:not(.active-channel) {
  background: rgba(131, 201, 144, 0.08);
}

.channel-name {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 7px;
  font-weight: 600;
}

.private-channel-icon {
  color: #aab7a5;
}

.owner-channel-icon {
  color: #d1a45d;
}

.channel-meta {
  opacity: 0.82;
}

.mention-channel {
  background: #5b4a20 !important;
  color: #fff3c4 !important;
  border-left: 4px solid #d1a45d;
}

.active-channel.mention-channel {
  background: #35482d !important;
  color: #f0f4e9 !important;
}

.mention-preview {
  color: #d1a45d !important;
}
</style>

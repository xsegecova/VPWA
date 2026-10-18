<template>
  <q-page class="chat-page q-pa-md">
    <q-toolbar class="chat-toolbar">
      <q-space />
      <q-btn
        flat
        dense
        no-caps
        :disable="!activeChannelName"
        class="channel-name-button"
        @click="showChannelInfo = true"
      >
        <span>{{ activeChannelName || 'Create channel' }}</span>
        <q-icon v-if="activeChannelName" name="build" size="16px" class="channel-wrench" />
        <q-tooltip v-if="activeChannelName">Channel settings</q-tooltip>
      </q-btn>
    </q-toolbar>
    <q-dialog v-model="showChannelInfo">
      <q-card v-if="activeChannel" dark class="channel-info-card">
        <q-card-section class="channel-info-header">
          <div>
            <div class="text-h6">{{ activeChannel.name }}</div>
            <div class="channel-visibility">
              <q-icon :name="activeChannel.isPrivate ? 'lock' : 'tag'" size="15px" />
              {{ activeChannel.isPrivate ? 'Private channel' : 'Public channel' }}
            </div>
          </div>
          <q-btn flat dense icon="close" aria-label="Close channel information" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="channel-info-section">
          <div class="section-label">Channel owner</div>
          <div class="owner-name">{{ activeChannel.owner }}</div>
        </q-card-section>

        <q-card-section class="channel-info-section">
          <div class="section-label">Members · {{ activeChannel.people.length }}</div>
          <q-list class="member-list">
            <q-item v-for="nickname in activeChannel.people" :key="nickname" dense>
              <q-item-section avatar>
                <q-avatar size="26px" class="member-avatar">
                  {{ nickname.slice(0, 1).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>{{ nickname }}</q-item-section>
              <q-item-section side class="member-status">{{
                statusLabel(nickname)
              }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions class="channel-info-actions">
          <q-btn
            :label="isChannelAdmin ? 'Delete' : 'Leave'"
            color="negative"
            @click="confirmCancelChannel"
          />

          <q-space />

          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showChannelActionConfirm" persistent>
      <q-card dark class="confirmation-card">
        <q-card-section>
          <div class="text-h6">{{ isChannelAdmin ? 'Delete channel?' : 'Leave channel?' }}</div>
          <div class="text-body2 text-grey-5 q-mt-sm">
            {{
              isChannelAdmin
                ? `This will permanently delete ${activeChannelName}.`
                : `You will leave ${activeChannelName}.`
            }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="negative"
            :label="isChannelAdmin ? 'Delete channel' : 'Leave channel'"
            @click="executeChannelAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div ref="messageScroll" class="message-scroll" @scroll="updateScrollPosition">
      <q-infinite-scroll
        :key="activeChannelName ?? 'no-channel'"
        reverse
        scroll-target=".message-scroll"
        :offset="120"
        :disable="!hasMoreMessages"
        @load="loadOlderMessages"
      >
        <div
          v-for="message in visibleMessages"
          :key="message.kedy"
          class="message-wrapper"
          :class="{ 'mentioned-message': messageMentionsUser(message.text, currentUser) }"
        >
          <div class="message-name">{{ message.fromUser }}</div>
          <div class="user-message">{{ message.text }}</div>
        </div>

        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="28px" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>
    <div v-if="typingMessages.length > 0" class="typing-indicator">
      <span>{{ typingNames }} {{ typingMessages.length === 1 ? 'is' : 'are' }} typing...</span>
      <div class="typing-user-buttons">
        <q-btn
          v-for="message in typingMessages"
          :key="message.fromUser"
          flat
          dense
          no-caps
          class="typing-user-button"
          @click="showDraft(message.fromUser)"
        >
          {{ message.fromUser }}
        </q-btn>
      </div>
      <div v-if="selectedDraft" class="draft-preview">
        <strong>{{ selectedDraft.fromUser }}:</strong>
        {{ selectedDraft.text }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useChat } from '@/composables/useChat'
import { getUser, userStatuses } from '@/composables/tempBackend'

const {
  channelMessages,
  activeChannelName,
  activeChannel,
  cancelActiveChannel,
  isChannelAdmin,
  messageMentionsUser,
  showChannelInfo,
  currentMessages,
} = useChat()
const currentUser = sessionStorage.getItem('serpent-current-user') ?? ''
const pageSize = 30
const visibleMessageCount = ref(pageSize)
const messageScroll = ref<HTMLDivElement | null>(null)
const isNearBottom = ref(true)
const showChannelActionConfirm = ref(false)
const selectedDraftUser = ref<string | null>(null)

const visibleMessages = computed(() => channelMessages.value.slice(-visibleMessageCount.value))
const hasMoreMessages = computed(() => visibleMessageCount.value < channelMessages.value.length)
const typingMessages = computed(() =>
  currentMessages.value.filter((message) => message.fromUser !== currentUser),
)
const typingNames = computed(() =>
  typingMessages.value.map((message) => message.fromUser).join(', '),
)
const selectedDraft = computed(
  () =>
    typingMessages.value.find((message) => message.fromUser === selectedDraftUser.value) ?? null,
)

function showDraft(nickname: string) {
  selectedDraftUser.value = selectedDraftUser.value === nickname ? null : nickname
}

function updateScrollPosition() {
  const element = messageScroll.value
  if (!element) return

  isNearBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight <= 24
}

function scrollToBottom() {
  const element = messageScroll.value
  if (!element) return

  element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
}

function loadOlderMessages(_index: number, done: () => void) {
  visibleMessageCount.value = Math.min(
    visibleMessageCount.value + pageSize,
    channelMessages.value.length,
  )
  done()
}

watch(activeChannelName, () => {
  visibleMessageCount.value = pageSize
  isNearBottom.value = true
  void nextTick(scrollToBottom)
})

watch(
  () => channelMessages.value[channelMessages.value.length - 1]?.kedy,
  (latestMessage, previousMessage) => {
    if (latestMessage && latestMessage !== previousMessage && isNearBottom.value) {
      void nextTick(scrollToBottom)
    }
  },
)

function confirmCancelChannel() {
  showChannelActionConfirm.value = true
}

function executeChannelAction() {
  if (cancelActiveChannel()) {
    showChannelActionConfirm.value = false
    showChannelInfo.value = false
  }
}

function statusLabel(nickname: string) {
  const status = getUser(nickname)?.status
  if (status === userStatuses.dnd) return 'DND'
  if (status === userStatuses.offline) return 'Offline'
  return 'Online'
}
</script>

<style scoped lang="scss">
.user-message {
  width: fit-content;
  max-width: 75%;
  min-width: 0;
  margin-right: auto;
  padding: 10px 14px;
  box-sizing: border-box;
  background: #304329;
  color: #e6ebdf;
  border-radius: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.chat-page {
  display: flex;
  flex-direction: column;
  min-height: 0 !important;
  height: calc(100vh - 112px);
}

.chat-toolbar {
  flex: 0 0 auto;
  padding-left: 0;
  padding-right: 0;
}

.typing-indicator {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  flex-wrap: wrap;
  min-width: 0;
  gap: 4px;
  padding-top: 8px;
  color: #aab7a5;
  font-size: 0.8rem;
}

.typing-user-buttons {
  display: flex;
  align-items: center;
}

.typing-user-button {
  min-height: 24px;
  color: #d1a45d;
}

.draft-preview {
  flex: 1 1 100%;
  min-width: 0;
  padding: 6px 10px;
  color: #e6ebdf;
  background: rgba(48, 67, 41, 0.7);
  border-left: 3px solid #d1a45d;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.draft-preview strong {
  color: #d1a45d;
}

.channel-name-button {
  max-width: 100%;
  font-size: 1.1rem;
  font-weight: 600;
  color: #aab7a5;
}

.channel-wrench {
  margin-left: 7px;
  color: #869680;
}

.channel-name-button:hover {
  color: #d1a45d;
  background: rgba(209, 164, 93, 0.1);
}

.channel-name-button:hover .channel-wrench {
  color: #d1a45d;
}

.message-scroll {
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.message-scroll::-webkit-scrollbar {
  display: none;
}

.message-scroll :deep(.q-infinite-scroll) {
  min-height: 100%;
  min-width: 0;
}

.message-wrapper {
  min-width: 0;
  margin-bottom: 12px;
}

.mentioned-message {
  padding: 8px;
  background: #5b4a20;
  border-left: 4px solid #d1a45d;
  border-radius: 6px;
}

.message-name {
  text-align: left;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: bold;
}

.channel-info-card {
  width: min(400px, calc(100vw - 32px));
  background: #1e2720;
  border: 1px solid #465b49;
  border-radius: 0;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
}

.channel-info-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.channel-visibility {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  color: #aab7a5;
  font-size: 0.8rem;
}

.channel-info-section {
  padding-top: 14px;
  padding-bottom: 14px;
}

.section-label {
  margin-bottom: 8px;
  color: #869680;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.owner-name {
  color: #e6ebdf;
  font-weight: 600;
}

.member-list {
  background: #171d18;
  border: 1px solid #2b382e;
}

.member-avatar {
  background: #35482d;
  color: #d1a45d;
  font-size: 0.75rem;
  font-weight: 700;
}

.member-status {
  color: #869680;
  font-size: 0.75rem;
}

.channel-info-actions {
  border-top: 1px solid #2b382e;
}

.confirmation-card {
  width: min(380px, calc(100vw - 32px));
  background: #1e2720;
  border: 1px solid #465b49;
  border-radius: 0;
}
</style>

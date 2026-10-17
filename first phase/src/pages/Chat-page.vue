<template>
  <q-page class="q-pa-md">
    <q-toolbar>
      <q-toolbar-title>
        {{ activeChannelName || 'Vyber kanál' }}
      </q-toolbar-title>

      <q-btn
        v-if="activeChannelName"
        flat
        round
        icon="settings"
        @click="showChannelInfo = true "
      >
  </q-btn>
</q-toolbar>
<q-dialog v-model="showChannelInfo">
          <q-card
            v-if="activeChannel"
            dark
            style="min-width: 300px"
          >
        <q-card-section>
          <div class="text-h6">{{ activeChannel.name }}</div>

                <q-badge>
                  {{ activeChannel.isPrivate ? 'Private' : 'Public' }}
                </q-badge>
              </q-card-section>

              <q-card-section> Správca: {{ activeChannel.owner }} </q-card-section>

              <q-card-section>
                Členovia: {{ activeChannel.people.length }}

                <q-list>
                  <q-item v-for="nickname in activeChannel.people" :key="nickname">
                    <q-item-section>{{ nickname }}</q-item-section>
                    <q-item-section side>{{ statusLabel(nickname) }}</q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>

              <q-card-actions>
                <q-btn
                  :label="isChannelAdmin ? 'Delete' : 'Leave'"
                  color="negative"
                  @click="confirmCancelChannel"
                />

                <q-space />

      <q-btn flat label="Zavrieť" v-close-popup />
      </q-card-actions>
        </q-card>
      </q-dialog>

    <div
      v-for="(message, index) in channelMessages"
      :key="index"
      class="message-wrapper"
      :class="{ 'mentioned-message': messageMentionsUser(message.text, currentUser) }"
    >
      <div class="message-name">{{ message.fromUser }}</div>
      <div class="user-message">{{ message.text }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useChat } from '@/composables/useChat'
import { getUser, userStatuses } from '@/composables/tempBackend'

const {
  channelMessages,
  activeChannelName,
  activeChannel,
  cancelActiveChannel,
  isChannelAdmin,
  messageMentionsUser,
} = useChat()
const showChannelInfo = ref(false)
const currentUser = sessionStorage.getItem('serpent-current-user') ?? ''

function confirmCancelChannel() {
  if (cancelActiveChannel()) {
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

<style scoped>
.user-message {
  width: fit-content;
  max-width: 75%;
  margin-left: auto;
  padding: 10px 14px;
  background: #304329;
  color: #e6ebdf;
  border-radius: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.message-wrapper {
  margin-bottom: 12px;
}

.mentioned-message {
  padding: 8px;
  background: #5b4a20;
  border-left: 4px solid #d1a45d;
  border-radius: 6px;
}

.message-name {
  text-align: right;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: bold;
}
</style>

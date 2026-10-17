<template>
  <q-layout view="hhh lpR lff">
    <q-header bordered class="app-header bg-secondary text-main">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="row items-center brand-title">
          <q-avatar size="34px" class="app-logo">
            <img alt="Serpent logo" src="/serpent.png" />
          </q-avatar>
          <span class="q-ml-sm text-weight-bold">Serpent - {{ currentUser }}</span>
        </q-toolbar-title>
        <q-space />
        <q-btn flat dense no-caps class="status-button q-mr-sm">
            <span class="status-dot" :class="`status-${statusLabel.toLowerCase()}`" />
            <span class="q-ml-xs">Status: {{ statusLabel }}</span>
            <q-icon name="expand_more" size="18px" class="q-ml-xs" />
            <q-menu anchor="bottom right" self="top right" dark class="status-menu">
              <q-list padding>
                <q-item-label header class="status-menu-heading">Set your status</q-item-label>
                <q-item
                  clickable
                  v-close-popup
                  :active="userStatus === userStatuses.online"
                  active-class="status-option-online"
                  class="status-option"
                  @click="setUserStatus(userStatuses.online)"
                >
                  <q-item-section avatar>
                    <span class="status-dot status-online" />
                  </q-item-section>
                  <q-item-section>Online</q-item-section>
                  <q-item-section v-if="userStatus === userStatuses.online" side>
                    <q-icon name="check" color="positive" />
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  :active="userStatus === userStatuses.dnd"
                  active-class="status-option-dnd"
                  class="status-option"
                  @click="setUserStatus(userStatuses.dnd)"
                >
                  <q-item-section avatar>
                    <span class="status-dot status-dnd" />
                  </q-item-section>
                  <q-item-section>Do not disturb</q-item-section>
                  <q-item-section v-if="userStatus === userStatuses.dnd" side>
                    <q-icon name="check" color="negative" />
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  :active="userStatus === userStatuses.offline"
                  active-class="status-option-offline"
                  class="status-option"
                  @click="setUserStatus(userStatuses.offline)"
                >
                  <q-item-section avatar>
                    <span class="status-dot status-offline" />
                  </q-item-section>
                  <q-item-section>Offline</q-item-section>
                  <q-item-section v-if="userStatus === userStatuses.offline" side>
                    <q-icon name="check" color="grey-6" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        <q-btn
          flat
          round
          dense
          icon="settings"
          class="settings-button q-ml-sm"
          aria-label="Open settings"
        >
          <q-tooltip>Settings</q-tooltip>
          <q-menu anchor="bottom right" self="top right" dark class="settings-menu">
            <q-list padding style="min-width: 240px">
              <q-item-label header class="settings-heading">
                <q-icon name="tune" size="18px" class="q-mr-sm" />
                Preferences
              </q-item-label>
              <q-item clickable class="settings-option" @click.stop>
                <q-item-section>
                  <q-item-label>Only mentions</q-item-label>
                  <q-item-label caption>Show activity only when mentioned</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle
                    :model-value="notificationsDirectOnly"
                    @click.stop
                    @update:model-value="setNotificationsDirectOnly"
                  />
                </q-item-section>
              </q-item>
              <q-separator class="q-my-sm" />
              <q-item clickable class="logout-option" v-close-popup @click="requestLogout">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Log out</q-item-label>
                  <q-item-label caption>End your current session</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <ChannelDrawer
      :drawer-open="leftDrawerOpen"
      :invites="invites"
      :sorted-channels="sortedChannels"
      :active-channel-name="activeChannelName"
      :user-status="userStatus"
      :notifications-direct-only="notificationsDirectOnly"
      :mentioned-channels="mentionedChannels"
      :unread-channels="unreadChannels"
      :current-user="currentUser"
      :message-mentions-user="messageMentionsUser"
      @update:drawer-open="leftDrawerOpen = $event"
      @create-channel="showCreateChannel = true"
      @accept-invite="acceptChannelInvite"
      @reject-invite="rejectChannelInvite"
      @open-channel="openChannel"
    />

    <q-dialog v-model="showCreateChannel" transition-show="scale" transition-hide="scale">
      <q-card dark class="create-channel-card">
        <q-card-section>
          <div class="text-h6">Create a channel</div>
          <div class="text-caption text-grey-5 q-mt-xs">
            Start a new conversation with your team.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input v-model="newChannelName" label="Názov kanála" dark />

          <q-select
            v-model="newChannelStatus"
            :options="['public', 'private']"
            label="Viditeľnosť"
            dark
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />

          <q-btn color="primary" label="Create channel" @click="confirmCreateChannel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showLogoutConfirm" persistent>
      <q-card dark class="confirmation-card">
        <q-card-section>
          <div class="text-h6">Log out?</div>
          <div class="text-body2 text-grey-5 q-mt-sm">
            Are you sure you want to end your current session?
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Log out" @click="confirmLogout" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container class="app-page-container">
      <router-view />
    </q-page-container>

    <q-footer bordered class="terminal text-main">
      <ChatCommandInput
        :text="text"
        :command-error="commandError"
        :command-index="commandIndex"
        :filtered-commands="filteredCommands"
        @update:text="text = $event"
        @move="movement"
        @enter="handleEnter"
        @set-index="commandIndex = $event"
        @select="selectCommand"
        @send="submitTerminal"
      />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useChat } from '@/composables/useChat'
import { createChannel, userStatuses } from '@/composables/tempBackend'
import ChannelDrawer from '@/components/ChannelDrawer.vue'
import ChatCommandInput from '@/components/ChatCommandInput.vue'

const {
  invites,
  refreshChannels,
  activeChannelName,
  openChannel,
  sendMessage,
  text,
  commandError,
  userStatus,
  notificationsDirectOnly,
  setUserStatus,
  setNotificationsDirectOnly,
  commandIndex,
  filteredCommands,
  acceptInvite: acceptChannelInvite,
  rejectInvite: rejectChannelInvite,
  sortedChannels,
  unreadChannels,
  mentionedChannels,
  messageMentionsUser,
  logout: logoutFromChat,
} = useChat()
const currentUser = sessionStorage.getItem('serpent-current-user') ?? 'Unknown user'
const showCreateChannel = ref(false)
const newChannelName = ref('')
const newChannelStatus = ref<'public' | 'private'>('public')
const showLogoutConfirm = ref(false)

const leftDrawerOpen = ref(false)
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const statusLabel = computed(() => {
  if (userStatus.value === userStatuses.dnd) return 'DND'
  if (userStatus.value === userStatuses.offline) return 'Offline'
  return 'Online'
})

function requestLogout() {
  showLogoutConfirm.value = true
}

function confirmLogout() {
  showLogoutConfirm.value = false
  logoutFromChat()
}

function submitTerminal() {
  if (text.value.trim() === '/quit') {
    requestLogout()
    return
  }
  sendMessage()
}

watch(filteredCommands, () => {
  commandIndex.value = 0
}) //resetuje poziciu indexu na 0 ked sa pickneme nejaky command

watch(text, () => {
  commandError.value = ''
})

function movement(directiom: number) {
  const nextPosition = commandIndex.value + directiom
  if (
    nextPosition >= 0 &&
    nextPosition < filteredCommands.value.length //indexovanie pozicii commandov v 'command okne' aby sme mohli mat movement up down
  ) {
    commandIndex.value = nextPosition
  } //nastavenie indexu
}

function handleEnter() {
  if (text.value.trim() === '/quit') {
    requestLogout()
    return
  }

  const command = filteredCommands.value[commandIndex.value]

  if (command && text.value.trim() !== command.name) {
    selectCommand(command.name)
    return //ak je command tak ho napis
  }

  sendMessage() //inak piseme spravy
}

function selectCommand(commandName: string) {
  text.value = commandName + ' '
}

function confirmCreateChannel() {
  const owner = sessionStorage.getItem('serpent-current-user')
  const name = newChannelName.value.trim()

  if (!owner || !name) return

  try {
    createChannel(owner, name, newChannelStatus.value === 'private')
    refreshChannels()
    activeChannelName.value = name
    showCreateChannel.value = false
    newChannelName.value = ''
    newChannelStatus.value = 'public'
  } catch (error) {
    console.error('Could not create channel', error)
  }
}
</script>

<style scoped>
.app-header {
  backdrop-filter: blur(8px);
}

.app-page-container {
  min-height: 0;
  height: 0;
}

.app-logo {
  background: rgba(255, 255, 255, 0.08);
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-channel-card {
  width: min(420px, calc(100vw - 32px));
  border: 1px solid rgba(163, 217, 119, 0.35);
  border-radius: 0;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}

.settings-menu {
  background: #1e2720;
  border: 1px solid #465b49;
  border-radius: 0;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
}

.settings-heading {
  color: #a3d977;
  font-weight: 700;
}

.settings-option,
.logout-option {
  border-radius: 0;
}

.settings-option:hover {
  background: #2c392f;
}

.logout-option {
  color: #e08076;
}

.logout-option:hover {
  background: rgba(224, 128, 118, 0.12);
}

.confirmation-card {
  width: min(380px, calc(100vw - 32px));
  background: #1e2720;
  border: 1px solid #465b49;
  border-radius: 0;
}

.app-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-title {
  min-width: 0;
}

.settings-button {
  align-self: center;
}

.status-button {
  min-height: 34px;
  border-radius: 6px;
}

.status-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.status-online {
  background: #21ba45;
}

.status-dnd {
  background: #c10015;
}

.status-offline {
  background: #9e9e9e;
}

.status-option-active {
  background: rgba(163, 217, 119, 0.12);
}

.status-menu {
  min-width: 220px;
  background: #1e2720;
  border: 1px solid #465b49;
  border-radius: 0;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
}

.status-menu-heading {
  color: #aab7a5;
}

.status-option {
  border-radius: 0;
  color: #e6ebdf;
}

.status-option:hover {
  background: #2c392f;
}

.status-option-online[aria-selected='true'] {
  color: #83c990;
}

.status-option-dnd[aria-selected='true'] {
  color: #d1a45d;
}

.status-option-offline[aria-selected='true'] {
  color: #aab7a5;
}
</style>

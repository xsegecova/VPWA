<template>
  <q-layout view="hhh lpR lff">
    <q-header bordered class="bg-secondary text-main">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="row items-center">
          <q-avatar>
            <img alt="Serpent logo" src="/serpent.png" />
          </q-avatar>
          <span class="q-ml-sm">Serpent</span>
          <q-space />
          <span>Status {{ status }}</span>
          <q-avatar class="q-ml-sm">
            <img alt="Serpent logo" src="/serpent.png" />
          </q-avatar>
          <q-btn flat label="Quit" class="q-ml-md" @click="quit" />
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" class="chat-sidebar" show-if-above side="left" bordered>
      <!-- drawer content -->
      <div class="row justify-between">
        <div class="q-ml-md q-my-sm text-h5 text-main">Chats</div>
        <q-btn @click="showCreateChannel = true" class="right">+ </q-btn>
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
          <q-item-section>
            <q-item-label>{{ invite.channel }}</q-item-label>
            <q-item-label caption> Invited by {{ invite.sender }} </q-item-label>
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
                @click="acceptChannelInvite(invite)"
              />
              <q-btn
                flat
                round
                dense
                icon="close"
                color="negative"
                aria-label="Reject invitation"
                @click="rejectChannelInvite(invite)"
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
          :class="{ 'bg-primary text-dark': unreadChannels.has(channel.name) }"
          @click="openChannel(channel.name)"
        >
          <q-item-section>
            {{ channel.name }}
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-sm">
              <q-badge v-if="unreadChannels.has(channel.name)" label="new" color="positive" />
              <q-badge v-if="channel.isPrivate" label="private" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-dialog v-model="showCreateChannel">
      <q-card dark style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Vytvoriť kanál</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="newChannelName" label="Názov kanála" dark />

          <q-select
            v-model="newChannelStatus"
            :options="['public', 'private']"
            label="Viditeľnosť"
            dark
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Zavrieť" v-close-popup />

          <q-btn label="Vytvoriť" @click="confirmCreateChannel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer bordered class="terminal text-main">
      <q-toolbar>
        <q-toolbar-title>
          <q-input
            class="text-input-main"
            v-model="text"
            placeholder="Type here"
            @keydown.up.prevent="movement(-1)"
            @keydown.down.prevent="movement(1)"
            @keydown.enter.prevent="handleEnter"
          >
            <q-menu
              :model-value="filteredCommands.length > 0"
              anchor="top left"
              self="bottom left"
              no-parent-event
              no-focus
              fit
              dark
            >
              <q-list>
                <q-item
                  v-for="(command, index) in filteredCommands"
                  :key="command.name"
                  :active="index == commandIndex"
                  clickable
                  active-class="bg-primary text-dark"
                  @mouseenter="commandIndex = index"
                  @mousedown.prevent
                  @click="selectCommand(command.name)"
                >
                  <q-item-section>
                    {{ command.syntax }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-input>
        </q-toolbar-title>
        <q-btn @click="submitTerminal">Send</q-btn>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useChat } from '@/composables/useChat'
import { createChannel, getChannelsForUser } from '@/composables/tempBackend'

const {
  channels,
  invites,
  refreshChannels,
  activeChannelName,
  openChannel,
  sendMessage,
  text,
  commandIndex,
  filteredCommands,
  acceptInvite: acceptChannelInvite,
  rejectInvite: rejectChannelInvite,
  sortedChannels,
  unreadChannels,
  logout: logoutFromChat,
} = useChat()
const showCreateChannel = ref(false)
const newChannelName = ref('')
const newChannelStatus = ref<'public' | 'private'>('public')

const leftDrawerOpen = ref(false)
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const status = ref('Online')

onMounted(() => {
  refreshChannels()
})

function quit() {
  logoutFromChat()
}

function submitTerminal() {
  if (text.value.trim() === '/quit') {
    logoutFromChat()
    return
  }

  sendMessage()
}

watch(filteredCommands, () => {
  commandIndex.value = 0
}) //resetuje poziciu indexu na 0 ked sa pickneme nejaky command

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
    logoutFromChat()
    return
  }

  const command = filteredCommands.value[commandIndex.value]

  if (command) {
    selectCommand(command.name)
    return //ak je command tak ho napis
  }

  sendMessage() //inak piseme spravy
}

function selectCommand(commandName: string) {
  text.value = commandName
  if (commandName === '/quit') {
    logoutFromChat()
    return
  }
  text.value += ' '
}

function confirmCreateChannel() {
  const owner = sessionStorage.getItem('serpent-current-user')
  const name = newChannelName.value.trim()

  if (!owner || !name) return

  try {
    createChannel(owner, name, newChannelStatus.value === 'private')
    channels.value = getChannelsForUser(owner)
    activeChannelName.value = name
    showCreateChannel.value = false
    newChannelName.value = ''
    newChannelStatus.value = 'public'
  } catch (error) {
    console.error('Could not create channel', error)
  }
}
</script>

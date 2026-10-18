<template>
  <q-toolbar>
    <q-toolbar-title>
      <q-input
        class="text-input-main"
        :model-value="text"
        placeholder="Type here"
        :error="commandError.length > 0"
        :error-message="commandError"
        @update:model-value="$emit('update:text', String($event))"
        @keydown.up.prevent="$emit('move', -1)"
        @keydown.down.prevent="$emit('move', 1)"
        @keydown.enter.prevent="$emit('enter')"
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
              :active="index === commandIndex"
              clickable
              active-class="bg-primary text-dark"
              @mouseenter="$emit('set-index', index)"
              @mousedown.prevent
              @click="$emit('select', command.name)"
            >
              <q-item-section>{{ command.syntax }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-input>
      <div
        v-if="commandMessage"
        class="terminal-message"
        :class="`terminal-message--${commandMessageType}`"
      >
        {{ commandMessage }}
      </div>
    </q-toolbar-title>
    <q-btn @click="$emit('send')">Send</q-btn>
  </q-toolbar>
</template>

<script setup lang="ts">
type Command = {
  name: string
  syntax: string
}

defineProps<{
  text: string
  commandError: string
  commandMessage: string
  commandMessageType: 'success' | 'error'
  commandIndex: number
  filteredCommands: Command[]
}>()

defineEmits<{
  'update:text': [value: string]
  move: [direction: number]
  enter: []
  'set-index': [index: number]
  select: [command: string]
  send: []
}>()
</script>

<style scoped>
.terminal-message {
  margin-top: 4px;
  font-size: 0.85rem;
}

.terminal-message--success {
  color: #a3d977;
}

.terminal-message--error {
  color: #e08076;
}
</style>

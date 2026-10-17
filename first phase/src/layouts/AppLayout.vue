
<template>
  <q-layout view="hhh lpR lff">
    <q-header bordered class="bg-secondary text-main">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="row items-center">
          <q-avatar>
            <img alt="Serpent logo" src="/serpent.png">
          </q-avatar>
          <span class="q-ml-sm">Serpent</span>
          <q-space />
           <span>Status {{ status }}</span>
          <q-avatar class="q-ml-sm">
            <img alt="Serpent logo" src="/serpent.png">
          </q-avatar>

        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      class="chat-sidebar"
      show-if-above
      side="left"
      bordered
    >
      <!-- drawer content -->
      <div class="row justify-between">
      <div class="q-ml-md q-my-sm text-h5 text-main">Chats</div>
      <q-btn class="right" >+</q-btn>
      </div>

      <q-separator size="3px" />
    </q-drawer>

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
                v-for="(command,index) in filteredCommands"
                :key="command.name"
                :active="index ==commandIndex"
                clickable
                active-class="bg-primary text-dark"
                @mouseenter="commandIndex = index"
                @mousedown.prevent
                @click="text = command.name + ' '"
                >
                <q-item-section>
                  {{ command.syntax }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          </q-input>
        </q-toolbar-title>
        <q-btn @click="sendMessage">Send</q-btn>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref,watch } from 'vue'
import { useChat} from '@/composables/useChat'

const leftDrawerOpen = ref(false)
function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const status = ref("Online")
const { text, sendMessage,commandIndex,filteredCommands } = useChat()

watch(filteredCommands, () => {
  commandIndex.value = 0
})  //resetuje poziciu indexu na 0 ked sa pickneme nejaky command


function movement(directiom){
  const nextPosition = commandIndex.value + directiom
  if (
    nextPosition >= 0 && nextPosition < filteredCommands.value.length //indexovanie pozicii commandov v 'command okne' aby sme mohli mat movement up down
  )
  {
    commandIndex.value = nextPosition} //nastavenie indexu

}

function handleEnter() {
  const command = filteredCommands.value[commandIndex.value]

  if (command) {
    text.value = command.name + ' '
    return //ak je command tak ho napis
  }

  sendMessage() //inak piseme spravy
}

</script>

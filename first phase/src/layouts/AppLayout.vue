
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
          <q-input class="text-input-main" v-model="text"/>
        </q-toolbar-title>
        <q-btn>Send</q-btn>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const leftDrawerOpen = ref(false)
function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const status = ref("Online")
const text = ref("Type here...")

</script>

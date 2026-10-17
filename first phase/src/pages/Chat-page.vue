<template>
  <q-page class="q-pa-md">

    <div
    v-for = "(message,index ) in messages"
    :key = "index"
    class="message-wrapper"
    >
      <div class= "message-name"> {{ message.name }}</div>
      <div class= "user-message"> {{ message.text }}</div>
    </div>
  </q-page>
</template>

<script setup>
import {useChat} from '@/composables/useChat'

const { messages } = useChat()

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

.message-name {
  text-align: right;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: bold;
}
</style>

<template>
  <q-card class="q-mt-lg self-center login-card">
    <q-card-section>
      <div class="text-h2 text-main">{{ title }}</div>

    </q-card-section>

    <q-separator />

    <q-form @submit="onSubmit" @reset="onReset"  v-if="state != 'start'" class="text-main q-mx-md q-mt-md">
      <q-input
        v-if="state === 'register'"
        filled
        v-model="name"
        label="Name *"
        lazy-rules
        :rules="[val => (val && val.length > 0) || 'Please type something']"
      />
      <q-input
        v-if="state === 'register'"
        filled
        v-model="surname"
        label="Surname *"
        lazy-rules
        :rules="[val => (val && val.length > 0) || 'Please type something']"
      />
       <q-input
        v-if="state ===  'register'"
        filled
        v-model="nickname"
        label="Nickname *"
        lazy-rules
        :rules="[val => (val && val.length > 0) || 'Please type something']"
      />
      <q-input
        filled
        v-model="email"
        label="Email *"
        lazy-rules
        :rules="[val => (val && val.length > 0) || 'Please type something']"
      />
      <q-input
        filled
        v-model="password"
        label="Password *"
        lazy-rules
        :rules="[val => (val && val.length > 0) || 'Please type something']"
      />

      <q-btn flat class="text-main" @click="state = 'start'">Back</q-btn>
      <q-btn flat class="text-main right" @click="submit()">Submit</q-btn>

    </q-form>

    <q-card-actions vertical>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'login'">Login</q-btn>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'register'">Register</q-btn>

    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref,computed } from 'vue'

  const state = ref("start")

  const name = ref("")
  const surname = ref("")
  const nickname = ref("")
  const email = ref("")
  const password = ref("")

  const title = computed(() =>{
    if (state.value === 'start') return 'Serpent'
    if (state.value === 'login') return 'Login'
    return 'Register'}
  )

  function submit()
  {
    // login code
  }
</script>


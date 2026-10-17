<template>
  <q-card class="q-mt-lg self-center login-card">
    <q-card-section>
      <div class="text-h2 text-main">{{ title }}</div>

    </q-card-section>

    <q-separator />

    <q-form @submit="submit" @reset="reset"  v-if="state != 'start'" class="text-input-main q-mx-lg q-mt-md">
      <q-input
        v-if="state === 'register'"
        filled
        v-model="name"
        label="Name *"
        lazy-rules
        :rules="[val => (val && val.length > 0) || 'Please enter your name']"
      />
      <q-input
        v-if="state === 'register'"
        filled
        v-model="surname"
        label="Surname *"
        lazy-rules
        :rules="[val => (val && val.length > 0) || 'Please enter your surname']"
      />
       <q-input
        v-if="state ===  'register'"
        filled
        v-model="nickname"
        label="Nickname *"
        lazy-rules
        :rules="[val => (val && val.length > 5) || 'Nickname must be at least 5 characters']"
      />
      <q-input
        filled
        type="email"
        v-model="email"
        label="Email *"
        lazy-rules="ondemand"
        :rules="[val => (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) || 'Enter a valid email address']"
      />
      <q-input
        filled
        type="password"
        v-if="state ===  'login'"
        v-model="password"
        label="Password *"
        lazy-rules
      />
      <q-input
        filled
        type="password"
        v-if="state ===  'register'"
        v-model="password"
        label="Password *"
        lazy-rules
        :rules="[
          val => (val && val.length >= 8) || 'Minimum 8 characters',
            val => /[A-Z]/.test(val) || 'At least 1 uppercase letter',
            val => /[a-z]/.test(val) || 'At least 1 lowercase letter',
            val => /[0-9]/.test(val) || 'At least 1 number'
        ]"
      />
      <q-input
        filled
        v-if="state ===  'register'"
        type="password"
        v-model="password2"
        label="Repeat password *"
        lazy-rules="ondemand"
        :rules="[val => (val && val === password) || 'Passwords do not match']"
      />


      <q-btn flat class="text-muted q-mt-md" type="reset">Back</q-btn>
      <q-btn flat class="text-main q-mt-md float-right" type="submit">Submit</q-btn>

    </q-form>

    <q-card-actions vertical>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'login'">Login</q-btn>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'register'">Register</q-btn>

    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref,computed} from 'vue'
import { useRouter } from 'vue-router'

  const state = ref("start")

  const name = ref("")
  const surname = ref("")
  const nickname = ref("")
  const email = ref("")
  const password = ref("")
  const password2 = ref("")

  const router = useRouter()

  const title = computed(() =>{
    if (state.value === 'start') return 'Serpent'
    if (state.value === 'login') return 'Login'
    return 'Register'}
  )

  function submit()
  {
    if (state.value === 'register') {
    localStorage.setItem('serpent-nickname', nickname.value)

    console.log('Registration successful')

    reset()
    state.value = 'login'
  }

  else if (state.value === 'login') {
    console.log('Login successful')
    router.push('/dashboard')
  }
  }

  function reset()
  {
    name.value=""
    surname.value=""
    nickname.value=""
    email.value=""
    password.value=""
    password2.value=""

    state.value = 'start'
  }
</script>


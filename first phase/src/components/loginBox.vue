<template>
  <q-card class="q-mt-lg self-center login-card">
    <q-card-section>
      <div class="text-h2 text-main">{{ title }}</div>
    </q-card-section>

    <q-separator />

    <q-form
      @submit="submit"
      @reset="reset"
      v-if="state != 'start'"
      class="text-input-main q-mx-lg q-mt-md"
    >
      <q-input
        v-if="state === 'register'"
        filled
        v-model="name"
        label="Name *"
        lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please enter your name']"
      />
      <q-input
        v-if="state === 'register'"
        filled
        v-model="surname"
        label="Surname *"
        lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please enter your surname']"
      />
      <q-input
        v-if="state === 'register'"
        filled
        v-model="nickname"
        label="Nickname *"
        lazy-rules
        :rules="[(val) => (val && val.length >= 5) || 'Nickname must be at least 5 characters']"
      />
      <q-input
        filled
        v-model="email"
        label="Email *"
        lazy-rules="ondemand"
        :rules="[
          (val) => (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) || 'Enter a valid email address',
        ]"
      />
      <q-input
        filled
        type="password"
        v-if="state === 'login'"
        v-model="password"
        label="Password *"
        lazy-rules
      />
      <q-input
        filled
        type="password"
        v-if="state === 'register'"
        v-model="password"
        label="Password *"
        lazy-rules
        :rules="[
          (val) => (val && val.length >= 8) || 'Minimum 8 characters',
          (val) => /[A-Z]/.test(val) || 'At least 1 uppercase letter',
          (val) => /[a-z]/.test(val) || 'At least 1 lowercase letter',
          (val) => /[0-9]/.test(val) || 'At least 1 number',
        ]"
      />
      <q-input
        filled
        v-if="state === 'register'"
        type="password"
        v-model="password2"
        label="Repeat password *"
        lazy-rules="ondemand"
        :rules="[(val) => (val && val === password) || 'Passwords do not match']"
      />
      <q-card-actions vertical>
        <span class="text-main">{{ error }}</span>
        <div>
          <q-btn flat class="text-muted q-mt-md" type="reset" @click="error = ''">Back</q-btn>
          <q-btn flat class="text-main q-mt-md float-right" type="submit">Submit</q-btn>
        </div>
      </q-card-actions>
    </q-form>

    <q-card-actions vertical>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'login'">Login</q-btn>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'register'"
        >Register</q-btn
      >
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { checkUser, createUser } from '../composables/tempBackend'

// database entries
const name = ref('')
const surname = ref('')
const nickname = ref('')
const email = ref('')
const password = ref('')
const password2 = ref('')

// components
const error = ref('')
const state = ref('start')
const router = useRouter()
const title = computed(() => {
  if (state.value === 'start') return 'Serpent'
  if (state.value === 'login') return 'Login'
  return 'Register'
})

// register or login  - needs to be reworked in 2. version
function submit() {
  if (state.value === 'register') {
    const result = createUser({
      nickname: nickname.value.trim(),
      name: name.value.trim(),
      surname: surname.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
    })

    if (result === 1) {
      error.value = 'This email is already taken'
      console.log('This email is already taken')
      return
    }

    if (result === 2) {
      error.value = 'This nickname is already taken'
      console.log('This nickname is already taken')
      return
    }

    console.log('Registration successful')
    reset()
    state.value = 'login'
  } else if (state.value === 'login') {
    const user = checkUser(email.value.trim().toLowerCase(), password.value)

    if (user) {
      // Remember which user is logged in for this tab
      sessionStorage.setItem('serpent-current-user', user.nickname)
      console.log('Login successful')
      router.push('/dashboard')
    } else {
      console.log('Login unsuccessful: invalid email or password')
      error.value = 'Invalid email or password'
    }
  }
}

// reset UI
function reset() {
  name.value = ''
  surname.value = ''
  nickname.value = ''
  email.value = ''
  password.value = ''
  password2.value = ''

  state.value = 'start'
}
</script>

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
        :rules="[val => (val && val.length >= 5) || 'Nickname must be at least 5 characters']"
      />
      <q-input
        filled
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
      <q-card-actions vertical>
      <q-span class="text-main">{{error}}</q-span>
        <div>
          <q-btn flat class="text-muted q-mt-md" type="reset" @click="error=''" >Back</q-btn>
          <q-btn flat class="text-main q-mt-md float-right" type="submit">Submit</q-btn>
        </div>
    </q-card-actions>
    </q-form>

    <q-card-actions vertical>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'login'">Login</q-btn>
      <q-btn flat class="text-main" v-if="state === 'start'" @click="state = 'register'">Register</q-btn>

    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref,computed} from 'vue'
import { useRouter } from 'vue-router'

  // database entries
  const name = ref("")
  const surname = ref("")
  const nickname = ref("")
  const email = ref("")
  const password = ref("")
  const password2 = ref("")

  // components
  const error = ref("")
  const state = ref("start")
  const router = useRouter()
  const title = computed(() =>{
    if (state.value === 'start') return 'Serpent'
    if (state.value === 'login') return 'Login'
    return 'Register'}
  )

  // register or login  - needs to be reworked in 2. version
  function submit() {
  if (state.value === 'register') {
    const users = JSON.parse(
      localStorage.getItem('serpent-users') || '[]'
    )

    const nicknameExists = users.some(
      (user: { nickname: string }) =>
        user.nickname.toLowerCase() === nickname.value.trim().toLowerCase()
    )

    const emailExists = users.some(
      (user: { email: string }) =>
        user.email.toLowerCase() === email.value.trim().toLowerCase()
    )

    if (nicknameExists) {
      // need to conect this with ui
      error.value = "This nickname is already taken"
      console.log('This nickname is already taken')
      return
    }

    if (emailExists) {
      // need to conect this with ui
      error.value = "This email is already taken"
      console.log('This email is already taken')
      return
    }

    const newUser = {
      nickname: nickname.value.trim(),
      name: name.value.trim(),
      surname: surname.value.trim(),
      email: email.value.trim(),
      password: password.value,
      status: 0 // will automatically set to 0 after 1 minute on server
    }

    users.push(newUser)

    console.log('Registration successful')
    reset()
    state.value = 'login'
  }
  else if (state.value === 'login') {
    const users = JSON.parse(
      localStorage.getItem('serpent-users') || '[]'
    )

    const user = users.find(
      (user: { email: string; password: string }) =>
        user.email === email.value.trim().toLowerCase() &&
        user.password === password.value
    )

    if (user) {
      // Remember which user is logged in for this tab
      sessionStorage.setItem('serpent-current-user', user.nickname)
      console.log('Login successful')
      router.push('/dashboard')
    }
    else {
      console.log('Login unsuccessful: invalid email or password')
      error.value = "Invalid email or password"
    }
  }
}

  // reset UI
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


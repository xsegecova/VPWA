<template>

  <div class="column flex-center">

    <q-img
      height="400px"
      class="q-mt-lg col-2 logo"
      src="/serpent.png"
    />

    <template v-if="base == 0">
          <q-card dark class="q-mt-lg self-center login-card">
          <q-card-section>
            <div class="text-h2 text-muted">Serpent</div>
          </q-card-section>

          <q-separator />

          <q-card-actions vertical>
            <q-btn flat class="text-muted" @click="base = 1">Login</q-btn>
            <q-btn flat class="text-muted" @click="base = 2">Register</q-btn>
          </q-card-actions>

        </q-card>

    </template>

    <template v-if="base == 1">

      <q-card dark class="q-mt-lg self-center login-card">
      <q-card-section>
        <div class="text-h2 text-muted">Serpent</div>
      </q-card-section>

      <q-separator />
        <q-form @submit="onSubmit" @reset="onReset" class="">
        <q-input
          filled
          v-model="email"
          label="Your email *"
          lazy-rules
          :rules="[val => (val && val.length > 0 ) || 'Please type something']"
        />
        <q-input
          filled
          v-model="heslo"
          label="Your password *"
          lazy-rules
          :rules="[val => (val && val.length > 0 ) || 'Please type something']"
        />
      </q-form>
      <q-card-actions vertical>
        <q-btn flat class="text-muted" to="/b">Submit</q-btn>
        <q-btn flat class="text-muted" @click="base =0">Back</q-btn>
      </q-card-actions>

    </q-card>
    </template>


    <template v-if="base == 2">
      <q-card dark class="q-mt-lg self-center login-card">
      <q-card-section>
        <div class="text-h2 text-muted">Serpent</div>
      </q-card-section>

      <q-separator />
        <q-form @submit="onSubmit" @reset="onReset" class="">
        <q-input
          filled
          v-model="meno"
          label="Your Meno *"
          lazy-rules
          :rules="[val => (val && val.length > 0 ) || 'Please type something']"
        />
        <q-input
          filled
          v-model="priezvisko"
          label="Your Priezvisko *"
          lazy-rules
          :rules="[val => (val && val.length > 0 ) || 'Please type something']"
        />
         <q-input
          filled
          v-model="email"
          label="Your email *"
          lazy-rules
          :rules="[val => (val && val.length > 0 ) || 'Please type something']"
        />
         <q-input
          filled
          v-model="heslo"
          label="Your password *"
          lazy-rules
          :rules="[val => (val && val.length > 0 ) || 'Please type something']"
        />
      </q-form>
      <q-card-actions vertical>
        <q-btn flat class="text-muted" to="/b">Submit</q-btn>
        <q-btn flat class="text-muted" @click="base =0">Back</q-btn>
      </q-card-actions>

    </q-card>
    </template>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const base = ref(0)

const meno = ref("")
const priezvisko = ref("")
//const prezyvka = ref("")
const email = ref("")
const heslo = ref("")


</script>

<style scoped lang="scss">
.login-card{
  background: $bg-card;
  border-style:solid ;
  border-color: $brd-main;
  border-radius:0px;
}
</style>

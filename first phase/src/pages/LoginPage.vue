<template>
  <q-page class="back-ground">
    <div class="column flex-center">
      <q-img class="q-my-md logo" loading-show-delay="1s" fit="contain" src="/serpent.png" />

      <login-box />
    </div>
  </q-page>
</template>

<script setup>
import LoginBox from '@/components/loginBox.vue'
</script>

<style scoped lang="scss">
.back-ground {
  background: linear-gradient(to bottom, $bg-gradient-1, $bg-gradient-3);
  background-size: 120% 115%;
}

.logo {
  width: min(100vw, 500px);
  height: clamp(100px, 30dvh, 300px);
  aspect-ratio: 1 / 1;
  filter: drop-shadow(0 0 8px #a3d977);
  animation: logo-in 0.5s ease-out forwards;
}

@keyframes logo-in {
  from {
    transform: rotate(-30deg) scale(0.8);
    opacity: 0%;
  }
  to {
    transform: rotate(0deg) scale(1);
    opacity: 100%;
  }
}
</style>

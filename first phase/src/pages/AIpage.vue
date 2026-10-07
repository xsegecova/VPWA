 <template>



        <q-card dark class="row q-mt-lg login-card">
        <q-separator />
        <q-form class="self">
        <q-input
          class=""
          filled
          v-model="a"
          label="Sprava"
          lazy-rules
          width="500px"
          :rules="[val => (val && val.length > 0 ) || 'Please type something']"
        />
      </q-form>
      <q-btn flat class="text-muted" to="/b">Send</q-btn>
    </q-card>


</template>

<script setup>
import { ref } from 'vue'

const a = ref(0)


</script>


import {ref} from 'vue'

const text = ref('')
const messages = ref([])



function sendMessage() {
        const message = text.value
        if (message == '') return
        messages.value.push({name:localStorage.getItem('serpent-nickname') ,text:message}) // uloze spravu
        text.value = '' //vypradzni vstupne pole

}

export function useChat() {
  return {text, messages, sendMessage}
}

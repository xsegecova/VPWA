import {ref,computed} from 'vue'

const text = ref('')
const messages = ref<{ name: string | null; text: string }[]>([])
const commandIndex = ref(0)


type Commands = {
  name: string
  syntax: string
}

const command: Commands[] = [
  { name: '/join', syntax: '/join {channelName} [private]' }, //private je volitelny paramter :D
  { name: '/invite', syntax: '/invite {nickName}' },
  { name: '/revoke', syntax: '/revoke {nickName}' },
  { name: '/kick', syntax: '/kick {nickName}' },
  { name: '/quit', syntax: '/quit' }
]

function sendMessage() {
        const message = text.value

        if (message == '') return
        messages.value.push({name:localStorage.getItem('serpent-nickname') ,text:message}) // uloze spravu
        text.value = '' //vypradzni vstupne pole

}

const filteredCommands = computed(() => {
  if (!text.value.startsWith('/')) return []

  return command.filter(command =>
    command.name.startsWith(text.value)
  )
})


export function useChat() {
  return {text, messages,commandIndex, sendMessage,filteredCommands}
}

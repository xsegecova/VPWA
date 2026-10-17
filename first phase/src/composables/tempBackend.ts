export type User = {
  name: string
  surname: string
  password: string
  nickname: string
  email: string
  status: number
  notification: boolean
}

export type Message = {
  kedy: string
  fromUser: string
  text: string
}

export type Channel = {
  owner: string
  name: string
  isPrivate: boolean
  people: string[]
  messages: Message[]
}

export type Invite = {
  sender: string
  sendTime: string
  receiver: string
  channel: string
}

export type UserKickedFromChannel = {
  user: string
  channel: string
  kickedBy: string
  kickedTime: string
}

const usersKey = 'serpent-db-users'
const channelsKey = 'serpent-db-channels'
const invitesKey = 'serpent-db-invites'
const kickedUsersKey = 'serpent-db-kicked-users'

function load<T>(key: string): T[] {
  const saved = localStorage.getItem(key)
  if (!saved) return []

  try {
    const data: unknown = JSON.parse(saved)
    return Array.isArray(data) ? (data as T[]) : []
  } catch (error) {
    console.error(`Could not read temporary backend data from ${key}`, error)
    return []
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function createUser(
  user: Omit<User, 'status' | 'notification'>
): 0 | 1 | 2 {
  const users = load<User>(usersKey)

  if (users.some(existing => existing.email === user.email)) {
    return 1
  }

  if (users.some(existing => existing.nickname === user.nickname)) {
    return 2
  }

  const newUser: User = {
    ...user,
    status: 1,
    notification: true
  }

  users.push(newUser)
  save(usersKey, users)
  return 0
}

export function checkUser(email: string, password: string): User | null {
  const user = load<User>(usersKey).find(
    current => current.email === email && current.password === password
  )

  return user ?? null
}

export function changeUserStatus(
  nickname: string,
  status: number
): User {
  const users = load<User>(usersKey)
  const user = users.find(current => current.nickname === nickname)

  if (!user) {
    throw new Error(`User "${nickname}" does not exist`)
  }

  user.status = status
  save(usersKey, users)
  return user
}

export function createChannel(
  owner: string,
  name: string,
  isPrivate: boolean
): Channel {
  const channels = load<Channel>(channelsKey)

  if (channels.some(channel => channel.name === name)) {
    throw new Error(`Channel "${name}" already exists`)
  }

  const channel: Channel = {
    owner,
    name,
    isPrivate,
    people: [owner],
    messages: []
  }

  channels.push(channel)
  save(channelsKey, channels)
  return channel
}

export function getChannels(): Channel[] {
  const saved = localStorage.getItem(channelsKey)
  const legacySaved = localStorage.getItem('serpent-channels')
  if (!saved && !legacySaved) return []

  try {
    const data: unknown = JSON.parse(saved ?? legacySaved ?? '[]')
    if (!Array.isArray(data)) return []

    const channels = data.map((item: unknown): Channel => {
      const channel = item as Partial<Channel> & {
        admin?: string
        status?: 'public' | 'private'
        members?: string[]
      }

      return {
        owner: channel.owner ?? channel.admin ?? '',
        name: channel.name ?? '',
        isPrivate: channel.isPrivate ?? channel.status === 'private',
        people: channel.people ?? channel.members ?? [],
        messages: channel.messages ?? []
      }
    })

    save(channelsKey, channels)
    return channels
  } catch (error) {
    console.error('Could not read channels from temporary backend', error)
    return []
  }
}

export function getChannelsForUser(nickname: string): Channel[] {
  return getChannels().filter(
    channel => channel.owner === nickname || channel.people.includes(nickname)
  )
}

export function sendMessage(
  channelName: string,
  fromUser: string,
  text: string
): Message {
  const channels = load<Channel>(channelsKey)
  const channel = channels.find(current => current.name === channelName)

  if (!channel) {
    throw new Error(`Channel "${channelName}" does not exist`)
  }

  if (!channel.people.includes(fromUser)) {
    throw new Error('User is not a member of this channel')
  }

  const message: Message = {
    kedy: new Date().toISOString(),
    fromUser,
    text
  }

  channel.messages.push(message)
  save(channelsKey, channels)
  return message
}

export function destroyChannel(channelName: string): void {
  const channels = load<Channel>(channelsKey)
  const remainingChannels = channels.filter(
    channel => channel.name !== channelName
  )

  if (remainingChannels.length === channels.length) {
    throw new Error(`Channel "${channelName}" does not exist`)
  }

  save(channelsKey, remainingChannels)
}

export function getMessages(channelName: string, nickname: string): Message[] {
  const channel = load<Channel>(channelsKey).find(
    current => current.name === channelName
  )

  if (!channel) {
    throw new Error(`Channel "${channelName}" does not exist`)
  }

  if (!channel.people.includes(nickname)) {
    throw new Error('User is not a member of this channel')
  }

  return channel.messages
}

export function createInvite(
  sender: string,
  receiver: string,
  channel: string
): Invite {
  const currentChannel = getChannels().find(item => item.name === channel)
  if (!currentChannel) {
    throw new Error(`Channel "${channel}" does not exist`)
  }

  const senderIsMember = currentChannel.people.includes(sender)
  const senderCanInvite =
    senderIsMember && (!currentChannel.isPrivate || currentChannel.owner === sender)

  if (!senderCanInvite) {
    throw new Error('User is not allowed to invite people to this channel')
  }

  const invites = load<Invite>(invitesKey)
  const invite: Invite = {
    sender,
    receiver,
    channel,
    sendTime: new Date().toISOString()
  }

  invites.push(invite)
  save(invitesKey, invites)
  return invite
}

export function getInvites(): Invite[] {
  return load<Invite>(invitesKey)
}

export function kickUserFromChannel(
  user: string,
  channel: string,
  kickedBy: string
): UserKickedFromChannel {
  const kickedUsers = load<UserKickedFromChannel>(kickedUsersKey)
  const kick: UserKickedFromChannel = {
    user,
    channel,
    kickedBy,
    kickedTime: new Date().toISOString()
  }

  kickedUsers.push(kick)
  save(kickedUsersKey, kickedUsers)

  const channels = load<Channel>(channelsKey)
  const currentChannel = channels.find(item => item.name === channel)
  if (currentChannel) {
    currentChannel.people = currentChannel.people.filter(
      nickname => nickname !== user
    )
    save(channelsKey, channels)
  }

  return kick
}

export function getKickedUsers(): UserKickedFromChannel[] {
  return load<UserKickedFromChannel>(kickedUsersKey)
}

export function cancelChannel(
  channelName: string,
  nickname: string
): void {
  const channels = getChannels()
  const channel = channels.find(item => item.name === channelName)

  if (!channel) {
    throw new Error('Kanál neexistuje')
  }

  if (channel.owner === nickname) {
    destroyChannel(channelName)
    return
  }

  if (!channel.people.includes(nickname)) {
    throw new Error('Používateľ nie je členom kanála')
  }

  channel.people = channel.people.filter(person => person !== nickname)
  save(channelsKey, channels)
}

export type UserStatus = 0 | 1 | 2

export const userStatuses = {
  offline: 0,
  online: 1,
  dnd: 2,
} as const

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

export type User = {
  name: string
  surname: string
  password: string
  nickname: string
  email: string
  status: UserStatus
  notificationsDirectOnly: boolean
}

export type Message = {
  kedy: string
  fromUser: string
  text: string
  status: MessageStatus
  readBy: string[]
}

export type Channel = {
  owner: string
  name: string
  isPrivate: boolean
  people: string[]
  messages: Message[]
  currentMessages: Message[]
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
export const backendChangeEvent = 'serpent-backend-change'

// load table from JSON
function load<T>(key: string): T[] {
  const saved = localStorage.getItem(key)
  if (!saved) return []

  try {
    const data: unknown = JSON.parse(saved)
    return Array.isArray(data) ? (data as T[]) : []
  } catch (error) {
    console.error(`Could not read data from ${key}`, error)
    return []
  }
}

//save table to JSON
function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
  // (new data to show) callback simulation
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(backendChangeEvent, { detail: { key } }))
  }
}

export function getCurNickname(): string | null {
  return sessionStorage.getItem('serpent-current-user')
}

function requireSessionUser(): string {
  const nickname = getCurNickname()
  if (!nickname) throw new Error('No user is logged in')
  return nickname
}

export function createUser(user: Omit<User, 'status' | 'notificationsDirectOnly'>): 0 | 1 | 2 {
  const users = load<User>(usersKey)
  if (users.some((existing) => existing.email === user.email)) return 1
  if (users.some((existing) => existing.nickname === user.nickname)) return 2

  users.push({
    ...user,
    status: userStatuses.online,
    notificationsDirectOnly: false,
  })
  save(usersKey, users)
  return 0
}

export function checkUser(email: string, password: string): User | null {
  return (
    load<User>(usersKey).find(
      (current) => current.email === email && current.password === password,
    ) ?? null
  )
}

export function getUser(nickname: string): User | null {
  return load<User>(usersKey).find((user) => user.nickname === nickname) ?? null
}

export function changeNotificationPreference(directOnly: boolean): User {
  const nickname = requireSessionUser()
  const users = load<User>(usersKey)
  const user = users.find((current) => current.nickname === nickname)
  if (!user) throw new Error(`User "${nickname}" does not exist`)

  user.notificationsDirectOnly = directOnly
  save(usersKey, users)
  return user
}

export function logout(): void {
  sessionStorage.removeItem('serpent-current-user')
}

export function changeUserStatus(status: UserStatus): User {
  const nickname = requireSessionUser()
  if (!Object.values(userStatuses).includes(status)) {
    throw new Error(`Invalid status "${status}"`)
  }

  const users = load<User>(usersKey)
  const user = users.find((current) => current.nickname === nickname)
  if (!user) throw new Error(`User "${nickname}" does not exist`)

  user.status = status
  save(usersKey, users)
  return user
}

// ! create entry in table channel - will have to add constraint for unique name
export function createChannel(name: string, isPrivate: boolean): Channel {
  const owner = requireSessionUser()
  const channels = load<Channel>(channelsKey)
  if (channels.some((channel) => channel.name === name)) {
    throw new Error(`Channel "${name}" already exists`)
  }

  const channel: Channel = {
    owner,
    name,
    isPrivate,
    people: [owner],
    messages: [],
    currentMessages: [],
  }
  channels.push(channel)
  save(channelsKey, channels)
  return channel
}

export function getChannels(): Channel[] {
  const saved = localStorage.getItem(channelsKey)
  if (!saved) return []

  try {
    const data: unknown = JSON.parse(saved)
    if (!Array.isArray(data)) return []
    return (data as Channel[]).map((channel) => ({
      ...channel,
      currentMessages: channel.currentMessages ?? [],
      messages: channel.messages.map((message) => ({
        ...message,
        status: message.status ?? 'sent',
        readBy: message.readBy ?? [],
      })),
    }))
  } catch (error) {
    console.error('Could not read channels from temporary backend', error)
    return []
  }
}

// get channells that the current user is part of
export function getChannelsForUser(): Channel[] {
  const nickname = getCurNickname()
  if (!nickname) return []
  return getChannels().filter(
    (channel) => channel.owner === nickname || channel.people.includes(nickname),
  )
}

function isBanned(channel: Channel, nickname: string): boolean {
  const kicks = getKickedUsers().filter(
    (item) => item.channel === channel.name && item.user === nickname,
  )
  return (
    kicks.some((item) => item.kickedBy === channel.owner) ||
    new Set(kicks.map((item) => item.kickedBy)).size >= 3
  )
}

export function sendMessage(channelName: string, text: string): Message {
  const fromUser = requireSessionUser()
  const channels = load<Channel>(channelsKey)
  const channel = channels.find((current) => current.name === channelName)
  if (!channel) throw new Error(`Channel "${channelName}" does not exist`)
  if (!channel.people.includes(fromUser)) {
    throw new Error('User is not a member of this channel')
  }

  const message: Message = {
    kedy: new Date().toISOString(),
    fromUser,
    text,
    status: 'sending',
    readBy: [fromUser],
  }
  channel.messages.push(message)
  save(channelsKey, channels)
  message.status = channel.people.length === 1 ? 'read' : 'delivered'
  save(channelsKey, channels)
  return message
}

export function updateCurrentMessage(channelName: string, text: string): void {
  const fromUser = requireSessionUser()
  const channels = load<Channel>(channelsKey)
  const channel = channels.find((current) => current.name === channelName)
  if (!channel) throw new Error(`Channel "${channelName}" does not exist`)
  if (!channel.people.includes(fromUser)) {
    throw new Error('User is not a member of this channel')
  }

  channel.currentMessages = channel.currentMessages ?? []
  channel.currentMessages = channel.currentMessages.filter(
    (message) => message.fromUser !== fromUser,
  )

  if (text.trim()) {
    channel.currentMessages.push({
      kedy: new Date().toISOString(),
      fromUser,
      text,
      status: 'sending',
      readBy: [],
    })
  }

  save(channelsKey, channels)
}

export function getMessages(channelName: string): Message[] {
  const nickname = requireSessionUser()
  const channels = getChannels()
  const channel = channels.find((current) => current.name === channelName)
  if (!channel) throw new Error(`Channel "${channelName}" does not exist`)
  if (!channel.people.includes(nickname)) {
    throw new Error('User is not a member of this channel')
  }

  let changed = false
  for (const message of channel.messages) {
    if (!message.readBy.includes(nickname)) {
      message.readBy.push(nickname)
      changed = true
    }
    const nextStatus: MessageStatus = channel.people.every((member) =>
      message.readBy.includes(member),
    )
      ? 'read'
      : 'delivered'
    if (message.status !== nextStatus) {
      message.status = nextStatus
      changed = true
    }
  }
  if (changed) save(channelsKey, channels)
  return channel.messages
}

export function destroyChannel(channelName: string): void {
  const channels = load<Channel>(channelsKey)
  const remainingChannels = channels.filter((channel) => channel.name !== channelName)

  if (remainingChannels.length === channels.length) {
    throw new Error(`Channel "${channelName}" does not exist`)
  }

  save(channelsKey, remainingChannels)
  save(
    invitesKey,
    load<Invite>(invitesKey).filter((item) => item.channel !== channelName),
  )
  save(
    kickedUsersKey,
    load<UserKickedFromChannel>(kickedUsersKey).filter((item) => item.channel !== channelName),
  )
}

// ! invite should be able only if reciever is not in channel
// ! invite should be able only if reciever is not in channel
export function getInvites(): Invite[] {
  return load<Invite>(invitesKey)
}

export function getInvitesForUser(): Invite[] {
  const nickname = getCurNickname()
  if (!nickname) return []
  return getInvites().filter((invite) => invite.receiver === nickname)
}

export function createInvite(receiver: string, channelName: string): Invite {
  const sender = requireSessionUser()
  const channels = getChannels()
  const channel = channels.find((item) => item.name === channelName)
  if (!channel) throw new Error(`Channel "${channelName}" does not exist`)
  const senderCanInvite =
    channel.people.includes(sender) && (!channel.isPrivate || channel.owner === sender)
  if (!senderCanInvite) {
    throw new Error('User is not allowed to invite people to this channel')
  }

  if (channel.owner === sender) {
    save(
      kickedUsersKey,
      getKickedUsers().filter((item) => !(item.channel === channelName && item.user === receiver)),
    )
  } else if (isBanned(channel, receiver)) {
    throw new Error('Prístup môže obnoviť iba správca kanála')
  }

  const invite: Invite = {
    sender,
    receiver,
    channel: channelName,
    sendTime: new Date().toISOString(),
  }
  const invites = getInvites()
  invites.push(invite)
  save(invitesKey, invites)
  return invite
}

export function acceptInvite(invite: Invite): Channel {
  const nickname = requireSessionUser()
  if (invite.receiver !== nickname) throw new Error('This invite belongs to another user')
  const channels = getChannels()
  const channel = channels.find((item) => item.name === invite.channel)
  if (!channel) throw new Error(`Channel "${invite.channel}" does not exist`)
  if (isBanned(channel, nickname)) throw new Error('Only admin can allow access')

  const storedInvite = getInvites().some(
    (item) =>
      item.sender === invite.sender &&
      item.receiver === nickname &&
      item.channel === invite.channel &&
      item.sendTime === invite.sendTime,
  )
  if (!storedInvite) throw new Error('Invite doesnt exists')

  if (!channel.people.includes(nickname)) {
    channel.people.push(nickname)
    save(channelsKey, channels)
  }
  save(
    invitesKey,
    getInvites().filter(
      (current) =>
        current.receiver !== invite.receiver ||
        current.channel !== invite.channel ||
        current.sender !== invite.sender,
    ),
  )
  return channel
}

// rejects invite to channel
export function rejectInvite(invite: Invite): void {
  const nickname = requireSessionUser()
  if (invite.receiver !== nickname) throw new Error('This invite belongs to another user')
  const invites = getInvites()
  const remaining = invites.filter(
    (current) =>
      current.receiver !== invite.receiver ||
      current.channel !== invite.channel ||
      current.sender !== invite.sender ||
      current.sendTime !== invite.sendTime,
  )
  if (remaining.length === invites.length) throw new Error('Invitation does not exist')
  save(invitesKey, remaining)
}

export function getKickedUsers(): UserKickedFromChannel[] {
  return load<UserKickedFromChannel>(kickedUsersKey)
}

export function kickUserFromChannel(user: string, channelName: string): UserKickedFromChannel {
  const kickedBy = requireSessionUser()
  const channels = getChannels()
  const channel = channels.find((item) => item.name === channelName)
  if (!channel) throw new Error(`Channel "${channelName}" does not exist`)
  const canKick =
    channel.people.includes(kickedBy) && (!channel.isPrivate || channel.owner === kickedBy)
  if (!canKick) throw new Error('User is not allowed to kick people from this channel')
  if (user === kickedBy) throw new Error('Cant kick yourself')
  if (user === channel.owner) throw new Error('Cant kick admin')

  const kickedUsers = getKickedUsers()
  const previousKicks = kickedUsers.filter(
    (item) => item.channel === channelName && item.user === user,
  )
  if (!channel.people.includes(user) && previousKicks.length === 0) {
    throw new Error('The user is not member of this channel')
  }
  if (previousKicks.some((item) => item.kickedBy === kickedBy)) {
    throw new Error('U voted to kick this member')
  }

  const kick: UserKickedFromChannel = {
    user,
    channel: channelName,
    kickedBy,
    kickedTime: new Date().toISOString(),
  }
  kickedUsers.push(kick)
  save(kickedUsersKey, kickedUsers)
  channel.people = channel.people.filter((nickname) => nickname !== user)
  save(channelsKey, channels)
  return kick
}

export function leaveChannel(channelName: string): void {
  const nickname = requireSessionUser()
  const channels = getChannels()
  const channel = channels.find((item) => item.name === channelName)

  if (!channel) {
    throw new Error(`Channel "${channelName}" does not exist`)
  }

  if (channel.owner === nickname) {
    destroyChannel(channelName)
    return
  }

  if (!channel.people.includes(nickname)) {
    throw new Error('User is not a member of this channel')
  }

  channel.people = channel.people.filter((user) => user !== nickname)
  save(channelsKey, channels)
}

export function joinChannel(name: string, isPrivate = false): Channel {
  const nickname = requireSessionUser()
  const channels = getChannels()
  const channel = channels.find((item) => item.name === name)
  if (!channel) return createChannel(name, isPrivate)
  if (isBanned(channel, nickname)) throw new Error('Forbidden access to this channel')
  if (channel.people.includes(nickname)) return channel
  if (channel.isPrivate) throw new Error('Need invite to join private channel')

  channel.people.push(nickname)
  save(channelsKey, channels)
  return channel
}

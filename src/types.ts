export type Gender = 'f' | 'm' | 'd'

export interface Profile {
  id: string
  name: string
  age: number
  gender: Gender
  city: string
  distanceKm: number
  job: string
  bio: string
  interests: string[]
  online: boolean
  lastSeenMin: number
  verified: boolean
  joinedDaysAgo: number
  photos: string[]
  /** Demo: Profil liked dich bereits -> Match beim Like */
  likesYou: boolean
}

export interface Message {
  id: string
  from: 'me' | 'them'
  text: string
  at: number
}

export interface Match {
  profileId: string
  at: number
  superLike: boolean
  unread: number
  messages: Message[]
}

export interface Me {
  name: string
  age: number
  city: string
  bio: string
  interests: string[]
  photos: string[]
}

export interface Filters {
  minAge: number
  maxAge: number
  maxDistance: number
  show: Gender[]
  onlyOnline: boolean
}

export type SwipeKind = 'like' | 'nope' | 'super'
export type Theme = 'auto' | 'light' | 'dark'

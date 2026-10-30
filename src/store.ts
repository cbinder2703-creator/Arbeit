import { useSyncExternalStore } from 'react'
import { PROFILE_BY_ID, REPLIES } from './data'
import { makePhoto } from './photos'
import type { Filters, Match, Me, Message, SwipeKind, Theme } from './types'

interface State {
  me: Me
  swipes: Record<string, SwipeKind>
  history: { id: string; matched: boolean }[]
  matches: Match[]
  filters: Filters
  theme: Theme
  onboarded: boolean
  /** Match, zu dem gerade das „Es ist ein Match“-Overlay gezeigt wird */
  celebrate: string | null
}

const KEY = 'flare-state-v1'

const defaults = (): State => ({
  me: {
    name: 'Du',
    age: 27,
    city: 'Berlin',
    bio: '',
    interests: ['Kaffee', 'Reisen'],
    photos: [makePhoto(999, 0)],
  },
  swipes: {},
  history: [],
  matches: [],
  filters: { minAge: 18, maxAge: 50, maxDistance: 60, show: ['f', 'm', 'd'], onlyOnline: false },
  theme: 'auto',
  onboarded: false,
  celebrate: null,
})

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw), celebrate: null }
  } catch {
    /* Speicher nicht verfügbar – mit Defaults weiter */
  }
  return defaults()
}

let state: State = load()
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* Quota voll o. Ä. – App läuft trotzdem */
  }
  listeners.forEach((l) => l())
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => selector(state)
  )
}

let msgSeq = 0
const mid = () => `m${Date.now()}-${msgSeq++}`

export const actions = {
  swipe(id: string, kind: SwipeKind) {
    const p = PROFILE_BY_ID[id]
    if (!p || state.swipes[id]) return
    const matched = kind !== 'nope' && (p.likesYou || kind === 'super') && !state.matches.some((m) => m.profileId === id)
    const next: Partial<State> = {
      swipes: { ...state.swipes, [id]: kind },
      history: [...state.history, { id, matched }],
    }
    if (matched) {
      const match: Match = { profileId: id, at: Date.now(), superLike: kind === 'super', unread: 0, messages: [] }
      next.matches = [match, ...state.matches]
      next.celebrate = id
    }
    set(next)
  },
  undo() {
    const last = state.history[state.history.length - 1]
    if (!last) return
    const swipes = { ...state.swipes }
    delete swipes[last.id]
    set({
      swipes,
      history: state.history.slice(0, -1),
      matches: last.matched ? state.matches.filter((m) => m.profileId !== last.id) : state.matches,
      celebrate: null,
    })
  },
  /** Lovoo-Style: direkt „Hallo“ sagen, ohne vorher zu matchen */
  startChat(id: string) {
    if (!state.matches.some((m) => m.profileId === id)) {
      const swipes = state.swipes[id] ? state.swipes : { ...state.swipes, [id]: 'like' as SwipeKind }
      set({ swipes, matches: [{ profileId: id, at: Date.now(), superLike: false, unread: 0, messages: [] }, ...state.matches] })
    }
  },
  closeCelebrate() {
    set({ celebrate: null })
  },
  markRead(id: string) {
    if (state.matches.find((m) => m.profileId === id)?.unread)
      set({ matches: state.matches.map((m) => (m.profileId === id ? { ...m, unread: 0 } : m)) })
  },
  send(id: string, text: string) {
    const t = text.trim()
    if (!t) return
    const msg: Message = { id: mid(), from: 'me', text: t, at: Date.now() }
    set({ matches: state.matches.map((m) => (m.profileId === id ? { ...m, messages: [...m.messages, msg] } : m)) })
    // Demo: simulierte Antwort. Mit echtem Backend durch WebSocket/Push ersetzen.
    window.setTimeout(() => {
      const reply: Message = { id: mid(), from: 'them', text: REPLIES[Math.floor(Math.random() * REPLIES.length)], at: Date.now() }
      set({ matches: state.matches.map((m) => (m.profileId === id ? { ...m, messages: [...m.messages, reply], unread: m.unread + 1 } : m)) })
    }, 1200 + Math.random() * 1500)
  },
  updateMe(patch: Partial<Me>) {
    set({ me: { ...state.me, ...patch } })
  },
  setFilters(f: Filters) {
    set({ filters: f })
  },
  setTheme(theme: Theme) {
    set({ theme })
  },
  finishOnboarding() {
    set({ onboarded: true })
  },
  reset() {
    set({ ...defaults(), me: state.me, onboarded: true, theme: state.theme })
  },
}

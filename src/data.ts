import type { Gender, Profile } from './types'
import { makePhoto } from './photos'

function rng(seed: number) {
  let s = seed >>> 0
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296
}

const F = ['Lena', 'Mia', 'Sophie', 'Emma', 'Hannah', 'Lea', 'Clara', 'Nina', 'Jule', 'Amelie', 'Laura', 'Marie', 'Selin', 'Paula', 'Elif', 'Johanna', 'Carla', 'Ronja', 'Mara', 'Vanessa', 'Leonie', 'Alina', 'Isabel', 'Tessa']
const M = ['Jonas', 'Leon', 'Noah', 'Elias', 'Felix', 'Luca', 'Paul', 'Maximilian', 'Tim', 'Ben', 'Moritz', 'Emil', 'Can', 'Jan', 'David', 'Nico', 'Finn', 'Kilian', 'Samuel', 'Tobias', 'Yusuf', 'Anton', 'Philipp', 'Mats']
const D = ['Alex', 'Sam', 'Robin', 'Charlie', 'Kim', 'Jules']
const JOBS = ['UX-Designerin', 'Physiotherapeut', 'Lehrerin', 'Softwareentwickler', 'Fotografin', 'Barista', 'Architekt', 'Ärztin', 'Koch', 'Studentin (Psychologie)', 'Musiker', 'Tierärztin', 'Marketing-Managerin', 'Mechatroniker', 'Journalistin', 'Gärtner', 'Student (Informatik)', 'Yoga-Lehrerin']
const CITIES = ['Berlin', 'Berlin', 'Berlin', 'Potsdam', 'Hamburg', 'München', 'Köln', 'Leipzig']
const INTERESTS = ['Wandern', 'Kaffee', 'Kochen', 'Reisen', 'Techno', 'Yoga', 'Bouldern', 'Fotografie', 'Netflix', 'Gaming', 'Hunde', 'Katzen', 'Radfahren', 'Festivals', 'Lesen', 'Brunch', 'Laufen', 'Kunst', 'Podcasts', 'Surfen', 'Tanzen', 'Wein', 'Camping', 'Kino']
const BIOS = [
  'Sonntags am liebsten Flohmarkt, danach Kaffee. Wer bringt den Kuchen?',
  'Ich suche jemanden, der über meine schlechten Wortspiele lachen kann.',
  'Zwischen Bergen und Meer bin ich immer Team Meer. Du?',
  'Backpacker-Herz, Büro-Alltag. Planen gerade den nächsten Trip.',
  'Kann sehr gut Pasta. Alles andere verhandelbar.',
  'Wenig Social Media, viel echtes Leben. Schreib mir gern zuerst!',
  'Hundemama/-papa in Teilzeit, Spaziergänge sind mein Ding.',
  'Ich tanze in der Küche. Wenn du mitmachst, passt das.',
  'Lieber ein gutes Gespräch als hundert Likes.',
  'Neu in der Stadt – zeig mir deinen Lieblingsort!',
  'Gym am Morgen, Pizza am Abend. Balance halt.',
  'Musik ist mein Antrieb. Frag mich nach meiner Playlist.',
]

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)]
}

function generate(count: number): Profile[] {
  const r = rng(2024)
  const out: Profile[] = []
  for (let i = 0; i < count; i++) {
    const gender: Gender = i % 11 === 10 ? 'd' : i % 2 === 0 ? 'f' : 'm'
    const pool = gender === 'f' ? F : gender === 'm' ? M : D
    const name = pool[Math.floor(i / 2) % pool.length]
    const interests = Array.from(new Set(Array.from({ length: 5 }, () => pick(r, INTERESTS))))
    const online = r() > 0.62
    out.push({
      id: `p${i + 1}`,
      name,
      age: 19 + Math.floor(r() * 26),
      gender,
      city: pick(r, CITIES),
      distanceKm: Math.max(1, Math.round(Math.pow(r(), 1.7) * 60)),
      job: pick(r, JOBS),
      bio: pick(r, BIOS),
      interests,
      online,
      lastSeenMin: online ? 0 : 5 + Math.floor(r() * 2800),
      verified: r() > 0.5,
      joinedDaysAgo: Math.floor(r() * 120),
      photos: Array.from({ length: 3 + Math.floor(r() * 3) }, (_, v) => makePhoto(i + 1, v)),
      likesYou: r() > 0.55,
    })
  }
  return out
}

export const PROFILES: Profile[] = generate(48)
export const PROFILE_BY_ID: Record<string, Profile> = Object.fromEntries(PROFILES.map((p) => [p.id, p]))

export const ALL_INTERESTS = INTERESTS

export const REPLIES = [
  'Hey! Schön, dass wir gematcht haben 😊',
  'Haha, das gefällt mir. Erzähl mehr!',
  'Wie sieht dein Wochenende aus?',
  'Kaffee oder Drink – was ist dein Ding?',
  'Ich bin gerade unterwegs, melde mich gleich ausführlicher 🙂',
  'Das klingt nach einem Plan!',
  'Oh, ich liebe das auch. Welche Lieblingsplaylist hast du?',
  'Spontan Lust auf einen Spaziergang später?',
]

export function lastSeenLabel(p: Pick<Profile, 'online' | 'lastSeenMin'>): string {
  if (p.online) return 'Online'
  const m = p.lastSeenMin
  if (m < 60) return `vor ${m} Min.`
  if (m < 60 * 24) return `vor ${Math.round(m / 60)} Std.`
  return `vor ${Math.round(m / 1440)} Tg.`
}

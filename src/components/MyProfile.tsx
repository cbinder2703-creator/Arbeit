import { useRef } from 'react'
import { ALL_INTERESTS } from '../data'
import { actions, useStore } from '../store'
import type { Gender, Theme } from '../types'
import { IconCamera, IconX } from './Icons'

/** Foto lokal verkleinern, damit Speicher & Upload klein bleiben */
function downscale(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild konnte nicht geladen werden'))
    }
    img.src = url
  })
}

const GENDERS: [Gender, string][] = [['f', 'Frauen'], ['m', 'Männer'], ['d', 'Divers']]

export function MyProfile() {
  const me = useStore((s) => s.me)
  const theme = useStore((s) => s.theme)
  const filters = useStore((s) => s.filters)
  const file = useRef<HTMLInputElement>(null)

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const onFiles = async (files: FileList | null) => {
    if (!files) return
    const added: string[] = []
    for (const f of Array.from(files).slice(0, 6 - me.photos.length)) {
      try { added.push(await downscale(f)) } catch { /* überspringen */ }
    }
    if (added.length) actions.updateMe({ photos: [...me.photos, ...added] })
  }

  return (
    <section className="page narrow">
      <header className="page-head"><h1>Mein Profil</h1></header>

      <h3 className="label">Fotos ({me.photos.length}/6)</h3>
      <div className="photo-grid">
        {me.photos.map((src, i) => (
          <div key={i} className="photo-slot">
            <img src={src} alt={`Dein Foto ${i + 1}`} draggable={false} />
            {me.photos.length > 1 && (
              <button className="remove" aria-label="Foto entfernen" onClick={() => actions.updateMe({ photos: me.photos.filter((_, k) => k !== i) })}>
                <IconX width={14} height={14} strokeWidth={3} />
              </button>
            )}
          </div>
        ))}
        {me.photos.length < 6 && (
          <button className="photo-slot add" onClick={() => file.current?.click()} aria-label="Foto hinzufügen">
            <IconCamera /> <span>Hinzufügen</span>
          </button>
        )}
        <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} />
      </div>

      <div className="form">
        <label>Name<input value={me.name} maxLength={30} onChange={(e) => actions.updateMe({ name: e.target.value })} /></label>
        <div className="two">
          <label>Alter<input type="number" min={18} max={99} value={me.age} onChange={(e) => actions.updateMe({ age: Math.max(18, Math.min(99, Number(e.target.value) || 18)) })} /></label>
          <label>Stadt<input value={me.city} maxLength={40} onChange={(e) => actions.updateMe({ city: e.target.value })} /></label>
        </div>
        <label>Über mich<textarea rows={3} maxLength={300} value={me.bio} placeholder="Erzähl etwas über dich…" onChange={(e) => actions.updateMe({ bio: e.target.value })} /></label>
      </div>

      <h3 className="label">Interessen</h3>
      <div className="chips">
        {ALL_INTERESTS.map((t) => (
          <button key={t} className={`chip click ${me.interests.includes(t) ? 'on' : ''}`} onClick={() => actions.updateMe({ interests: toggle(me.interests, t) })}>{t}</button>
        ))}
      </div>

      <h3 className="label">Ich suche</h3>
      <div className="chips">
        {GENDERS.map(([g, l]) => (
          <button key={g} className={`chip click ${filters.show.includes(g) ? 'on' : ''}`} onClick={() => actions.setFilters({ ...filters, show: toggle(filters.show, g) })}>{l}</button>
        ))}
      </div>

      <h3 className="label">Darstellung</h3>
      <div className="seg">
        {([['auto', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']] as [Theme, string][]).map(([k, l]) => (
          <button key={k} className={theme === k ? 'on' : ''} onClick={() => actions.setTheme(k)}>{l}</button>
        ))}
      </div>

      <button className="btn ghost danger" onClick={() => { if (confirm('Alle Swipes, Matches und Chats zurücksetzen?')) actions.reset() }}>
        Demo-Daten zurücksetzen
      </button>
    </section>
  )
}

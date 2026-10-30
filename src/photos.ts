// Platzhalter-Fotos: deterministisch generierte SVG-Porträts (keine externen Bilder nötig).
// Echte Nutzerfotos kommen über den Foto-Upload im Profil.

function rng(seed: number) {
  let s = seed >>> 0
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296
}

const SKIN = ['#f6d3b8', '#e8b48f', '#c98d63', '#9a6440', '#6e4328', '#fbe0cf']
const HAIR = ['#1b1210', '#3a2418', '#6a4326', '#b07a3c', '#d9b25f', '#8b2f23', '#2a2d3a']

export function makePhoto(seed: number, variant: number): string {
  const r = rng(seed * 131 + variant * 7919 + 17)
  const h1 = Math.floor(r() * 360)
  const h2 = (h1 + 50 + Math.floor(r() * 90)) % 360
  const skin = SKIN[Math.floor(r() * SKIN.length)]
  const hair = HAIR[Math.floor(r() * HAIR.length)]
  const cloth = `hsl(${Math.floor(r() * 360)} 45% ${28 + Math.floor(r() * 25)}%)`
  const cx = 400 + (r() - 0.5) * 120
  const headY = 430 + (r() - 0.5) * 70
  const scale = 0.9 + r() * 0.25
  const long = r() > 0.45
  const blobs = Array.from({ length: 4 }, () => {
    const bx = Math.floor(r() * 800)
    const by = Math.floor(r() * 1000)
    const br = 160 + Math.floor(r() * 220)
    const bh = (h1 + Math.floor(r() * 120)) % 360
    return `<circle cx="${bx}" cy="${by}" r="${br}" fill="hsl(${bh} 85% 62%)" opacity=".45"/>`
  }).join('')
  const hairBack = long
    ? `<path d="M${cx - 135 * scale} ${headY} C${cx - 150 * scale} ${headY - 190 * scale} ${cx + 150 * scale} ${headY - 190 * scale} ${cx + 135 * scale} ${headY} L${cx + 150 * scale} ${headY + 230 * scale} L${cx - 150 * scale} ${headY + 230 * scale}Z" fill="${hair}"/>`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h1} 75% 52%)"/><stop offset="1" stop-color="hsl(${h2} 70% 28%)"/></linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="55"/></filter>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<g filter="url(#b)">${blobs}</g>
${hairBack}
<path d="M${cx - 300} 1000 C${cx - 290} 760 ${cx - 150} 690 ${cx} 690 C${cx + 150} 690 ${cx + 290} 760 ${cx + 300} 1000Z" fill="${cloth}"/>
<rect x="${cx - 45 * scale}" y="${headY + 100 * scale}" width="${90 * scale}" height="${120 * scale}" rx="40" fill="${skin}"/>
<ellipse cx="${cx}" cy="${headY}" rx="${112 * scale}" ry="${138 * scale}" fill="${skin}"/>
<path d="M${cx - 118 * scale} ${headY - 20 * scale} C${cx - 120 * scale} ${headY - 175 * scale} ${cx + 120 * scale} ${headY - 175 * scale} ${cx + 118 * scale} ${headY - 20 * scale} C${cx + 70 * scale} ${headY - 90 * scale} ${cx - 70 * scale} ${headY - 90 * scale} ${cx - 118 * scale} ${headY - 20 * scale}Z" fill="${hair}"/>
<circle cx="${cx - 40 * scale}" cy="${headY + 5 * scale}" r="${7 * scale}" fill="#2b1d17"/>
<circle cx="${cx + 40 * scale}" cy="${headY + 5 * scale}" r="${7 * scale}" fill="#2b1d17"/>
<path d="M${cx - 38 * scale} ${headY + 62 * scale} Q${cx} ${headY + 92 * scale} ${cx + 38 * scale} ${headY + 62 * scale}" stroke="#7a3b32" stroke-width="${7 * scale}" fill="none" stroke-linecap="round"/>
<rect width="800" height="1000" fill="url(#fade)"/>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

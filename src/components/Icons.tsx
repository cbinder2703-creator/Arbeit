import type { ReactNode, SVGProps } from 'react'

const base = (children: ReactNode) =>
  function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        {children}
      </svg>
    )
  }

export const IconFlame = base(<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.4.3 1.5 1 2.1 1.7 2.4C10 8 11 5 12 3z" />)
export const IconGrid = base(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>)
export const IconChat = base(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />)
export const IconUser = base(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>)
export const IconX = base(<path d="M6 6l12 12M18 6L6 18" />)
export const IconHeart = base(<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" />)
export const IconStar = base(<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />)
export const IconUndo = base(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>)
export const IconFilter = base(<><path d="M4 6h16M7 12h10M10 18h4" /></>)
export const IconInfo = base(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></>)
export const IconPin = base(<><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>)
export const IconSend = base(<path d="M4 12l16-8-6 17-3-7z" />)
export const IconBack = base(<path d="M15 5l-7 7 7 7" />)
export const IconCamera = base(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>)
export const IconCheck = base(<path d="M5 12.5l4.5 4.5L19 7.5" />)

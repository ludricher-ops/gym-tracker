// Jeu d'icônes (cahier 4.5). Trait 1.6, lineCap rond, viewBox 24×24.
// Couleur via `currentColor`.

const PATHS = {
  flame: 'M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.6.6-2.9 1.6-3.9C9 11 9.4 12 11 12c1.3 0 2-1 2-2.6C13 7.4 12 5.3 12 3z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  chart: 'M3 3v18h18M7 14l4-4 3 3 5-6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12l5 5L20 6',
  close: 'M6 6l12 12M18 6L6 18',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  dumbbell: 'M6.5 8v8M9 6.5v11M15 6.5v11M17.5 8v8M9 12h6M3 10v4M21 10v4',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M18 15l-6-6-6 6',
  pause: 'M9 5v14M15 5v14',
  skip: 'M5 5l10 7-10 7zM19 5v14',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  heart: 'M12 20S3 14.5 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14.5 12 20 12 20z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  ruler: 'M4 16L16 4l4 4L8 20zM9 9l2 2M12 6l2 2M6 12l2 2',
  cog: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2M2 12h3M19 12h3',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21a2 2 0 0 0 4 0',
  database: 'M12 7c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 4v6c0 1.7 3.6 3 8 3s8-1.3 8-3V4M4 10v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  camera: 'M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  scale: 'M12 3v18M5 21h14M7 7l-4 7a4 4 0 0 0 8 0L7 7zM17 7l-4 7a4 4 0 0 0 8 0l-4-7zM5 7h14',
  world: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5z',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  copy: 'M9 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9zM5 15H3V5a2 2 0 0 1 2-2h10v2',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6',
  link: 'M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1',
  edit: 'M4 20h4l10-10-4-4L4 16v4zM14 6l4 4',
  trophy: 'M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 0-3 3M12 14v3M8 20h8M9.5 20l.6-3h3.8l.6 3',
  share: 'M12 3v13M8 7l4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  play: 'M5 3l14 9-14 9V3z',
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 22, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

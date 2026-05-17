import { Icon, type IconName } from './Icon'

export interface TabDef<T extends string> {
  key: T
  label: string
  icon: IconName
}

interface TabBarProps<T extends string> {
  tabs: TabDef<T>[]
  active: T
  onSelect: (key: T) => void
}

export function TabBar<T extends string>({ tabs, active, onSelect }: TabBarProps<T>) {
  return (
    <nav className="gt-tabbar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`gt-tabbar__tab ${active === tab.key ? 'gt-tabbar__tab--active' : ''}`}
          aria-current={active === tab.key ? 'page' : undefined}
          aria-label={tab.label}
          onClick={() => onSelect(tab.key)}
        >
          <Icon name={tab.icon} size={23} />
          <span className="gt-tabbar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

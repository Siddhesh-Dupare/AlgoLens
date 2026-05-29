export type MenuBarItemType = 'action' | 'separator' | 'submenu'

export interface MenuAction {
  id: string
  type: 'action'
  label: string
  shortcut?: string
  disabled?: boolean
  icon?: string
}

export interface MenuSeparator {
  id: string
  type: 'separator'
}

export type MenuItem = MenuAction | MenuSeparator

export interface TopLevelMenu {
  id: string
  label: string
  items: MenuItem[]
}

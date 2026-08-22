export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'pk-theme'

export function getStoredTheme(): Theme {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}
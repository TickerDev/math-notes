export function formatDate(date: string) {
  const value = new Date(date)
  const today = new Date()
  if (value.toDateString() === today.toDateString()) {
    return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return value.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: value.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'math-notes'
}

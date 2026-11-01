export const normalizeSearch = value => String(value ?? '')
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/ı/g, 'i')

export function filterPerfumes(perfumes, {
  genders = [],
  notes = [],
  query = '',
  favorites = [],
  onlyFavorites = false,
  sort = 'featured',
  locale = 'tr-TR'
} = {}) {
  const selectedGenders = new Set(genders)
  const selectedNotes = new Set(notes)
  const favoriteIds = new Set(favorites)
  const needle = normalizeSearch(query).trim()

  const result = perfumes.filter(perfume => {
    const matchesGender = !selectedGenders.size || selectedGenders.has(perfume.gender)
    // Canonical keys keep note filters unchanged when display language changes.
    const noteKeys = perfume.noteKeys ?? perfume.notes
    const matchesNotes = !selectedNotes.size || noteKeys.some(note => selectedNotes.has(note))
    const matchesQuery = !needle || normalizeSearch([
      perfume.name, perfume.family, ...perfume.notes
    ].join(' ')).includes(needle)
    const matchesFavorites = !onlyFavorites || favoriteIds.has(perfume.id)
    return matchesGender && matchesNotes && matchesQuery && matchesFavorites
  })

  // Array#sort is stable: equal prices retain their catalogue order.
  if (sort === 'price-asc') result.sort((a, b) => a.priceUsd - b.priceUsd)
  if (sort === 'price-desc') result.sort((a, b) => b.priceUsd - a.priceUsd)
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, locale))
  return result
}

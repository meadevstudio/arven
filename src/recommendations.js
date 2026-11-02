import { perfumeProfiles } from './perfume-profiles.js'

const allowed = {
  gender: ['all', 'Erkek', 'Kadın', 'Unisex'],
  styles: ['fresh', 'sweet', 'floral', 'woody', 'dark', 'fruity'],
  season: ['spring', 'summer', 'autumn', 'winter'],
  time: ['day', 'evening'],
  occasion: ['daily', 'office', 'special']
}

const normalizeAnswers = answers => {
  const source = answers && typeof answers === 'object' ? answers : {}
  return {
    gender: allowed.gender.includes(source.gender) ? source.gender : 'all',
    styles: Array.isArray(source.styles)
      ? [...new Set(source.styles.filter(style => allowed.styles.includes(style)))]
      : [],
    season: allowed.season.includes(source.season) ? source.season : 'any',
    time: allowed.time.includes(source.time) ? source.time : 'any',
    occasion: allowed.occasion.includes(source.occasion) ? source.occasion : 'any'
  }
}

function variedPicks(candidates, limit) {
  const remaining = [...candidates]
  const result = []
  const seenStyles = new Set()
  const seenFamilies = new Set()
  const seenGenders = new Set()

  while (remaining.length && result.length < limit) {
    let bestIndex = 0
    let bestVariety = -1
    remaining.forEach((candidate, index) => {
      const newStyles = candidate.profile.styles.filter(style => !seenStyles.has(style)).length
      const variety = newStyles * 4
        + (seenFamilies.has(candidate.perfume.family) ? 0 : 2)
        + (seenGenders.has(candidate.perfume.gender) ? 0 : 1)
      if (variety > bestVariety) {
        bestVariety = variety
        bestIndex = index
      }
    })
    const [pick] = remaining.splice(bestIndex, 1)
    result.push(pick)
    pick.profile.styles.forEach(style => seenStyles.add(style))
    seenFamilies.add(pick.perfume.family)
    seenGenders.add(pick.perfume.gender)
  }
  return result
}

function diverseScoreTies(candidates, limit) {
  const remaining = [...candidates]
  const result = []
  const seenGenders = new Set()
  while (remaining.length && result.length < limit) {
    const highestScore = remaining[0].score
    const unseenIndex = remaining.findIndex(candidate => candidate.score === highestScore
      && !seenGenders.has(candidate.perfume.gender))
    // Category diversity only breaks a score tie; lower scores cannot displace stronger matches.
    const [pick] = remaining.splice(unseenIndex < 0 ? 0 : unseenIndex, 1)
    result.push(pick)
    seenGenders.add(pick.perfume.gender)
  }
  return result
}

export function recommendPerfumes(perfumes, answers, limit = 4) {
  if (!Array.isArray(perfumes)) return []
  const count = typeof limit === 'number' && Number.isFinite(limit)
    ? Math.max(0, Math.min(4, Math.floor(limit)))
    : 4
  if (!count) return []

  const preferences = normalizeAnswers(answers)
  const hasPreferences = preferences.styles.length > 0
    || preferences.season !== 'any'
    || preferences.time !== 'any'
    || preferences.occasion !== 'any'
  const seenNames = new Set()
  let candidates = []

  perfumes.forEach((perfume, index) => {
    if (!perfume || typeof perfume.name !== 'string' || seenNames.has(perfume.name)) return
    if (preferences.gender !== 'all' && perfume.gender !== preferences.gender) return
    if (!Object.hasOwn(perfumeProfiles, perfume.name)) return
    const profile = perfumeProfiles[perfume.name]
    if (!profile || !['styles', 'seasons', 'times', 'occasions'].every(key => Array.isArray(profile[key]))) return
    seenNames.add(perfume.name)

    const matchingStyles = preferences.styles.filter(style => profile.styles.includes(style))
    const reasons = matchingStyles.map(value => ({ type: 'style', value }))
    // Style is an OR preference, so multiple selected styles do not multiply its weight.
    let score = matchingStyles.length ? 6 : 0
    for (const [type, field] of [['season', 'seasons'], ['time', 'times'], ['occasion', 'occasions']]) {
      const value = preferences[type]
      if (value !== 'any' && profile[field].includes(value)) {
        reasons.push({ type, value })
        score += 2
      }
    }
    candidates.push({ perfume, reasons, score, profile, index, matchingStyle: matchingStyles.length > 0 })
  })

  if (preferences.styles.length && candidates.some(candidate => candidate.matchingStyle)) {
    candidates = candidates.filter(candidate => candidate.matchingStyle)
  }

  if (hasPreferences) {
    // A sparse result is more useful than filling it with unrelated zero-score perfumes.
    candidates = candidates.filter(candidate => candidate.score > 0)
    candidates.sort((a, b) => b.score - a.score || a.index - b.index)
    candidates = preferences.gender === 'all'
      ? diverseScoreTies(candidates, count)
      : candidates.slice(0, count)
  } else {
    candidates = variedPicks(candidates, count)
  }

  return candidates.map(({ perfume, reasons, score }) => ({ perfume, reasons, score }))
}

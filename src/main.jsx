import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { categories, perfumes } from './data.js'
import { locales, localizePerfume, translations } from './i18n.js'
import { filterPerfumes } from './catalog.js'
import NoteMultiSelect from './NoteMultiSelect.jsx'
import PerfumeQuiz, { emptyQuizAnswers } from './PerfumeQuiz.jsx'
import { quizTranslations } from './quiz-i18n.js'
import { recommendPerfumes } from './recommendations.js'
import { perfumeProfiles } from './perfume-profiles.js'
import './styles.css'

const Icon = ({ name, size = 18, strokeWidth = 1.8 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 8.8 2.5Z"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    spark: <><path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4Z"/><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6Z"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-3-6 3Z"/>,
    filter: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="3" fill="currentColor" stroke="none"/></>
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const languages = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' }
]

function Flag({ language }) {
  return <svg viewBox="0 0 32 32" className="language-flag" aria-hidden="true" focusable="false">
    {language === 'tr' && <>
      <path fill="#e30a17" d="M0 0h32v32H0z"/>
      <circle cx="13" cy="16" r="8" fill="#fff"/>
      <circle cx="15" cy="16" r="6.5" fill="#e30a17"/>
      <path fill="#fff" d="m22 11.1 1.1 3.4h3.6l-2.9 2.1 1.1 3.4-2.9-2.1-2.9 2.1 1.1-3.4-2.9-2.1h3.6z"/>
    </>}
    {language === 'en' && <>
      <path fill="#012169" d="M0 0h32v32H0z"/>
      <path stroke="#fff" strokeWidth="7" d="m0 0 32 32M32 0 0 32"/>
      <path stroke="#c8102e" strokeWidth="2.5" d="m0 0 32 32M32 0 0 32"/>
      <path stroke="#fff" strokeWidth="11" d="M16 0v32M0 16h32"/>
      <path stroke="#c8102e" strokeWidth="6" d="M16 0v32M0 16h32"/>
    </>}
    {language === 'ar' && <>
      <path fill="#007a3d" d="M0 0h32v32H0z"/>
      <text x="16" y="17" fill="#fff" fontSize="8" fontFamily="Tahoma, sans-serif" textAnchor="middle" lang="ar" direction="rtl">لا إله إلا الله</text>
      <path stroke="#fff" strokeWidth="1.5" strokeLinecap="round" d="M8 22h16m-2-1v2"/>
    </>}
  </svg>
}

const RATE_REFRESH_MS = 60 * 60 * 1000
const FAVORITES_KEY = 'arven-favorites'

function readSavedFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    if (Array.isArray(saved)) {
      const validIds = new Set(perfumes.map(perfume => perfume.id))
      return [...new Set(saved.filter(id => validIds.has(id)))]
    }
  } catch { /* The catalogue also works when storage is unavailable or invalid. */ }
  return []
}

function useFavorites() {
  const [favorites, setFavorites] = useState(readSavedFavorites)

  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)) } catch { /* Storage may be unavailable. */ }
  }, [favorites])

  useEffect(() => {
    const syncFavorites = event => {
      if (event.key === FAVORITES_KEY || event.key === null) setFavorites(readSavedFavorites())
    }
    window.addEventListener('storage', syncFavorites)
    return () => window.removeEventListener('storage', syncFavorites)
  }, [])

  const toggleFavorite = id => setFavorites(previous => previous.includes(id)
    ? previous.filter(favoriteId => favoriteId !== id)
    : [...previous, id])
  return [favorites, toggleFavorite]
}

function readSavedRate() {
  try {
    const saved = JSON.parse(localStorage.getItem('arven-usdtry') || 'null')
    if (Number.isFinite(saved?.rate) && saved.rate > 0) return saved
  } catch { /* Storage may be unavailable. */ }
  return null
}

function useExchangeRate() {
  const [savedRate, setSavedRate] = useState(readSavedRate)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    let lastRate = readSavedRate()
    let controller
    let timer
    let inFlight = false
    const refresh = async () => {
      if (cancelled || inFlight) return
      inFlight = true
      window.clearTimeout(timer)
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 18000)
      let nextRefresh = 60000
      try {
        const response = await fetch('/api/usd-try', { signal: controller.signal, cache: 'no-cache' })
        if (!response.ok) throw new Error(`Exchange rate unavailable (${response.status})`)
        const payload = await response.json()
        if (!Number.isFinite(payload.rate) || payload.rate <= 0) throw new Error('Invalid exchange rate')
        if (cancelled) return
        lastRate = { ...payload, updatedAt: Date.now() }
        setSavedRate(lastRate)
        setStatus(payload.stale ? 'stale' : 'live')
        try { localStorage.setItem('arven-usdtry', JSON.stringify(lastRate)) } catch { /* Storage may be unavailable. */ }
        const rateAge = Math.max(0, Date.now() - Date.parse(payload.fetchedAt))
        nextRefresh = payload.stale ? 60000 : Math.max(60000, RATE_REFRESH_MS - (Number.isFinite(rateAge) ? rateAge : 0))
      } catch {
        if (!cancelled) setStatus(lastRate ? 'stale' : 'unavailable')
      } finally {
        window.clearTimeout(timeout)
        inFlight = false
        if (!cancelled) timer = window.setTimeout(refresh, nextRefresh)
      }
    }
    refresh()
    window.addEventListener('online', refresh)
    return () => {
      cancelled = true
      controller?.abort()
      window.clearTimeout(timer)
      window.removeEventListener('online', refresh)
    }
  }, [])

  return { rate: savedRate?.rate ?? null, status, updatedAt: savedRate?.updatedAt, source: savedRate?.source, rateDate: savedRate?.rateDate }
}

function PerfumeName({ name, as: Heading = 'h3', className = '', children }) {
  const headingRef = useRef(null)
  const textRef = useRef(null)
  useLayoutEffect(() => {
    const heading = headingRef.current
    const text = textRef.current
    let active = true
    let frame
    let previousWidth = heading.clientWidth
    const fit = () => {
      if (!active) return
      text.style.fontSize = ''
      const available = heading.clientWidth
      const natural = text.getBoundingClientRect().width
      const base = parseFloat(window.getComputedStyle(heading).fontSize)
      if (available > 0 && natural > available) {
        text.style.fontSize = `${Math.floor(base * available / natural * 100) / 100}px`
      }
    }
    const scheduleFit = () => {
      if (!active) return
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(fit)
    }
    fit()
    const observer = new ResizeObserver(([entry]) => {
      // Font sizing may change height; only a width change needs another fit.
      if (Math.abs(entry.contentRect.width - previousWidth) > 0.25) {
        previousWidth = entry.contentRect.width
        scheduleFit()
      }
    })
    observer.observe(heading)
    document.fonts.ready.then(scheduleFit)
    document.fonts.addEventListener('loadingdone', scheduleFit)
    return () => {
      active = false
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', scheduleFit)
    }
  }, [name])
  return <Heading ref={headingRef} className={`perfume-name ${className}`} dir="auto" title={name}><span ref={textRef}>{children || name}</span></Heading>
}

function App() {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('arven-language')
      return Object.hasOwn(translations, saved) ? saved : 'tr'
    } catch { return 'tr' }
  })
  const t = translations[lang]
  const locale = locales[lang]
  const [genders, setGenders] = useState([])
  const [selectedNotes, setSelectedNotes] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [selected, setSelected] = useState(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState(null)
  const [quizDraft, setQuizDraft] = useState(emptyQuizAnswers)
  const [favorites, toggleFavorite] = useFavorites()
  const [showFavorites, setShowFavorites] = useState(false)
  const modalTriggerRef = useRef(null)
  const showNoteResultsRef = useRef(false)
  const quizResultsRef = useRef(null)
  const exchangeRate = useExchangeRate()
  const usdTry = exchangeRate.rate
  const rateStatus = exchangeRate.status
  const rateTitle = usdTry
    ? `${t.rateUpdated} · ${new Date(exchangeRate.updatedAt).toLocaleString(locale)}${exchangeRate.source ? ` · ${exchangeRate.source}` : ''}${exchangeRate.rateDate ? ` · ${exchangeRate.rateDate}` : ''}`
    : rateStatus === 'loading' ? t.rateLoading : t.rateUnavailable

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = lang === 'tr' ? 'Arven — Parfüm keşif günlüğü' : lang === 'ar' ? 'أرفين — يوميات اكتشاف العطور' : 'Arven — Fragrance discovery journal'
    try { localStorage.setItem('arven-language', lang) } catch { /* Storage may be unavailable in private browsing. */ }
  }, [lang])

  const localizedPerfumes = useMemo(() => perfumes.map(p => localizePerfume(p, lang)), [lang])
  const noteOptions = useMemo(() => {
    const options = new Map()
    localizedPerfumes.forEach(perfume => perfume.noteKeys.forEach((key, index) => {
      const current = options.get(key)
      if (current) current.count += 1
      else options.set(key, { key, label: perfume.notes[index], count: 1 })
    }))
    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, locale))
  }, [localizedPerfumes, locale])
  const noteLabels = useMemo(() => new Map(noteOptions.map(note => [note.key, note.label])), [noteOptions])
  const filtered = useMemo(() => filterPerfumes(localizedPerfumes, {
    genders, notes: selectedNotes, query, favorites, onlyFavorites: showFavorites, sort, locale
  }), [genders, selectedNotes, query, sort, showFavorites, favorites, localizedPerfumes, locale])
  const filterCount = genders.length + selectedNotes.length
  const toggleGender = key => setGenders(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key])
  const toggleNote = key => setSelectedNotes(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key])
  const clearFilters = () => {
    setGenders([])
    setSelectedNotes([])
    setQuery('')
    setShowFavorites(false)
  }
  const showFilteredResults = () => {
    setFilterOpen(false)
    requestAnimationFrame(() => {
      const results = document.getElementById('catalog-results')
      results?.scrollIntoView({ behavior: 'instant', block: 'start' })
      results?.focus({ preventScroll: true })
    })
  }
  const openNoteResults = key => {
    setGenders([])
    setSelectedNotes([key])
    setQuery('')
    setShowFavorites(false)
    setFilterOpen(false)
    modalTriggerRef.current = document.getElementById('catalog-results')
    showNoteResultsRef.current = true
    setSelected(null)
  }
  useEffect(() => {
    if (selected !== null || !showNoteResultsRef.current) return
    showNoteResultsRef.current = false
    const frame = requestAnimationFrame(() => {
      const results = document.getElementById('catalog-results')
      results?.scrollIntoView({ behavior: 'instant', block: 'start' })
      results?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [selected])

  const openPerfume = id => {
    modalTriggerRef.current = document.activeElement
    setSelected(id)
  }
  const openQuiz = () => {
    setQuizOpen(true)
  }
  const quizText = quizTranslations[lang]
  const recommendations = useMemo(() => {
    if (!quizAnswers) return []
    const contexts = {
      any: { time: 'any', occasion: 'any' },
      daily: { time: 'day', occasion: 'daily' },
      office: { time: 'day', occasion: 'office' },
      evening: { time: 'evening', occasion: 'any' },
      special: { time: 'any', occasion: 'special' }
    }
    return recommendPerfumes(localizedPerfumes, { ...quizAnswers, ...contexts[quizAnswers.context] })
  }, [localizedPerfumes, quizAnswers])
  useEffect(() => {
    if (!quizAnswers) return
    const frame = requestAnimationFrame(() => {
      quizResultsRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
      quizResultsRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [quizAnswers])
  const selectedPerfume = localizedPerfumes.find(p => p.id === selected)
  const dialogOpen = Boolean(selectedPerfume) || quizOpen
  const toggleFavoriteFilter = () => setShowFavorites(current => !current)

  return <div className="app-shell">
    <header className="topbar" inert={dialogOpen}>
      <div className="topbar-inner">
        <a className="brand" href="#top" aria-label={t.home}><span className="brand-mark">A</span><span>ARVEN</span></a>
        <nav className="main-nav" aria-label={t.menu}><a href="#kesif">{t.discover}</a><a href="#notlar">{t.scentNotes}</a><a href="#hakkinda">{t.about}</a></nav>
        <div className="top-actions">
          <div className="language-flags" role="group" aria-label={t.language} dir="ltr">
            {languages.map(language => <button key={language.code} type="button" className={`language-button ${lang === language.code ? 'active' : ''}`} onClick={() => setLang(language.code)} aria-label={language.label} title={language.label} aria-pressed={lang === language.code}><Flag language={language.code}/></button>)}
          </div>
        </div>
      </div>
    </header>

    <main id="top" inert={dialogOpen}>
      <section className="hero" id="kesif">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"/> {t.journal}</p><PerfumeName as="h1" className="hero-heading" name={`${t.heroFirst} ${t.heroEmphasis} ${t.heroLast}`}>{t.heroFirst} <em>{t.heroEmphasis}</em> {t.heroLast}</PerfumeName><p className="hero-text">{t.heroText}</p><button type="button" className="primary-button" onClick={openQuiz} aria-haspopup="dialog">{quizText.title} <Icon name="spark" size={17}/></button></div>
        <div className="hero-art" aria-hidden="true"><div className="halo halo-one"/><div className="halo halo-two"/><div className="hero-bottle"><div className="hero-cap"/><div className="hero-glass"><span>ARVEN</span><small>EAU DE PARFUM</small><b>01</b></div></div></div>
      </section>

      {quizAnswers && <section className="quiz-results" ref={quizResultsRef} id="quiz-results" tabIndex={-1} aria-labelledby="quiz-results-title">
        <div className="quiz-results-heading"><div><p className="eyebrow">ARVEN / {quizText.title}</p><h2 id="quiz-results-title">{quizText.resultsTitle}</h2><p>{quizText.resultsIntro}</p></div><div className="quiz-results-actions"><button type="button" onClick={openQuiz}>{quizText.edit}</button><button type="button" onClick={() => { setQuizAnswers(null); document.querySelector('.hero .primary-button')?.focus({ preventScroll: true }) }}>{quizText.hideResults}</button></div></div>
        {recommendations.length > 0 ? <div className="perfume-grid">{recommendations.map(({ perfume, reasons }, index) => <div className="quiz-result-item" key={perfume.id}>
          <PerfumeCard perfume={perfume} index={index} favorite={favorites.includes(perfume.id)} onFavorite={() => toggleFavorite(perfume.id)} onOpen={() => openPerfume(perfume.id)} t={t} usdTry={usdTry} rateStatus={rateStatus}/>
          <div className="quiz-reasons"><small>{reasons.length ? quizText.matchLabel : quizText.styleLabel}</small><ul>{(reasons.length ? reasons : perfumeProfiles[perfume.name].styles.slice(0,2).map(value => ({ type: 'style', value }))).map(reason => <li key={`${reason.type}-${reason.value}`} title={quizText.reasonLabels[reason.type]}>{({ style: quizText.styles, season: quizText.seasons, time: quizText.times, occasion: quizText.occasions })[reason.type][reason.value]}</li>)}</ul>{perfumeProfiles[perfume.name].confidence === 'limited' && <p className="quiz-limited">{quizText.limitedNote}</p>}</div>
        </div>)}</div> : <div className="empty-state"><h3>{quizText.noResults}</h3><p>{quizText.noResultsHelp}</p><button className="primary-button" type="button" onClick={openQuiz}>{quizText.edit}</button></div>}
        <p className="quiz-result-note">{quizText.recommendationNote}</p>
      </section>}

      <section className="catalog-section" id="notlar">
        <div className="controls">
          <div className="category-tabs" role="group" aria-label={t.categoriesLabel}>
            {categories.map(c => {
              const active = c.key === 'Tümü' ? !genders.length && !showFavorites : genders.includes(c.key)
              return <button key={c.key} type="button" className={active ? 'active' : ''} onClick={() => {
                if (c.key === 'Tümü') clearFilters()
                else { setGenders([c.key]); setShowFavorites(false) }
              }} aria-pressed={active}>{t.categories[c.key]}<span>{c.count}</span></button>
            })}
          </div>
          <div className="favorites-row"><button type="button" className={`favorites-tab ${showFavorites ? 'active' : ''}`} onClick={toggleFavoriteFilter} aria-pressed={showFavorites}><Icon name="heart" size={16}/>{t.favorites}<span>{favorites.length}</span></button></div>
          <div className="filter-row">
            <label className="search-box"><Icon name="search" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/></label>
            <button type="button" className={`filter-toggle ${filterOpen ? 'active' : ''}`} onClick={() => setFilterOpen(current => !current)} aria-expanded={filterOpen} aria-controls="perfume-filters"><Icon name="filter" size={17}/>{t.filter}{filterCount > 0 && <span className="filter-count">{filterCount}</span>}</button>
            <label className="sort-box"><span>{t.sort}</span><select value={sort} onChange={e => setSort(e.target.value)} aria-label={t.sort}><option value="featured">{t.featured}</option><option value="name">{t.nameSort}</option><option value="price-asc">{t.priceLow}</option><option value="price-desc">{t.priceHigh}</option></select><Icon name="chevron" size={15}/></label>
          </div>
        </div>
        {filterOpen && <section className="filter-panel" id="perfume-filters" aria-label={t.filters}>
          <div className="filter-panel-heading"><div><h2>{t.filters}</h2><p>{t.filterHelp}</p></div><button type="button" className="clear-button" onClick={clearFilters}>{t.clear}</button></div>
          <fieldset className="filter-group"><legend>{t.gender}</legend><div className="filter-options gender-options">{categories.filter(c => c.key !== 'Tümü').map(c => <label key={c.key} className="filter-option"><input type="checkbox" checked={genders.includes(c.key)} onChange={() => toggleGender(c.key)}/><span>{t.categories[c.key]}</span><small>{c.count}</small></label>)}</div></fieldset>
          <NoteMultiSelect options={noteOptions} selected={selectedNotes} onToggle={toggleNote} t={t}/>
          <button type="button" className="primary-button filter-done" onClick={showFilteredResults}>{t.showResults} <span>{filtered.length}</span><Icon name="arrow" size={16}/></button>
        </section>}
        {filterCount > 0 && <div className="active-filters" aria-label={t.activeFilters}>{genders.map(gender => <button key={gender} type="button" className="filter-chip" onClick={() => toggleGender(gender)} aria-label={`${t.removeFilter}: ${t.categories[gender]}`}>{t.categories[gender]}<Icon name="close" size={12}/></button>)}{selectedNotes.map(key => <button key={key} type="button" className="filter-chip" onClick={() => toggleNote(key)} aria-label={`${t.removeFilter}: ${noteLabels.get(key)}`}>{noteLabels.get(key)}<Icon name="close" size={12}/></button>)}</div>}
        <div className="result-meta" id="catalog-results" tabIndex={-1}><span aria-live="polite">{showFavorites ? t.favoriteCollection : t.perfumes} <strong>{filtered.length}</strong></span><span className="rate-info" title={rateTitle} aria-live="polite">{usdTry ? <bdi dir="ltr">{`${t.usdRate} = ${usdTry.toFixed(2)} ${t.tryCurrency}`}</bdi> : rateStatus === 'loading' ? t.rateLoading : t.rateUnavailable}<small>{rateStatus === 'stale' ? t.rateStale : usdTry ? t.hourly : ''}</small></span>{(query || showFavorites || filterCount > 0) && <button className="clear-button" onClick={clearFilters}>{t.clear}</button>}</div>
        {filtered.length > 0 ? <div className="perfume-grid">{filtered.map((p, i) => <PerfumeCard key={p.id} perfume={p} index={i} favorite={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} onOpen={() => openPerfume(p.id)} t={t} usdTry={usdTry} rateStatus={rateStatus}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={25}/></span><h3>{t.noResults}</h3><p>{t.noResultsText}</p><button className="text-button" onClick={clearFilters}>{t.showAll} <Icon name="arrow" size={16}/></button></div>}
      </section>
    </main>

    <footer id="hakkinda" inert={dialogOpen}><div className="footer-brand"><span className="brand-mark">A</span><div><strong>ARVEN</strong><p>{t.tagline}</p></div></div><p>{t.footerText}</p><span className="footer-copy" dir="ltr">© {new Date().getFullYear()} Arven</span></footer>
    {quizOpen && <PerfumeQuiz lang={lang} initialAnswers={quizDraft} onClose={answers => { setQuizDraft(answers); setQuizOpen(false) }} onComplete={answers => { setQuizDraft(answers); setQuizAnswers(answers); setQuizOpen(false) }}/>} 
    {selectedPerfume && <DetailModal perfume={selectedPerfume} favorite={favorites.includes(selectedPerfume.id)} onFavorite={() => toggleFavorite(selectedPerfume.id)} onNote={openNoteResults} onClose={() => setSelected(null)} triggerRef={modalTriggerRef} t={t} usdTry={usdTry} rateStatus={rateStatus}/>} 
  </div>
}

function Price({ perfume, usdTry, t, rateStatus, className = '' }) {
  const tlPrice = Number.isFinite(usdTry) && usdTry > 0
    ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(perfume.priceUsd * usdTry)} TL`
    : null
  return <div className={`product-price ${className}`} aria-label={t.price}>
    <div className="price-amounts" dir="ltr">
      <strong className="price-usd">{`$${perfume.priceUsd}`}</strong>
      {tlPrice && <><span className="price-separator">/</span><span className="price-tl">≈ {tlPrice}</span></>}
    </div>
    {!tlPrice && <small className="price-pending">{rateStatus === 'loading' ? t.rateLoading : t.rateUnavailable}</small>}
  </div>
}

function PerfumeCard({ perfume, index, favorite, onFavorite, onOpen, t, usdTry, rateStatus }) {
  return <article className="perfume-card" style={{'--delay': `${Math.min(index * 25, 300)}ms`}}>
    <div className="card-image-wrap"><button className="card-image-button" type="button" onClick={onOpen} aria-label={`${perfume.name} — ${t.view}`}><img src={perfume.image} alt={`${perfume.name} — ${t.image}`} loading="lazy"/></button><span className={`gender-pill ${perfume.gender.toLowerCase()}`}>{perfume.genderLabel}</span><button className={`heart-button ${favorite ? 'liked' : ''}`} type="button" onClick={onFavorite} aria-label={favorite ? t.removeFavorite : t.addFavorite} aria-pressed={favorite}><Icon name="heart" size={17}/></button><button className="quick-view" type="button" onClick={onOpen} aria-label={`${perfume.name} — ${t.view}`}>{t.view} <Icon name="arrow" size={15}/></button></div>
    <div className="card-body">
      <div className="card-title-row"><div><p className="card-family">{perfume.family}</p><PerfumeName name={perfume.name}/></div></div>
      <Price perfume={perfume} usdTry={usdTry} t={t} rateStatus={rateStatus}/>
      <div className="note-row">{perfume.notes.slice(0,3).map(note => <span key={note}>{note}</span>)}</div>
    </div>
  </article>
}

function DetailModal({ perfume, favorite, onFavorite, onNote, onClose, triggerRef, t, usdTry, rateStatus }) {
  const modalRef = useRef(null)
  const closeRef = useRef(onClose)

  useLayoutEffect(() => { closeRef.current = onClose }, [onClose])

  useLayoutEffect(() => {
    const modal = modalRef.current
    const scrollY = window.scrollY
    const body = document.body
    const previousStyle = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight
    }
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth}px`
    Object.assign(body.style, { overflow: 'hidden', position: 'fixed', top: `-${scrollY}px`, width: '100%' })
    modal.querySelector('.modal-close').focus({ preventScroll: true })

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const controls = [...modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (!first) {
        event.preventDefault()
        modal.focus()
      } else if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      Object.assign(body.style, previousStyle)
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      requestAnimationFrame(() => {
        const target = triggerRef.current?.isConnected ? triggerRef.current : document.querySelector('.favorites-tab')
        target?.focus({ preventScroll: true })
      })
    }
  }, [triggerRef])

  return <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && onClose()}><div ref={modalRef} className="detail-modal" role="dialog" aria-modal="true" aria-label={perfume.name} aria-describedby={`perfume-description-${perfume.id}`} tabIndex={-1}><button className="modal-close" type="button" onClick={onClose} aria-label={t.close}><Icon name="close"/></button><div className="modal-image"><img src={perfume.image} alt=""/></div><div className="modal-content"><p className="eyebrow">{perfume.genderLabel} / {perfume.family}</p><PerfumeName name={perfume.name} as="h2"/><Price perfume={perfume} usdTry={usdTry} t={t} rateStatus={rateStatus} className="detail-price"/><p className="modal-description" id={`perfume-description-${perfume.id}`}>{perfume.description}</p><div className="detail-stats"><div><small>{t.sillage}</small><strong>{perfume.sillage}</strong></div></div><div className="notes-block"><small>{t.notes}</small><div>{perfume.notes.map((note, index) => <button key={perfume.noteKeys[index]} type="button" className="note-chip" onClick={() => onNote(perfume.noteKeys[index])} aria-label={`${note} — ${t.showMatchingPerfumes}`}>{note}</button>)}</div></div><button className={`save-button ${favorite ? 'saved' : ''}`} type="button" onClick={onFavorite} aria-pressed={favorite}><Icon name={favorite ? 'bookmark' : 'heart'} size={17}/>{favorite ? t.saved : t.addFavorite}</button></div></div></div>
}

createRoot(document.getElementById('root')).render(<App />)

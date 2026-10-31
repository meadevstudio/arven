import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { categories, perfumes } from './data.js'
import { locales, localizePerfume, translations } from './i18n.js'
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
    bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-3-6 3Z"/>
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

function PerfumeName({ name, as: Heading = 'h3' }) {
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
  return <Heading ref={headingRef} className="perfume-name" dir="auto" title={name}><span ref={textRef}>{name}</span></Heading>
}

function App() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('arven-language') in translations ? localStorage.getItem('arven-language') : 'tr' } catch { return 'tr' }
  })
  const t = translations[lang]
  const locale = locales[lang]
  const [category, setCategory] = useState('Tümü')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [selected, setSelected] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [showFavorites, setShowFavorites] = useState(false)
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

  const filtered = useMemo(() => {
    let result = localizedPerfumes.filter(p => {
      const matchesCategory = category === 'Tümü' || p.gender === category
      const needle = query.toLocaleLowerCase(locale).trim()
      const matchesQuery = !needle || [p.name, p.family, ...p.notes].join(' ').toLocaleLowerCase(locale).includes(needle)
      const matchesFavorites = !showFavorites || favorites.includes(p.id)
      return matchesCategory && matchesQuery && matchesFavorites
    })
    if (sort === 'name') result = [...result].sort((a,b) => a.name.localeCompare(b.name, locale))
    return result
  }, [category, query, sort, showFavorites, favorites, localizedPerfumes, locale])

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const randomPick = () => setSelected(perfumes[Math.floor(Math.random() * perfumes.length)].id)
  const selectedPerfume = localizedPerfumes.find(p => p.id === selected)

  return <div className="app-shell">
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#top" aria-label={t.home}><span className="brand-mark">A</span><span>ARVEN</span></a>
        <nav className="main-nav" aria-label={t.menu}><a className="active" href="#kesif">{t.discover}</a><a href="#notlar">{t.scentNotes}</a><a href="#hakkinda">{t.about}</a></nav>
        <div className="top-actions">
          <button className={`icon-button ${showFavorites ? 'selected' : ''}`} onClick={() => setShowFavorites(!showFavorites)} aria-label={t.favorites} aria-pressed={showFavorites}><Icon name="heart"/><span className="favorite-count">{favorites.length || ''}</span></button>
          <div className="language-flags" role="group" aria-label={t.language} dir="ltr">
            {languages.map(language => <button key={language.code} type="button" className={`language-button ${lang === language.code ? 'active' : ''}`} onClick={() => setLang(language.code)} aria-label={language.label} title={language.label} aria-pressed={lang === language.code}><Flag language={language.code}/></button>)}
          </div>
        </div>
      </div>
    </header>

    <main id="top">
      <section className="hero" id="kesif">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"/> {t.journal}</p><h1>{t.heroFirst}<br/><em>{t.heroEmphasis}</em> {t.heroLast}</h1><p className="hero-text">{t.heroText}</p><button className="primary-button" onClick={randomPick}>{t.lucky} <Icon name="spark" size={17}/></button></div>
        <div className="hero-art" aria-hidden="true"><div className="halo halo-one"/><div className="halo halo-two"/><div className="hero-bottle"><div className="hero-cap"/><div className="hero-glass"><span>ARVEN</span><small>EAU DE PARFUM</small><b>01</b></div></div><div className="hero-caption"><span>01 / 03</span><span>{t.selection}</span></div></div>
      </section>

      <section className="catalog-section" id="notlar">
        <div className="section-heading"><div><p className="eyebrow">{t.library}</p><h2>{t.headingFirst} <em>{t.headingEmphasis}</em> {t.headingLast}</h2></div><p className="section-intro">{t.intro}</p></div>
        <div className="controls"><div className="category-tabs" role="tablist" aria-label={t.library}>{categories.map(c => <button key={c.key} className={category === c.key ? 'active' : ''} onClick={() => {setCategory(c.key); setShowFavorites(false)}} role="tab" aria-selected={category === c.key}>{t.categories[c.key]}<span>{c.count}</span></button>)}</div><div className="filter-row"><label className="search-box"><Icon name="search" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/></label><label className="sort-box"><span>{t.sort}</span><select value={sort} onChange={e => setSort(e.target.value)} aria-label={t.sort}><option value="featured">{t.featured}</option><option value="name">{t.nameSort}</option></select><Icon name="chevron" size={15}/></label></div></div>
        <div className="result-meta"><span>{showFavorites ? t.favoriteCollection : t.categories[category]} <strong>{filtered.length}</strong></span><span className="rate-info" title={rateTitle} aria-live="polite">{usdTry ? `${t.usdRate} = ${usdTry.toFixed(2)} ${t.tryCurrency}` : rateStatus === 'loading' ? t.rateLoading : t.rateUnavailable}<small>{rateStatus === 'stale' ? t.rateStale : usdTry ? t.hourly : ''}</small></span>{(query || showFavorites) && <button className="clear-button" onClick={() => {setQuery('');setShowFavorites(false)}}>{t.clear}</button>}</div>
        {filtered.length > 0 ? <div className="perfume-grid">{filtered.map((p, i) => <PerfumeCard key={p.id} perfume={p} index={i} favorite={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} onOpen={() => setSelected(p.id)} t={t} usdTry={usdTry} rateStatus={rateStatus}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={25}/></span><h3>{t.noResults}</h3><p>{t.noResultsText}</p><button className="text-button" onClick={() => {setQuery('');setShowFavorites(false)}}>{t.showAll} <Icon name="arrow" size={16}/></button></div>}
      </section>
    </main>

    <footer id="hakkinda"><div className="footer-brand"><span className="brand-mark">A</span><div><strong>ARVEN</strong><p>{t.tagline}</p></div></div><p>{t.footerText}</p><span className="footer-copy" dir="ltr">© {new Date().getFullYear()} Arven</span></footer>
    {selectedPerfume && <DetailModal perfume={selectedPerfume} favorite={favorites.includes(selectedPerfume.id)} onFavorite={() => toggleFavorite(selectedPerfume.id)} onClose={() => setSelected(null)} t={t} usdTry={usdTry} rateStatus={rateStatus}/>} 
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
    <div className="card-image-wrap"><img src={perfume.image} alt={`${perfume.name} — ${t.image}`} loading="lazy"/><span className={`gender-pill ${perfume.gender.toLowerCase()}`}>{perfume.genderLabel}</span><button className={`heart-button ${favorite ? 'liked' : ''}`} onClick={onFavorite} aria-label={favorite ? t.removeFavorite : t.addFavorite} aria-pressed={favorite}><Icon name="heart" size={17}/></button><button className="quick-view" onClick={onOpen}>{t.view} <Icon name="arrow" size={15}/></button></div>
    <div className="card-body">
      <div className="card-title-row"><div><p className="card-family">{perfume.family}</p><PerfumeName name={perfume.name}/></div></div>
      <Price perfume={perfume} usdTry={usdTry} t={t} rateStatus={rateStatus}/>
      <div className="note-row">{perfume.notes.slice(0,3).map(note => <span key={note}>{note}</span>)}</div>
    </div>
  </article>
}

function DetailModal({ perfume, favorite, onFavorite, onClose, t, usdTry, rateStatus }) {
  useEffect(() => {
    const closeOnEscape = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previousOverflow }
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="detail-modal" role="dialog" aria-modal="true" aria-label={perfume.name}><button className="modal-close" onClick={onClose} aria-label={t.close} autoFocus><Icon name="close"/></button><div className="modal-image"><img src={perfume.image} alt=""/></div><div className="modal-content"><p className="eyebrow">{perfume.genderLabel} / {perfume.family}</p><PerfumeName name={perfume.name} as="h2"/><Price perfume={perfume} usdTry={usdTry} t={t} rateStatus={rateStatus} className="detail-price"/><p className="modal-description">{perfume.description}</p><div className="detail-stats"><div><small>{t.sillage}</small><strong>{perfume.sillage}</strong></div></div><div className="notes-block"><small>{t.notes}</small><div>{perfume.notes.map(note => <span key={note}>{note}</span>)}</div></div><button className={`save-button ${favorite ? 'saved' : ''}`} onClick={onFavorite}><Icon name={favorite ? 'bookmark' : 'heart'} size={17}/>{favorite ? t.saved : t.addFavorite}</button></div></div></div>
}

createRoot(document.getElementById('root')).render(<App />)

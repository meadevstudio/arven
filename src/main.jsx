import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { categories, perfumes } from './data'
import { locales, localizePerfume, translations } from './i18n'
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
  const [usdTry, setUsdTry] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('arven-usdtry') || 'null')
      return Number.isFinite(cached?.rate) ? cached.rate : null
    } catch { return null }
  })
  const [rateStatus, setRateStatus] = useState('loading')
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = lang === 'tr' ? 'Arven — Parfüm keşif günlüğü' : lang === 'ar' ? 'أرفين — يوميات اكتشاف العطور' : 'Arven — Fragrance discovery journal'
    try { localStorage.setItem('arven-language', lang) } catch { /* Storage may be unavailable in private browsing. */ }
  }, [lang])

  useEffect(() => {
    let cancelled = false
    const refreshRate = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY')
        if (!response.ok) throw new Error('Exchange rate request failed')
        const payload = await response.json()
        const nextRate = Number(payload?.rates?.TRY)
        if (!Number.isFinite(nextRate) || nextRate <= 0) throw new Error('Invalid exchange rate')
        if (cancelled) return
        setUsdTry(nextRate)
        setRateStatus('live')
        setRateUpdatedAt(new Date())
        try { localStorage.setItem('arven-usdtry', JSON.stringify({ rate: nextRate, updatedAt: Date.now() })) } catch { /* Storage may be unavailable. */ }
      } catch {
        if (!cancelled) setRateStatus(usdTry ? 'stale' : 'unavailable')
      }
    }
    refreshRate()
    const interval = window.setInterval(refreshRate, 60 * 60 * 1000)
    return () => { cancelled = true; window.clearInterval(interval) }
  }, [])

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
        <div className="top-actions"><button className={`icon-button ${showFavorites ? 'selected' : ''}`} onClick={() => setShowFavorites(!showFavorites)} aria-label={t.favorites} aria-pressed={showFavorites}><Icon name="heart"/><span className="favorite-count">{favorites.length || ''}</span></button><label className="language-select"><select value={lang} onChange={e => setLang(e.target.value)} aria-label={t.language} dir="ltr"><option value="tr">Türkçe</option><option value="en">English</option><option value="ar">العربية</option></select><Icon name="chevron" size={14}/></label></div>
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
        <div className="result-meta"><span>{showFavorites ? t.favoriteCollection : t.categories[category]} <strong>{filtered.length}</strong></span><span className="rate-info" title={rateUpdatedAt ? `${t.rateUpdated} · ${rateUpdatedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : t.rateLoading}>{usdTry ? `${t.usdRate} = ${usdTry.toFixed(2)} TRY` : rateStatus === 'unavailable' ? t.rateUnavailable : t.rateLoading}<small>{t.hourly}</small></span>{(query || showFavorites) && <button className="clear-button" onClick={() => {setQuery('');setShowFavorites(false)}}>{t.clear}</button>}</div>
        {filtered.length > 0 ? <div className="perfume-grid">{filtered.map((p, i) => <PerfumeCard key={p.id} perfume={p} index={i} favorite={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} onOpen={() => setSelected(p.id)} t={t} usdTry={usdTry}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={25}/></span><h3>{t.noResults}</h3><p>{t.noResultsText}</p><button className="text-button" onClick={() => {setQuery('');setShowFavorites(false)}}>{t.showAll} <Icon name="arrow" size={16}/></button></div>}
      </section>
    </main>

    <footer id="hakkinda"><div className="footer-brand"><span className="brand-mark">A</span><div><strong>ARVEN</strong><p>{t.tagline}</p></div></div><p>{t.footerText}</p><span className="footer-copy" dir="ltr">© {new Date().getFullYear()} Arven</span></footer>
    {selectedPerfume && <DetailModal perfume={selectedPerfume} favorite={favorites.includes(selectedPerfume.id)} onFavorite={() => toggleFavorite(selectedPerfume.id)} onClose={() => setSelected(null)} t={t} usdTry={usdTry}/>} 
  </div>
}

function formatTryPrice(usd, usdTry) {
  if (!Number.isFinite(usdTry)) return '₺—'
  return `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(usd * usdTry)}`
}

function PerfumeCard({ perfume, index, favorite, onFavorite, onOpen, t, usdTry }) {
  return <article className="perfume-card" style={{'--delay': `${Math.min(index * 25, 300)}ms`}}><div className="card-image-wrap"><img src={perfume.image} alt={`${perfume.name} — ${t.image}`} loading="lazy"/><span className={`gender-pill ${perfume.gender.toLowerCase()}`}>{perfume.genderLabel}</span><button className={`heart-button ${favorite ? 'liked' : ''}`} onClick={onFavorite} aria-label={favorite ? t.removeFavorite : t.addFavorite} aria-pressed={favorite}><Icon name="heart" size={17}/></button><button className="quick-view" onClick={onOpen}>{t.view} <Icon name="arrow" size={15}/></button></div><div className="card-body"><div className="card-title-row"><div><p className="card-family">{perfume.family}</p><h3 dir="auto">{perfume.name}</h3></div></div><div className="note-row">{perfume.notes.slice(0,3).map(note => <span key={note}>{note}</span>)}</div><div className="price-row" aria-label={`${t.price}: $${perfume.priceUsd}`}><strong>${perfume.priceUsd}</strong><span>≈</span><b>{formatTryPrice(perfume.priceUsd, usdTry)}</b></div></div></article>
}

function DetailModal({ perfume, favorite, onFavorite, onClose, t, usdTry }) {
  useEffect(() => {
    const closeOnEscape = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previousOverflow }
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="detail-modal" role="dialog" aria-modal="true" aria-label={perfume.name}><button className="modal-close" onClick={onClose} aria-label={t.close} autoFocus><Icon name="close"/></button><div className="modal-image"><img src={perfume.image} alt=""/></div><div className="modal-content"><p className="eyebrow">{perfume.genderLabel} / {perfume.family}</p><h2 dir="auto">{perfume.name}</h2><div className="modal-price"><strong>${perfume.priceUsd}</strong><span>≈</span><b>{formatTryPrice(perfume.priceUsd, usdTry)}</b><small>{t.estimatedPrice}</small></div><p className="modal-description">{perfume.description}</p><div className="detail-stats"><div><small>{t.sillage}</small><strong>{perfume.sillage}</strong></div></div><div className="notes-block"><small>{t.notes}</small><div>{perfume.notes.map(note => <span key={note}>{note}</span>)}</div></div><button className={`save-button ${favorite ? 'saved' : ''}`} onClick={onFavorite}><Icon name={favorite ? 'bookmark' : 'heart'} size={17}/>{favorite ? t.saved : t.addFavorite}</button></div></div></div>
}

createRoot(document.getElementById('root')).render(<App />)

import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { categories, perfumes } from './data'
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
  const [category, setCategory] = useState('Tümü')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Öne çıkanlar')
  const [selected, setSelected] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [showFavorites, setShowFavorites] = useState(false)

  const filtered = useMemo(() => {
    let result = perfumes.filter(p => {
      const matchesCategory = category === 'Tümü' || p.gender === category
      const needle = query.toLocaleLowerCase('tr-TR').trim()
      const matchesQuery = !needle || [p.name, p.family, ...p.notes].join(' ').toLocaleLowerCase('tr-TR').includes(needle)
      const matchesFavorites = !showFavorites || favorites.includes(p.id)
      return matchesCategory && matchesQuery && matchesFavorites
    })
    if (sort === 'En yüksek puan') result = [...result].sort((a,b) => b.rating - a.rating)
    if (sort === 'İsim (A–Z)') result = [...result].sort((a,b) => a.name.localeCompare(b.name, 'tr'))
    return result
  }, [category, query, sort, showFavorites, favorites])

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const randomPick = () => setSelected(perfumes[Math.floor(Math.random() * perfumes.length)])

  return <div className="app-shell">
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#top" aria-label="Arven ana sayfa"><span className="brand-mark">A</span><span>ARVEN</span></a>
        <nav className="main-nav" aria-label="Ana menü"><a className="active" href="#kesif">Keşfet</a><a href="#notlar">Koku notları</a><a href="#hakkinda">Arven hakkında</a></nav>
        <div className="top-actions"><button className={`icon-button ${showFavorites ? 'selected' : ''}`} onClick={() => setShowFavorites(!showFavorites)} aria-label="Favoriler"><Icon name="heart"/><span className="favorite-count">{favorites.length || ''}</span></button><button className="profile-button" aria-label="Profil"><span>AK</span></button></div>
      </div>
    </header>

    <main id="top">
      <section className="hero" id="kesif">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"/> KOKU GÜNLÜĞÜ</p><h1>Kendine ait<br/><em>bir iz</em> bul.</h1><p className="hero-text">Arven, kokuları sadece notalarıyla değil; bıraktığı his, anı ve karakteriyle keşfetmen için tasarlandı.</p><button className="primary-button" onClick={randomPick}>Şanslı kokuyu bul <Icon name="spark" size={17}/></button></div>
        <div className="hero-art"><div className="halo halo-one"/><div className="halo halo-two"/><div className="hero-bottle"><div className="hero-cap"/><div className="hero-glass"><span>ARVEN</span><small>EAU DE PARFUM</small><b>01</b></div></div><div className="hero-caption"><span>01 / 03</span><span>SEÇKİ 2025</span></div></div>
      </section>

      <section className="catalog-section" id="notlar">
        <div className="section-heading"><div><p className="eyebrow">KOKU KÜTÜPHANESİ</p><h2>Bugün ne <em>hissetmek</em> istersin?</h2></div><p className="section-intro">Koku ailelerine göre düzenlenmiş, editör seçkimizden sana uygun imzayı bul.</p></div>
        <div className="controls"><div className="category-tabs" role="tablist">{categories.map(c => <button key={c.key} className={category === c.key ? 'active' : ''} onClick={() => {setCategory(c.key); setShowFavorites(false)}} role="tab" aria-selected={category === c.key}>{c.label}<span>{c.count}</span></button>)}</div><div className="filter-row"><label className="search-box"><Icon name="search" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Parfüm veya nota ara" aria-label="Parfüm veya nota ara"/></label><label className="sort-box"><span>Sırala</span><select value={sort} onChange={e => setSort(e.target.value)}><option>Öne çıkanlar</option><option>En yüksek puan</option><option>İsim (A–Z)</option></select><Icon name="chevron" size={15}/></label></div></div>
        <div className="result-meta"><span>{showFavorites ? 'Favori seçkin' : category === 'Tümü' ? 'Tüm seçki' : category} <strong>{filtered.length}</strong></span>{(query || showFavorites) && <button className="clear-button" onClick={() => {setQuery('');setShowFavorites(false)}}>Filtreleri temizle</button>}</div>
        {filtered.length > 0 ? <div className="perfume-grid">{filtered.map((p, i) => <PerfumeCard key={p.id} perfume={p} index={i} favorite={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} onOpen={() => setSelected(p)}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={25}/></span><h3>Koku bulunamadı</h3><p>Başka bir isim, nota veya kategori deneyebilirsin.</p><button className="text-button" onClick={() => {setQuery('');setShowFavorites(false)}}>Tüm kokuları göster <Icon name="arrow" size={16}/></button></div>}
      </section>
    </main>

    <footer id="hakkinda"><div className="footer-brand"><span className="brand-mark">A</span><div><strong>ARVEN</strong><p>Kokunun sende kalan hali.</p></div></div><p>Seçkiler, notlar ve kişisel keşifler için<br/>tasarlandı.</p><span className="footer-copy">© 2025 Arven</span></footer>
    {selected && <DetailModal perfume={selected} favorite={favorites.includes(selected.id)} onFavorite={() => toggleFavorite(selected.id)} onClose={() => setSelected(null)}/>} 
  </div>
}

function PerfumeCard({ perfume, index, favorite, onFavorite, onOpen }) {
  return <article className="perfume-card" style={{'--delay': `${Math.min(index * 25, 300)}ms`}}><div className="card-image-wrap"><img src={perfume.image} alt={`${perfume.name} parfüm görseli`} /><span className={`gender-pill ${perfume.gender.toLowerCase()}`}>{perfume.gender}</span><button className={`heart-button ${favorite ? 'liked' : ''}`} onClick={onFavorite} aria-label={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}><Icon name="heart" size={17}/></button><button className="quick-view" onClick={onOpen}>İncele <Icon name="arrow" size={15}/></button></div><div className="card-body"><div className="card-title-row"><div><p className="card-family">{perfume.family}</p><h3>{perfume.name}</h3></div><span className="rating"><span>★</span>{perfume.rating.toFixed(1)}</span></div><div className="note-row">{perfume.notes.slice(0,3).map(note => <span key={note}>{note}</span>)}</div></div></article>
}

function DetailModal({ perfume, favorite, onFavorite, onClose }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="detail-modal" role="dialog" aria-modal="true" aria-label={perfume.name}><button className="modal-close" onClick={onClose} aria-label="Kapat"><Icon name="close"/></button><div className="modal-image"><img src={perfume.image} alt=""/></div><div className="modal-content"><p className="eyebrow">{perfume.gender.toUpperCase()} / {perfume.family.toUpperCase()}</p><h2>{perfume.name}</h2><div className="modal-rating"><span>★</span><b>{perfume.rating.toFixed(1)}</b><span className="muted">Arven editör puanı</span></div><p className="modal-description">{perfume.description}</p><div className="detail-stats"><div><small>KALICILIK</small><strong>{perfume.longevity}</strong></div><div><small>YAYILIM</small><strong>{perfume.sillage}</strong></div></div><div className="notes-block"><small>KOKU NOTALARI</small><div>{perfume.notes.map(note => <span key={note}>{note}</span>)}</div></div><button className={`save-button ${favorite ? 'saved' : ''}`} onClick={onFavorite}><Icon name={favorite ? 'bookmark' : 'heart'} size={17}/>{favorite ? 'Favorilerde' : 'Favorilere ekle'}</button></div></div></div>
}

createRoot(document.getElementById('root')).render(<App />)

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { normalizeSearch } from './catalog.js'
import './note-multiselect.css'

export default function NoteMultiSelect({ options, selected, onToggle, t }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const id = useId()
  const labelId = `${id}-label`
  const triggerId = `${id}-trigger`
  const panelId = `${id}-panel`
  const selectedKeys = useMemo(() => new Set(selected), [selected])
  const visibleOptions = useMemo(() => {
    const needle = normalizeSearch(search).trim()
    return options.filter(option => !needle || normalizeSearch(`${option.label} ${option.key}`).includes(needle))
  }, [options, search])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus({ preventScroll: true })
    const closeOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside, true)
    return () => document.removeEventListener('pointerdown', closeOutside, true)
  }, [open])

  const toggleOpen = () => {
    if (!open) setSearch('')
    setOpen(current => !current)
  }

  const handleKeyDown = event => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    event.stopPropagation()
    setOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }

  const handleBlur = event => {
    if (event.relatedTarget) {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      return
    }
    // Tab may move into browser chrome, where relatedTarget is null.
    requestAnimationFrame(() => {
      if (!rootRef.current?.contains(document.activeElement)) setOpen(false)
    })
  }

  return <div className="note-multiselect" ref={rootRef} onKeyDown={handleKeyDown} onBlur={handleBlur}>
    <div className="note-multiselect-row">
      <span className="note-multiselect-label" id={labelId}>{t.notes}</span>
      <button
        className={`note-multiselect-trigger ${open ? 'is-open' : ''}`}
        id={triggerId}
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${labelId} ${triggerId}`}
        onClick={toggleOpen}
      >
        <span className="note-multiselect-value">{selected.length ? `${selected.length} ${selected.length === 1 ? t.selectedNote : t.selectedNotes}` : t.selectNotes}</span>
        <svg className="note-multiselect-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
    {open && <div className="note-multiselect-panel" id={panelId} role="group" aria-labelledby={labelId}>
      <label className="note-multiselect-search">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
        <input ref={searchRef} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={t.searchNotes} aria-label={t.searchNotes}/>
      </label>
      <div className="note-multiselect-options">
        {visibleOptions.map(option => <label className={`note-multiselect-option ${selectedKeys.has(option.key) ? 'is-selected' : ''}`} key={option.key}>
          <input type="checkbox" checked={selectedKeys.has(option.key)} onChange={() => onToggle(option.key)}/>
          <span>{option.label}</span>
          <small aria-hidden="true">{option.count}</small>
        </label>)}
        {!visibleOptions.length && <p className="note-multiselect-empty" role="status">{t.noNotes}</p>}
      </div>
    </div>}
  </div>
}

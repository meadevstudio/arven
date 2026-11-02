import React, { useLayoutEffect, useRef, useState } from 'react'
import { quizTranslations } from './quiz-i18n.js'
import './quiz.css'

export const emptyQuizAnswers = { gender: 'all', styles: [], season: 'any', context: 'any' }

const stepKeys = ['gender', 'styles', 'season', 'context']
const optionKeys = {
  gender: ['all', 'Erkek', 'Kadın', 'Unisex'],
  styles: ['fresh', 'sweet', 'floral', 'woody', 'dark', 'fruity'],
  season: ['any', 'spring', 'summer', 'autumn', 'winter'],
  context: ['any', 'daily', 'office', 'evening', 'special']
}
const optionMarks = {
  all: '◌', Erkek: '01', Kadın: '02', Unisex: '03',
  fresh: '◒', sweet: '◐', floral: '✳', woody: '≋', dark: '◆', fruity: '●',
  any: '◌', spring: '✳', summer: '☀', autumn: '≋', winter: '❄',
  daily: '☀', office: '▤', evening: '☾', special: '✧'
}

export default function PerfumeQuiz({ lang, initialAnswers, onClose, onComplete }) {
  const t = quizTranslations[lang]
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(() => ({ ...emptyQuizAnswers, ...initialAnswers, styles: [...(initialAnswers?.styles || [])] }))
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const closeRef = useRef(onClose)
  const current = stepKeys[step]
  const dictionary = { gender: t.genders, styles: t.styles, season: t.seasons, context: t.contexts }[current]
  const question = t.questions[current]

  useLayoutEffect(() => { closeRef.current = () => onClose(answers) }, [onClose, answers])
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const trigger = document.activeElement
    const body = document.body
    const scrollY = window.scrollY
    const previous = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width, paddingRight: body.style.paddingRight }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`
    Object.assign(body.style, { overflow: 'hidden', position: 'fixed', top: `-${scrollY}px`, width: '100%' })
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
      } else if (event.key === 'Tab') {
        const controls = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled])')].filter(el => el.getClientRects().length)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      Object.assign(body.style, previous)
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      requestAnimationFrame(() => {
        if (trigger?.isConnected) trigger.focus({ preventScroll: true })
      })
    }
  }, [])
  useLayoutEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
    dialogRef.current.scrollTop = 0
  }, [step])

  const selectOption = key => setAnswers(previous => {
    if (current !== 'styles') return { ...previous, [current]: key }
    return { ...previous, styles: previous.styles.includes(key) ? previous.styles.filter(value => value !== key) : [...previous.styles, key] }
  })

  return <div className="quiz-backdrop" onClick={event => event.target === event.currentTarget && onClose(answers)}>
    <div ref={dialogRef} className="quiz-dialog" role="dialog" aria-modal="true" aria-label={t.title} aria-describedby={step === 0 ? 'quiz-intro' : undefined}>
      <div className="quiz-topline"><span className="quiz-wordmark">ARVEN <span> / </span> {t.title}</span><button type="button" className="quiz-close" onClick={() => onClose(answers)} aria-label={t.close}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      {step === 0 && <p className="quiz-intro" id="quiz-intro">{t.intro}</p>}
      <div className="quiz-progress" role="progressbar" aria-label={t.step} aria-valuemin={1} aria-valuemax={stepKeys.length} aria-valuenow={step + 1} aria-valuetext={`${t.step} ${step + 1} / ${stepKeys.length}`}>
        {stepKeys.map((key, index) => <span key={key} aria-hidden="true" className={index <= step ? 'is-complete' : ''}/>)}
      </div>
      <div className="quiz-question-heading"><span className="quiz-step-label">{t.step} <bdi>{String(step + 1).padStart(2, '0')} / 04</bdi></span><h2 ref={titleRef} tabIndex={-1}>{question.title}</h2><p>{current === 'styles' ? t.multiHint : question.help}</p></div>
      <div className={`quiz-options quiz-options-${current}`} role="group" aria-label={question.title}>
        {optionKeys[current].map(key => {
          const checked = current === 'styles' ? answers.styles.includes(key) : answers[current] === key
          return <label className={`quiz-option ${checked ? 'is-selected' : ''}`} key={key}>
            <input type={current === 'styles' ? 'checkbox' : 'radio'} name={`quiz-${current}`} checked={checked} onChange={() => selectOption(key)}/>
            <span className={`quiz-option-mark mark-${key}`} aria-hidden="true">{optionMarks[key]}</span>
            <span className="quiz-option-label">{dictionary[key]}</span>
            <span className="quiz-option-check" aria-hidden="true">{checked ? '✓' : ''}</span>
          </label>
        })}
      </div>
      {current === 'styles' && <button type="button" className={`quiz-any ${!answers.styles.length ? 'is-selected' : ''}`} aria-pressed={!answers.styles.length} onClick={() => setAnswers(previous => ({ ...previous, styles: [] }))}>{t.any}</button>}
      <div className="quiz-navigation"><button type="button" className="quiz-back" disabled={step === 0} onClick={() => setStep(value => value - 1)}>{t.back}</button><button type="button" className="primary-button" onClick={() => step === stepKeys.length - 1 ? onComplete(answers) : setStep(value => value + 1)}>{step === stepKeys.length - 1 ? t.resultsAction : t.next}<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div>
    </div>
  </div>
}

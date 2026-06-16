import { useEffect, useState } from 'react'

function IconArrowUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

/**
 * Floating scroll-to-top button.
 * Appears after scrolling 400px, hidden via CSS data attribute so the
 * transition plays on both show and hide.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className="scroll-to-top"
      data-visible={visible ? 'true' : 'false'}
      onClick={handleClick}
      aria-label="Volver al inicio de la página"
      tabIndex={visible ? 0 : -1}
    >
      <IconArrowUp />
    </button>
  )
}

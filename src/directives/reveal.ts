import type { Directive } from 'vue'

const selector = '[data-reveal], [data-reveal-group] > *'
const cleanups = new WeakMap<HTMLElement, () => void>()

// Content stays visible by default, including in static HTML and without JS.
// Only elements entering the viewport receive a short, one-time animation.
export const vReveal: Directive<HTMLElement> = {
  mounted(root) {
    if (!('IntersectionObserver' in window)) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const seen = new WeakSet<Element>()
    const observed = new Set<Element>()
    const active = new Set<HTMLElement>()
    let observer: IntersectionObserver | undefined
    let mutations: MutationObserver | undefined
    let frame = 0

    function finish(element: HTMLElement) {
      element.classList.remove('is-revealing')
      element.style.removeProperty('--reveal-order')
      active.delete(element)
    }

    function stop() {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      observed.clear()
      mutations?.disconnect()
      active.forEach(finish)
    }

    function collect() {
      root.querySelectorAll<HTMLElement>(selector).forEach(element => {
        if (seen.has(element) || observed.has(element)) return
        observed.add(element)
        observer?.observe(element)
      })
    }

    function start() {
      stop()
      // Hash navigation should land directly on the requested passage.
      if (preference.matches || location.hash) return
      observer = new IntersectionObserver(entries => {
        let order = 0
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer?.unobserve(entry.target)
          observed.delete(entry.target)
          seen.add(entry.target)
          const element = entry.target as HTMLElement
          // Never hide a keyboard target, or replay on restored scroll positions.
          if (element.contains(document.activeElement) || entry.boundingClientRect.top < 0) continue
          element.style.setProperty('--reveal-order', String(Math.min(order++, 4)))
          element.classList.add('is-revealing')
          active.add(element)
        }
      }, { rootMargin: '0px 0px -16px 0px', threshold: 0 })
      // Wait until the router has restored scroll / resolved the new page.
      frame = requestAnimationFrame(() => {
        collect()
        mutations = new MutationObserver(collect)
        mutations.observe(root, { childList: true, subtree: true })
      })
    }

    function animationEnd(event: AnimationEvent) {
      if (event.animationName === 'content-reveal') finish(event.target as HTMLElement)
    }

    function focus(event: FocusEvent) {
      const target = event.target as HTMLElement
      // Mouse focus occurs between pointerdown and click. Finishing here would
      // move the link away from the pointer before the click can be dispatched.
      if (!target.matches(':focus-visible')) return
      active.forEach(element => { if (element.contains(target)) finish(element) })
    }

    function preferenceChange() {
      if (preference.matches) stop()
      else start()
    }

    root.addEventListener('animationend', animationEnd)
    root.addEventListener('focusin', focus)
    preference.addEventListener('change', preferenceChange)
    start()
    cleanups.set(root, () => {
      stop()
      root.removeEventListener('animationend', animationEnd)
      root.removeEventListener('focusin', focus)
      preference.removeEventListener('change', preferenceChange)
    })
  },
  beforeUnmount(root) {
    cleanups.get(root)?.()
    cleanups.delete(root)
  },
}

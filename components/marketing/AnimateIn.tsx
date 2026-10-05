'use client'
import { useEffect, useRef } from 'react'

export function AnimateIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => el.classList.add('ai-in'), delay)
          ob.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [delay])

  return <div ref={ref} className={`ai-out ${className}`}>{children}</div>
}

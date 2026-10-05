'use client'

const PARTICLES = [
  // [left%, top%, sizePx, maxOpacity, durationS, delayS, variant]
  // small = far/slow, large = close/fast  →  depth illusion
  [  4, 12,  4, 0.10, 16, 0.0, 'slow'   ],
  [ 18,  6,  5, 0.12, 14, 2.5, 'slow'   ],
  [ 32, 18,  4, 0.09, 17, 5.0, 'slow'   ],
  [ 10, 42,  5, 0.11, 15, 1.0, 'slow'   ],
  [ 44, 28,  4, 0.08, 18, 7.0, 'slow'   ],
  [  7, 62,  5, 0.10, 13, 3.5, 'slow'   ],

  [ 22, 10,  9, 0.18, 10, 1.5, 'medium' ],
  [ 38,  5,  8, 0.16, 11, 4.0, 'medium' ],
  [ 14, 35, 10, 0.20,  9, 0.5, 'medium' ],
  [ 48, 45,  8, 0.15, 12, 6.0, 'medium' ],
  [ 28, 58,  9, 0.17, 10, 2.0, 'medium' ],

  [  6, 22, 16, 0.28,  7, 0.0, 'fast'   ],
  [ 25, 38, 14, 0.25,  6, 3.0, 'fast'   ],
  [ 40, 14, 18, 0.30,  5, 1.0, 'fast'   ],
  [ 16, 55, 15, 0.26,  8, 4.5, 'fast'   ],
] as const

export function HeroParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {PARTICLES.map(([x, y, size, opacity, duration, delay, variant], i) => (
        <div
          key={i}
          className={`absolute rounded-full pdrift-${variant}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            backgroundColor: `rgba(255,255,255,${opacity})`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            animationIterationCount: 'infinite',
            animationFillMode: 'both',
          }}
        />
      ))}
    </div>
  )
}

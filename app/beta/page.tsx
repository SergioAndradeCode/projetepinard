'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const spotsLeft = 3

export default function BetaPage() {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/beta-contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main style={{ background: '#085041', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: '720px', width: '100%' }}>

        {/* Retour */}
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', marginBottom: '32px' }}
        >
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          Retour
        </Link>

        {/* Badge "Offre limitée" */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(93,202,165,0.12)',
            border: '0.5px solid #5DCAA5',
            borderRadius: '20px',
            padding: '5px 14px',
          }}>
            <span className="beta-pulse" style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#5DCAA5',
              display: 'inline-block',
            }} />
            <span style={{ color: '#9FE1CB', fontSize: '11px', letterSpacing: '1px' }}>
              OFFRE LIMITÉE
            </span>
          </div>
        </div>

        {/* Titre + compteur */}
        <div className="beta-hero">
          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 500, margin: '0 0 12px', lineHeight: 1.3 }}>
              On cherche 5 entreprises pour construire Talenth.fr avec nous
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', margin: 0, lineHeight: 1.7 }}>
              Pour les équipes RH qui gèrent l&apos;OETH au quotidien et ont envie de peser sur la suite.
            </p>
          </div>

          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <p style={{ color: '#9FE1CB', fontSize: '11px', margin: '0 0 4px', letterSpacing: '0.8px' }}>
              PLACES RESTANTES
            </p>
            <p style={{ color: 'white', fontSize: '48px', fontWeight: 500, margin: 0, lineHeight: 1 }}>
              {spotsLeft}<span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.35)' }}>/5</span>
            </p>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', marginTop: '8px', width: '80px', marginLeft: 'auto', marginRight: 'auto' }}>
              <div style={{
                height: '4px',
                background: '#5DCAA5',
                borderRadius: '2px',
                width: `${((5 - spotsLeft) / 5) * 100}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Cartes échange */}
        <div className="beta-cards" style={{ marginBottom: '28px' }}>

          {/* Ce qu'on demande */}
          <div style={{
            border: '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ color: '#9FE1CB', fontSize: '11px', fontWeight: 500, margin: '0 0 14px', letterSpacing: '0.8px' }}>
              CE QU&apos;ON VOUS DEMANDE
            </p>
            {[
              "Utiliser l'outil avec vos vraies données OETH",
              "Nous faire un retour honnête et régulier",
              "Être disponible pour en parler",
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < 2 ? '10px' : 0 }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#5DCAA5', marginTop: '7px', flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>

          {/* Ce qu'on offre */}
          <div style={{
            border: '2px solid #5DCAA5',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '-11px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#5DCAA5',
              color: '#04342C',
              fontSize: '10px',
              fontWeight: 600,
              padding: '3px 12px',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.5px',
            }}>
              VOTRE AVANTAGE
            </div>
            <p style={{ color: '#9FE1CB', fontSize: '11px', fontWeight: 500, margin: '0 0 14px', letterSpacing: '0.8px' }}>
              CE QUE VOUS OBTENEZ
            </p>
            {[
              { text: "Abonnement annuel divisé par 2", highlight: true },
              { text: "Accompagnement direct avec le fondateur", highlight: false },
              { text: "Vos retours intégrés dans le produit", highlight: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < 2 ? '10px' : 0 }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#5DCAA5', marginTop: '7px', flexShrink: 0 }} />
                <p style={{
                  color: item.highlight ? 'white' : 'rgba(255,255,255,0.7)',
                  fontWeight: item.highlight ? 500 : 400,
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: 1.5,
                }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '0 0 12px' }}>
            Intéressé ? Un message suffit.
          </p>

          {status === 'success' ? (
            <p style={{ color: '#5DCAA5', fontSize: '15px', fontWeight: 500, margin: 0 }}>
              On vous répond très vite !
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="beta-form">
              <input
                type="email"
                placeholder="Votre email professionnel"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '0.5px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '11px 16px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  background: '#5DCAA5',
                  color: '#04342C',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  height: '44px',
                  opacity: status === 'loading' ? 0.7 : 1,
                  flexShrink: 0,
                }}
              >
                {status === 'loading' ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '10px 0 0' }}>
              Une erreur est survenue. Écrivez-nous directement sur{' '}
              <a href="mailto:contact@talenth.fr" style={{ color: '#5DCAA5' }}>contact@talenth.fr</a>
            </p>
          )}

          {status !== 'error' && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '10px 0 0', textAlign: 'center' }}>
              Ou directement sur{' '}
              <a href="mailto:contact@talenth.fr" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                contact@talenth.fr
              </a>
            </p>
          )}
        </div>

      </div>
    </main>
  )
}

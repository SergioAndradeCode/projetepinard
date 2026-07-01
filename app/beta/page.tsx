'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle } from 'lucide-react'

const spotsLeft = 4
const totalSpots = 5
const filledPct  = ((totalSpots - spotsLeft) / totalSpots) * 100

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
    <div style={{ background: '#085041', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Barre top ──────────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 64px',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          Retour à talenth.fr
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image src="/logo.png" alt="Talenth" width={28} height={28} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', fontWeight: 600 }}>Talenth</span>
        </div>
      </header>

      {/* ── Corps principal ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }} className="beta-main-grid">

        {/* ── Colonne gauche ─────────────────────────────────────────── */}
        <div style={{ flex: '0 0 58%', padding: '72px 64px 72px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '0.5px solid rgba(255,255,255,0.08)' }} className="beta-left">

          {/* Badge */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '9px',
              background: 'rgba(93,202,165,0.10)', border: '0.5px solid rgba(93,202,165,0.5)',
              borderRadius: '20px', padding: '6px 16px',
            }}>
              <span className="beta-pulse" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#5DCAA5', display: 'inline-block' }} />
              <span style={{ color: '#9FE1CB', fontSize: '11px', letterSpacing: '1.5px', fontWeight: 600 }}>OFFRE LIMITÉE</span>
            </div>
          </div>

          {/* Titre */}
          <h1 style={{ color: '#ffffff', fontSize: '52px', fontWeight: 700, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.5px', maxWidth: '680px' }}>
            On cherche{' '}
            <span style={{ color: '#5DCAA5' }}>5 entreprises</span>{' '}
            pour construire Talenth.fr avec nous.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', lineHeight: 1.7, margin: '0 0 64px', maxWidth: '560px' }}>
            Pour les équipes RH qui gèrent l&apos;OETH au quotidien et ont envie de peser
            sur la suite du produit. Un accès réel, des retours pris au sérieux.
          </p>

          {/* Séparateur */}
          <div style={{ width: '40px', height: '2px', background: 'rgba(93,202,165,0.4)', marginBottom: '48px', borderRadius: '2px' }} />

          {/* Deux blocs échange */}
          <div className="beta-exchange-grid">

            {/* Ce qu'on demande */}
            <div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '1.2px', fontWeight: 600, margin: '0 0 20px', textTransform: 'uppercase' }}>
                Ce qu&apos;on vous demande
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  "Utiliser l'outil avec vos vraies données OETH",
                  "Nous faire un retour honnête et régulier",
                  "Être disponible pour en parler",
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid rgba(93,202,165,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(93,202,165,0.7)' }} />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ce qu'on offre */}
            <div>
              <p style={{ color: '#5DCAA5', fontSize: '11px', letterSpacing: '1.2px', fontWeight: 600, margin: '0 0 20px', textTransform: 'uppercase' }}>
                Ce que vous obtenez
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { text: "Abonnement annuel divisé par 2", strong: true },
                  { text: "Accompagnement direct avec le fondateur", strong: false },
                  { text: "Vos retours intégrés dans le produit", strong: false },
                ].map(({ text, strong }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#5DCAA5', flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ color: strong ? '#ffffff' : 'rgba(255,255,255,0.65)', fontWeight: strong ? 600 : 400, fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Colonne droite ─────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '72px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className="beta-right">
          <div style={{ width: '100%', maxWidth: '420px' }}>

            {/* Compteur */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '36px 40px',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              <p style={{ color: 'rgba(159,225,203,0.7)', fontSize: '11px', letterSpacing: '1.5px', fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase' }}>
                Places restantes
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '20px' }}>
                <span style={{ color: '#ffffff', fontSize: '80px', fontWeight: 700, lineHeight: 1, letterSpacing: '-2px' }}>{spotsLeft}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '32px', fontWeight: 400 }}>/{totalSpots}</span>
              </div>
              {/* Barre */}
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '6px', background: '#5DCAA5', borderRadius: '3px', width: `${filledPct}%`, transition: 'width 0.6s ease' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '10px 0 0' }}>
                {totalSpots - spotsLeft} entreprise{totalSpots - spotsLeft > 1 ? 's' : ''} déjà inscrite{totalSpots - spotsLeft > 1 ? 's' : ''}
              </p>
            </div>

            {/* Formulaire */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '32px 40px',
            }}>
              <p style={{ color: '#ffffff', fontSize: '17px', fontWeight: 600, margin: '0 0 6px' }}>
                Intéressé ?
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
                Laissez votre email, je vous répond personnellement sous 24h.
              </p>

              {status === 'success' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(93,202,165,0.1)', border: '0.5px solid rgba(93,202,165,0.4)', borderRadius: '12px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#5DCAA5', flexShrink: 0 }} />
                  <p style={{ color: '#9FE1CB', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                    Message reçu. On vous répond très vite !
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="email"
                    placeholder="votre@entreprise.fr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={status === 'loading'}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '0.5px solid rgba(255,255,255,0.18)',
                      borderRadius: '10px',
                      padding: '13px 16px',
                      color: '#ffffff',
                      fontSize: '15px',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleSubmit as unknown as React.MouseEventHandler}
                    type="button"
                    disabled={status === 'loading' || !email}
                    style={{
                      background: '#5DCAA5',
                      color: '#04342C',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px 0',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: (status === 'loading' || !email) ? 'not-allowed' : 'pointer',
                      opacity: (status === 'loading' || !email) ? 0.6 : 1,
                      width: '100%',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {status === 'loading' ? 'Envoi en cours...' : 'Rejoindre le programme bêta'}
                  </button>
                </div>
              )}

              {status === 'error' && (
                <p style={{ color: 'rgba(255,100,100,0.8)', fontSize: '13px', margin: '12px 0 0' }}>
                  Une erreur est survenue. Écrivez-nous à{' '}
                  <a href="mailto:contact@talenth.fr" style={{ color: '#5DCAA5' }}>contact@talenth.fr</a>
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px', paddingTop: '20px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>
                  ou directement sur{' '}
                  <a href="mailto:contact@talenth.fr" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                    contact@talenth.fr
                  </a>
                </p>
                <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

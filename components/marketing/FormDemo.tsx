'use client'

import { useState } from 'react'
import { Send, CheckCircle, Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function FormDemo() {
  const [nom,     setNom]     = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/demo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nom, email, message }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <div>
          <p className="font-bold text-[#1A1A2E] text-lg mb-1">Message envoyé !</p>
          <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs mx-auto">
            Je reviendrai vers vous rapidement pour convenir d&apos;un créneau.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="demo-nom" className="text-xs font-semibold text-[#1A1A2E]">
            Votre nom <span className="text-red-500">*</span>
          </label>
          <input
            id="demo-nom"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Marie Dupont"
            className="border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A2E] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/30 focus:border-[#1E4A8C] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="demo-email" className="text-xs font-semibold text-[#1A1A2E]">
            Votre email <span className="text-red-500">*</span>
          </label>
          <input
            id="demo-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="marie@entreprise.fr"
            className="border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A2E] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/30 focus:border-[#1E4A8C] transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="demo-message" className="text-xs font-semibold text-[#1A1A2E]">
          Votre message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="demo-message"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Dites-nous en quelques mots votre contexte : taille de l'entreprise, nombre de sites, ce que vous souhaitez voir lors de la démo..."
          className="border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A2E] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/30 focus:border-[#1E4A8C] transition-all resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          Une erreur est survenue. Vous pouvez aussi nous écrire directement à{' '}
          <a href="mailto:contact@talenth.fr" className="font-semibold underline">contact@talenth.fr</a>.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="self-start inline-flex items-center gap-2 bg-[#1E4A8C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#163870] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
        ) : (
          <><Send className="w-4 h-4" /> Envoyer ma demande</>
        )}
      </button>
    </form>
  )
}

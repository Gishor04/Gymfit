import { useState } from 'react'
import { WEB3FORMS_KEY } from '../config/emailjs'

const CONTACT_DETAILS = [
  { icon: '📍', label: 'Address', lines: ['Neervely South, Neervely'] },
  { icon: '📞', label: 'Phone',   lines: ['+94 78 859 0402'],          href: 'tel:+94788590402' },
  { icon: '📧', label: 'Email',   lines: ['rajangishor04@gmail.com'],  href: 'mailto:rajangishor04@gmail.com' },
  {
    icon: '🕐', label: 'Hours',
    lines: ['Monday – Friday: 6:00 AM – 10:00 PM', 'Saturday – Sunday: 8:00 AM – 8:00 PM'],
  },
]

const EMPTY = { name: '', email: '', phone: '', message: '' }

export default function Contact() {
  const [form, setForm]         = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [submitErr, setSubmitErr] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required.'
    if (!form.email.trim())   e.email   = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address.'
    if (!form.message.trim()) e.message = 'Message is required.'
    return e
  }

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
    setSubmitErr('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setSubmitErr('')

    // ── Step 1: Save to backend (primary — admin panel needs this) ──
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
    } catch (err) {
      setSubmitErr('Could not send message. Please check your connection and try again.')
      setLoading(false)
      return
    }

    // ── Step 2: Send email via Web3Forms (silent — never blocks submit) ──
    if (WEB3FORMS_KEY && WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY_HERE') {
      fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject:    `New message from ${form.name.trim()} — GymFit`,
          from_name:  'GymFit Website',
          replyto:    form.email.trim(),
          name:       form.name.trim(),
          email:      form.email.trim(),
          phone:      form.phone.trim() || 'Not provided',
          message:    form.message.trim(),
          botcheck:   '',
        }),
      }).catch(err => console.warn('[email] silent fail:', err))
    }

    setSuccess(true)
    setForm(EMPTY)
    setLoading(false)
  }

  if (success) {
    return (
      <section id="contact" className="contact">
        <div className="contact__inner">
          <div className="contact__success-screen">
            <div className="contact__success-icon">✅</div>
            <h2 className="contact__success-title">Message Sent!</h2>
            <p className="contact__success-text">
              Thank you for reaching out. We've received your message and will
              get back to you within 24 hours.
            </p>
            <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => setSuccess(false)}>
              Send Another Message
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="contact">
      <div className="contact__inner">
        <h2 className="section-title">Contact Us</h2>
        <p className="section-subtitle">
          Have a question or ready to start? We'd love to hear from you.
        </p>

        <div className="contact__layout">

          {/* Info column */}
          <div className="contact__info">
            <h3>Get In Touch</h3>
            <p>
              Send us a message and our team will get back to you within 24 hours.
              We're here to help you start your fitness journey.
            </p>
            {CONTACT_DETAILS.map(d => (
              <div key={d.label} className="contact__detail">
                <span className="contact__detail-icon">{d.icon}</span>
                <div>
                  <div className="contact__detail-label">{d.label}</div>
                  {d.lines.map((line, i) =>
                    d.href && d.lines.length === 1 ? (
                      <a key={i} href={d.href} className="contact__detail-value contact__detail-link">{line}</a>
                    ) : (
                      <div key={i} className="contact__detail-value">{line}</div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Form column */}
          <div className="contact__form">
            {submitErr && <div className="contact__error-banner">⚠️ {submitErr}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="contact__field">
                <label className="contact__label">Full Name *</label>
                <input type="text" placeholder="Your full name" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={`contact__input${errors.name ? ' contact__input--error' : ''}`} />
                {errors.name && <span className="contact__error">{errors.name}</span>}
              </div>

              <div className="contact__field">
                <label className="contact__label">Email Address *</label>
                <input type="email" placeholder="your@email.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={`contact__input${errors.email ? ' contact__input--error' : ''}`} />
                {errors.email && <span className="contact__error">{errors.email}</span>}
              </div>

              <div className="contact__field">
                <label className="contact__label">Phone Number</label>
                <input type="tel" placeholder="+94 78 000 0000" value={form.phone}
                  onChange={e => set('phone', e.target.value)} className="contact__input" />
              </div>

              <div className="contact__field">
                <label className="contact__label">Message *</label>
                <textarea placeholder="Tell us how we can help you…" rows={5} value={form.message}
                  onChange={e => set('message', e.target.value)}
                  className={`contact__input${errors.message ? ' contact__input--error' : ''}`} />
                {errors.message && <span className="contact__error">{errors.message}</span>}
              </div>

              <button type="submit" className="contact__submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Sending…</> : '✉ Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

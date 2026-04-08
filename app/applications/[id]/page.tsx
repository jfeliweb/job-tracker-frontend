'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { isLoggedIn } from '@/lib/auth'
import { Application, ApplicationRequest, CoverLetterResponse, Reminder } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-yellow-100 text-yellow-700',
  OFFER: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
}

export default function ApplicationDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [app, setApp] = useState<Application | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ApplicationRequest>({
    jobTitle: '',
    companyName: '',
    status: 'APPLIED',
    jobUrl: '',
    notes: '',
    appliedDate: '',
  })
  const [coverLetter, setCoverLetter] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [generatingCL, setGeneratingCL] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [reminderMessage, setReminderMessage] = useState('')
  const [savingReminder, setSavingReminder] = useState(false)

  const fetchApplication = useCallback(async () => {
    try {
      const [appData, reminderData] = await Promise.all([
        api.get<Application>(`/applications/${id}`),
        api.get<Reminder[]>(`/reminders`),
      ])
      setApp(appData)
      // Only show reminders for this application
      setReminders(reminderData.filter(r => r.application.id === Number(id)))
      setForm({
        jobTitle: appData.jobTitle,
        companyName: appData.companyName || '',
        status: appData.status,
        jobUrl: appData.jobUrl || '',
        notes: appData.notes || '',
        appliedDate: appData.appliedDate || '',
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load application')
    }
  }, [id])

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    void fetchApplication()
  }, [id, router, fetchApplication])

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const updated = await api.put<Application>(`/applications/${id}`, {
        ...form,
        companyName: form.companyName || undefined,
        jobUrl: form.jobUrl || undefined,
        notes: form.notes || undefined,
        appliedDate: form.appliedDate || undefined,
      })
      setApp(updated)
      setEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this application?')) return
    try {
      await api.delete(`/applications/${id}`)
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  async function handleGenerateCoverLetter() {
    if (!jobDescription.trim()) return
    setGeneratingCL(true)
    setCoverLetter('')
    try {
      const data = await api.post<CoverLetterResponse>('/cover-letter/generate', {
        jobDescription,
        additionalContext: `Role: ${app?.jobTitle} at ${app?.companyName || 'the company'}`,
      })
      setCoverLetter(data.coverLetter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter')
    } finally {
      setGeneratingCL(false)
    }
  }

  async function handleSaveReminder() {
    if (!reminderDate || !reminderTime) return
    setSavingReminder(true)
    try {
      const remindAt = `${reminderDate}T${reminderTime}:00`
      const newReminder = await api.post<Reminder>('/reminders', {
        applicationId: Number(id),
        remindAt,
        message: reminderMessage || null,
      })
      setReminders(prev => [...prev, newReminder])
      setReminderDate('')
      setReminderTime('')
      setReminderMessage('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save reminder')
    } finally {
      setSavingReminder(false)
    }
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{error || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate">{app.jobTitle}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Application Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{app.jobTitle}</h2>
              <p className="text-gray-500">{app.companyName || 'No company'}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'}`}>
              {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
            </span>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    value={form.jobTitle}
                    onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                    className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    value={form.companyName}
                    onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                    className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].map(s => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Applied</label>
                  <input
                    type="date"
                    value={form.appliedDate}
                    onChange={e => setForm(p => ({ ...p, appliedDate: e.target.value }))}
                    className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={4}
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {app.notes && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{app.notes}</p>
              )}
              {app.jobUrl && (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline block"
                >
                  View Job Posting →
                </a>
              )}
              {app.appliedDate && (
                <p className="text-xs text-gray-400">
                  Applied {new Date(app.appliedDate).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditing(true)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Follow-up Reminders
          </h2>

          {/* Existing reminders */}
          {reminders.length > 0 && (
            <div className="mb-5 space-y-2">
              {reminders.map(reminder => (
                <div
                  key={reminder.id}
                  className={`flex items-start justify-between p-3 rounded-lg border ${reminder.isSent
                      ? 'bg-gray-50 border-gray-200 text-gray-400'
                      : 'bg-blue-50 border-blue-200'
                    }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${reminder.isSent ? 'text-gray-400' : 'text-blue-800'}`}>
                      {new Date(reminder.remindAt).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {reminder.message && (
                      <p className={`text-xs mt-0.5 ${reminder.isSent ? 'text-gray-400' : 'text-blue-600'}`}>
                        {reminder.message}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reminder.isSent
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                    {reminder.isSent ? 'Sent' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* New reminder form */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <input
                type="text"
                value={reminderMessage}
                onChange={e => setReminderMessage(e.target.value)}
                placeholder="e.g. Follow up on application status"
                className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveReminder}
              disabled={savingReminder || !reminderDate || !reminderTime}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingReminder ? 'Saving...' : 'Set Reminder'}
            </button>
          </div>
        </div>

        {/* Cover Letter Generator */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            AI Cover Letter Generator
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paste the Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={5}
                placeholder="Paste the full job description here..."
                className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              onClick={handleGenerateCoverLetter}
              disabled={generatingCL || !jobDescription.trim()}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {generatingCL ? 'Generating...' : 'Generate Cover Letter'}
            </button>

            {coverLetter && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Generated Cover Letter
                  </label>
                  <button
                    onClick={() => navigator.clipboard.writeText(coverLetter)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Copy to clipboard
                  </button>
                </div>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  rows={12}
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
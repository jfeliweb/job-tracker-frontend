'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { isLoggedIn } from '@/lib/auth'
import { ApplicationRequest, Application } from '@/types'

export default function NewApplicationPage() {
  const router = useRouter()
  const [form, setForm] = useState<ApplicationRequest>({
    jobTitle: '',
    companyName: '',
    status: 'APPLIED',
    jobUrl: '',
    notes: '',
    appliedDate: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isLoggedIn()) {
    router.replace('/login')
    return null
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: ApplicationRequest = {
        ...form,
        // Send null instead of empty string for optional fields
        companyName: form.companyName || undefined,
        jobUrl: form.jobUrl || undefined,
        notes: form.notes || undefined,
        appliedDate: form.appliedDate || undefined,
      }

      const created = await api.post<Application>('/applications', payload)
      router.replace(`/applications/${created.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900">New Application</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job Title + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  required
                  placeholder="Lead Software Engineer"
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Royal Caribbean"
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].map(s => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Applied
                </label>
                <input
                  type="date"
                  name="appliedDate"
                  value={form.appliedDate}
                  onChange={handleChange}
                  className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Job URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Posting URL
              </label>
              <input
                type="url"
                name="jobUrl"
                value={form.jobUrl}
                onChange={handleChange}
                placeholder="https://careers.royalcaribbean.com/..."
                className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Interview prep notes, contacts, salary range..."
                className="w-full text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Application'}
              </button>
              <Link
                href="/dashboard"
                className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
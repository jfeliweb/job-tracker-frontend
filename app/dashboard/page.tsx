'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { clearAuth, getName, isLoggedIn } from '@/lib/auth'
import { Application } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-yellow-100 text-yellow-700',
  OFFER: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
}

export default function DashboardPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')
  const name = getName()

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    fetchApplications()
  }, [router])

  async function fetchApplications() {
    try {
      const data = await api.get<Application[]>('/applications')
      setApplications(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    clearAuth()
    router.replace('/login')
  }

  const filtered = filter === 'ALL'
    ? applications
    : applications.filter(a => a.status === filter)

  const counts = {
    ALL: applications.length,
    APPLIED: applications.filter(a => a.status === 'APPLIED').length,
    INTERVIEW: applications.filter(a => a.status === 'INTERVIEW').length,
    OFFER: applications.filter(a => a.status === 'OFFER').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Job Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Hi, {name}</span>
            <Link
              href="/applications/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + New Application
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', key: 'ALL', color: 'text-gray-900' },
            { label: 'Applied', key: 'APPLIED', color: 'text-blue-600' },
            { label: 'Interviews', key: 'INTERVIEW', color: 'text-yellow-600' },
            { label: 'Offers', key: 'OFFER', color: 'text-green-600' },
          ].map(({ label, key, color }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{counts[key as keyof typeof counts]}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['ALL', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">No applications yet</p>
            <Link
              href="/applications/new"
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add your first application
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.jobTitle}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {app.companyName || 'No company'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'}`}>
                    {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                  </span>
                </div>
                {app.appliedDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    Applied {new Date(app.appliedDate).toLocaleDateString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
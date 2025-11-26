'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SchoolLogoUpload } from './SchoolLogoUpload'
import { Building2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { ContentCard } from '@/components/layout/ContentCard'

interface OrganisationBranding {
  id: string
  name: string
  logoUrl?: string
  brandHeading?: string
  brandSubheading?: string
  role: string
}

export function OrganisationBrandingTab() {
  const { data: session, status } = useSession()
  const [organisation, setOrganisation] = useState<OrganisationBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [branding, setBranding] = useState({
    logoUrl: '',
    brandHeading: '',
    brandSubheading: '',
  })

  useEffect(() => {
    if (status === 'authenticated' && session) {
      loadOrganisation()
    } else if (status === 'unauthenticated') {
      setError('Not authenticated')
      setLoading(false)
    }
  }, [status, session])

  const loadOrganisation = async () => {
    try {
      if (!session?.user?.id) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const res = await fetch('/api/user/organisation', {
        credentials: 'include', // Send session cookie
      })

      if (res.ok) {
        const data = await res.json()
        if (data.organisation) {
          setOrganisation(data.organisation)
          setBranding({
            logoUrl: data.organisation.logoUrl || '',
            brandHeading: data.organisation.brandHeading || '',
            brandSubheading: data.organisation.brandSubheading || '',
          })
        } else {
          setError('You are not a member of any organisation')
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to load organisation')
      }
    } catch (err: any) {
      console.error('Error loading organisation:', err)
      setError(err.message || 'Failed to load organisation')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!organisation) return

    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      if (!session?.user?.id) {
        throw new Error('Not authenticated')
      }

      // Upload logo if it's a new file (data URL or blob URL)
      let logoUrl = branding.logoUrl
      if (logoUrl && (logoUrl.startsWith('data:') || logoUrl.startsWith('blob:'))) {
        // Logo was just uploaded, need to upload to organisation
        const formData = new FormData()
        // Convert data/blob URL to blob
        const response = await fetch(logoUrl)
        const blob = await response.blob()
        formData.append('file', blob, 'logo.png')

        const uploadRes = await fetch(`/api/organisation/${organisation.id}/upload-logo`, {
          method: 'POST',
          credentials: 'include', // Send session cookie
          body: formData,
        })

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json()
          throw new Error(errorData.error || 'Failed to upload logo')
        }

        const uploadData = await uploadRes.json()
        logoUrl = uploadData.url
      } else if (!logoUrl) {
        // User removed the logo
        logoUrl = null as any
      }

      // Save branding
      const saveRes = await fetch(`/api/organisation/${organisation.id}/branding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send session cookie
        body: JSON.stringify({
          logoUrl: logoUrl || null,
          brandHeading: branding.brandHeading.trim() || null,
          brandSubheading: branding.brandSubheading.trim() || null,
        }),
      })

      if (!saveRes.ok) {
        const errorData = await saveRes.json()
        throw new Error(errorData.error || 'Failed to save branding')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // Reload organisation to get updated data
      await loadOrganisation()
    } catch (err: any) {
      console.error('Error saving branding:', err)
      setError(err.message || 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error && !organisation) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Organisation branding is only available for organisation members.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          You are not a member of any organisation.
        </p>
      </div>
    )
  }

  const isAdmin = organisation.role === 'OWNER' || organisation.role === 'ADMIN'

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Limited Access
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Only organisation admins can update branding. You can view the current settings.
              </p>
            </div>
          </div>
        </div>
      )}

      <ContentCard padding="lg" rounded="xl" hoverAnimation={false}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {organisation.name} Branding
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set the default logo and branding text for all custom quizzes created by members of your organisation.
            Individual users can override these settings when creating their quizzes.
          </p>
        </div>

        <div className="space-y-6">
          <SchoolLogoUpload
            value={branding.logoUrl}
            onChange={(url) => setBranding({ ...branding, logoUrl: url })}
            className={!isAdmin ? 'opacity-50 pointer-events-none' : ''}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Heading (optional)
            </label>
            <input
              type="text"
              value={branding.brandHeading}
              onChange={(e) => setBranding({ ...branding, brandHeading: e.target.value })}
              placeholder="e.g., St. Augustine's School"
              disabled={!isAdmin}
              className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {branding.brandHeading.length} / 100 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Subheading (optional)
            </label>
            <input
              type="text"
              value={branding.brandSubheading}
              onChange={(e) => setBranding({ ...branding, brandSubheading: e.target.value })}
              placeholder="e.g., Weekly Quiz - Term 1, 2025"
              disabled={!isAdmin}
              className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {branding.brandSubheading.length} / 200 characters
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Branding
                  </>
                )}
              </button>
              {success && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved successfully!
                </span>
              )}
              {error && (
                <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </span>
              )}
            </div>
          )}
        </div>
      </ContentCard>
    </div>
  )
}


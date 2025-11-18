'use client'

interface BasicsSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
}

export function BasicsSection({ formData, updateField }: BasicsSectionProps) {
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    updateField('name', name)
    if (!formData.slug || formData.slug === generateSlug(formData.name)) {
      updateField('slug', generateSlug(name))
    }
  }

  return (
    <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            placeholder="e.g., Blitzkrieg!"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Slug (Code) *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            placeholder="e.g., blitzkrieg"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Unique identifier (auto-generated from title)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            >
              <option value="performance" style={{ paddingTop: '0.5rem' }}>Performance</option>
              <option value="engagement">Engagement</option>
              <option value="social">Social</option>
              <option value="event">Event</option>
              <option value="meta">Meta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rarity *
            </label>
            <select
              value={formData.rarity}
              onChange={(e) => updateField('rarity', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            >
              <option value="common" style={{ paddingTop: '0.5rem' }}>Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
        </div>

    </div>
  )
}


'use client'

interface DescriptionsSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
}

export function DescriptionsSection({
  formData,
  updateField,
}: DescriptionsSectionProps) {
  return (
    <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Short Description * (1-2 lines for compact card)
          </label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => updateField('shortDescription', e.target.value)}
            rows={2}
            maxLength={150}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Get 5/5 in a History round under 2 minutes"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.shortDescription.length}/150 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Long Description (for detailed view)
          </label>
          <textarea
            value={formData.longDescription}
            onChange={(e) => updateField('longDescription', e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Complete a history-themed round perfectly in less than 2 minutes - lightning fast!"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.longDescription?.length || 0}/500 characters
          </p>
        </div>
    </div>
  )
}


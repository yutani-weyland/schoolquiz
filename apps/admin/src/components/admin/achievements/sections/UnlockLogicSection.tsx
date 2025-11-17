'use client'

interface UnlockLogicSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
  updateConditionConfig: (field: string, value: any) => void
}

export function UnlockLogicSection({
  formData,
  updateField,
  updateConditionConfig,
}: UnlockLogicSectionProps) {
  const conditionType = formData.unlockConditionType
  const config = formData.unlockConditionConfig || {}

  return (
    <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Condition Type *
          </label>
          <select
            value={conditionType}
            onChange={(e) => updateField('unlockConditionType', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="score_perfect_in_category_under_seconds">
              Perfect score in category under time
            </option>
            <option value="same_score_two_weeks_in_a_row">
              Same score two weeks in a row
            </option>
            <option value="custom">Custom (handled in code)</option>
          </select>
        </div>

        {conditionType === 'score_perfect_in_category_under_seconds' && (
          <div className="space-y-4 pl-4 border-l-2 border-blue-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={config.category || ''}
                onChange={(e) => updateConditionConfig('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="history">History</option>
                <option value="science">Science</option>
                <option value="geography">Geography</option>
                <option value="math">Math</option>
                <option value="literature">Literature</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Time (seconds)
              </label>
              <input
                type="number"
                value={config.seconds || ''}
                onChange={(e) =>
                  updateConditionConfig('seconds', parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 120"
              />
            </div>
          </div>
        )}

        {conditionType === 'same_score_two_weeks_in_a_row' && (
          <div className="space-y-4 pl-4 border-l-2 border-blue-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Score Value (optional)
              </label>
              <input
                type="number"
                value={config.score || ''}
                onChange={(e) =>
                  updateConditionConfig('score', e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for any score"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty to match any score
              </p>
            </div>
          </div>
        )}

        {conditionType === 'custom' && (
          <div className="pl-4 border-l-2 border-blue-500">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Custom unlock logic is handled in code. Use the designer note field
              below to document the condition.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


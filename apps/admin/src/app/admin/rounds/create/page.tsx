'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X, Edit2, Trash2, Layers, ArrowLeft } from 'lucide-react'
import { Card, Input, Select, Badge, Button, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty } from '@/components/admin/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  answer: string
  explanation?: string
}

interface RoundTemplate {
  id: string
  title: string
  categoryId: string
  categoryName?: string
  blurb?: string
  questions: Question[]
  createdAt: string
  updatedAt: string
}

function RoundCreatorPageContent() {
  const [mounted, setMounted] = useState(false)
  const [rounds, setRounds] = useState<RoundTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parentId?: string | null }>>([])
  const [sortBy, setSortBy] = useState<string>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    categoryId: string
    blurb: string
    questions: Question[]
  }>({
    title: '',
    categoryId: '',
    blurb: '',
    questions: [],
  })

  useEffect(() => {
    setMounted(true)
    fetchCategories()
    fetchRounds()
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchRounds()
    }
  }, [debouncedSearch, categoryFilter, mounted])

  // Initialize questions array when opening modal
  useEffect(() => {
    if (showModal && formData.questions.length === 0) {
      setFormData(prev => ({
        ...prev,
        questions: Array.from({ length: 6 }, (_, i) => ({
          id: `temp-${i}`,
          text: '',
          answer: '',
          explanation: '',
        })),
      }))
    }
  }, [showModal])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchRounds = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (categoryFilter) params.append('categoryId', categoryFilter)

      const response = await fetch(`/api/admin/rounds/templates?${params}`)
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json()
            setRounds(data.rounds || [])
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch rounds:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.categoryId) {
      alert('Please fill in title and category')
      return
    }

    // Validate that all questions have text and answer
    const incompleteQuestions = formData.questions.filter(
      q => !q.text.trim() || !q.answer.trim()
    )

    if (incompleteQuestions.length > 0) {
      alert(`Please complete all ${formData.questions.length} questions (text and answer required)`)
      return
    }

    try {
      const url = editingId 
        ? `/api/admin/rounds/templates/${editingId}`
        : '/api/admin/rounds/templates'
      
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchRounds()
        closeModal()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save round')
      }
    } catch (error) {
      console.error('Failed to save round:', error)
      alert('Failed to save round. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this round template?')) return

    try {
      const response = await fetch(`/api/admin/rounds/templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchRounds()
      } else {
        alert('Failed to delete round')
      }
    } catch (error) {
      console.error('Failed to delete round:', error)
      alert('Failed to delete round. Please try again.')
    }
  }

  const handleEdit = (round: RoundTemplate) => {
    setEditingId(round.id)
    setFormData({
      title: round.title,
      categoryId: round.categoryId,
      blurb: round.blurb || '',
      questions: round.questions.length > 0 
        ? round.questions.map((q, i) => ({
            ...q,
            id: q.id || `temp-${i}`,
          }))
        : Array.from({ length: 6 }, (_, i) => ({
            id: `temp-${i}`,
            text: '',
            answer: '',
            explanation: '',
          })),
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({
      title: '',
      categoryId: '',
      blurb: '',
      questions: Array.from({ length: 6 }, (_, i) => ({
        id: `temp-${i}`,
        text: '',
        answer: '',
        explanation: '',
      })),
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      title: '',
      categoryId: '',
      blurb: '',
      questions: [],
    })
  }

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      ),
    }))
  }

  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return ''
    
    if (category.parentId) {
      const parent = categories.find(c => c.id === category.parentId)
      return parent ? `${parent.name} > ${category.name}` : category.name
    }
    return category.name
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const filteredAndSortedRounds = rounds
    .filter(r => {
      if (categoryFilter && r.categoryId !== categoryFilter) return false
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase()
        return (
          r.title.toLowerCase().includes(searchLower) ||
          (r.blurb && r.blurb.toLowerCase().includes(searchLower)) ||
          r.questions.some(q => 
            q.text.toLowerCase().includes(searchLower) ||
            q.answer.toLowerCase().includes(searchLower)
          )
        )
      }
      return true
    })
    .sort((a, b) => {
      let aVal: any = a[sortBy as keyof typeof a]
      let bVal: any = b[sortBy as keyof typeof b]

      // Handle date strings
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (sortBy === 'title') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      } else if (sortBy === 'questions') {
        aVal = a.questions.length
        bVal = b.questions.length
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Round Creator
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Manage round templates
          </p>
        </div>
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={4} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Round Creator
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Create and manage round templates with 6 questions each
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/quizzes"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Add Round</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Input
              type="text"
              placeholder="Search rounds..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 text-xs"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryDisplayName(cat.id)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={4} />
        </Card>
      ) : (
        <DataTable
          emptyState={{
            icon: <Layers className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />,
            message: 'No round templates found'
          }}
        >
          {filteredAndSortedRounds.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <DataTableHeader>
                  <tr>
                    <DataTableHeaderCell 
                      sortable 
                      sorted={sortBy === 'title' ? sortOrder : undefined}
                      onSort={() => handleSort('title')}
                    >
                      Round Title
                    </DataTableHeaderCell>
                    <DataTableHeaderCell 
                      sortable 
                      sorted={sortBy === 'categoryId' ? sortOrder : undefined}
                      onSort={() => handleSort('categoryId')}
                    >
                      Category
                    </DataTableHeaderCell>
                    <DataTableHeaderCell 
                      sortable 
                      sorted={sortBy === 'questions' ? sortOrder : undefined}
                      onSort={() => handleSort('questions')}
                    >
                      Questions
                    </DataTableHeaderCell>
                    <DataTableHeaderCell 
                      sortable 
                      sorted={sortBy === 'updatedAt' ? sortOrder : undefined}
                      onSort={() => handleSort('updatedAt')}
                    >
                      Updated
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>Actions</DataTableHeaderCell>
                  </tr>
                </DataTableHeader>
                <DataTableBody>
                  {filteredAndSortedRounds.map((round) => (
                    <DataTableRow key={round.id}>
                      <DataTableCell>
                        <div className="text-xs">
                          <p className="font-medium text-[hsl(var(--foreground))]">{round.title}</p>
                          {round.blurb && (
                            <p className="text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">
                              {round.blurb}
                            </p>
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryDisplayName(round.categoryId)}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {round.questions.length} questions
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(round.updatedAt)}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(round)}
                            className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(round.id)}
                            className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </table>
            </div>
          )}
        </DataTable>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  {editingId ? 'Edit Round Template' : 'Create New Round Template'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Round Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
                      Round Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., WW2 History, Australian Geography..."
                      className="text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
                      Category *
                    </label>
                    <Select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="text-sm"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {getCategoryDisplayName(cat.id)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Blurb (optional)
                  </label>
                  <textarea
                    value={formData.blurb}
                    onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                    placeholder="Add a description or context for this round..."
                    className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                    rows={2}
                  />
                </div>

                {/* Questions */}
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-3">
                    Questions (6 required) *
                  </label>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {formData.questions.map((question, index) => (
                      <div key={question.id} className="p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted))]/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            Question {index + 1}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                              Question Text *
                            </label>
                            <textarea
                              value={question.text}
                              onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                              placeholder="Enter question..."
                              className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                              Answer *
                            </label>
                            <Input
                              type="text"
                              value={question.answer}
                              onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                              placeholder="Enter answer..."
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                              Explanation (optional)
                            </label>
                            <textarea
                              value={question.explanation || ''}
                              onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                              placeholder="Add explanation..."
                              className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-[hsl(var(--border))]">
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    size="md"
                    className="gap-2"
                  >
                    {editingId ? 'Update Round Template' : 'Save Round Template'}
                  </Button>
                  <Button
                    onClick={closeModal}
                    variant="ghost"
                    size="md"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RoundCreatorPage() {
  return <RoundCreatorPageContent />
}

'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X, Edit2, Trash2, Database } from 'lucide-react'
import { Card, Input, Select, Badge, Button, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty } from '@/components/admin/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'

interface Question {
  id: string
  text: string
  answer: string
  explanation?: string
  categoryId: string
  categoryName?: string
  createdAt: string
  updatedAt: string
}

function QuestionBankPageContent() {
  const [mounted, setMounted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
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
  const [formData, setFormData] = useState({
    text: '',
    answer: '',
    explanation: '',
    categoryId: '',
  })

  useEffect(() => {
    setMounted(true)
    fetchCategories()
    fetchQuestions()
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchQuestions()
    }
  }, [debouncedSearch, categoryFilter, mounted])

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

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (categoryFilter) params.append('categoryId', categoryFilter)

      const response = await fetch(`/api/admin/questions/bank?${params}`)
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json()
            setQuestions(data.questions || [])
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.text.trim() || !formData.answer.trim() || !formData.categoryId) {
      alert('Please fill in question, answer, and category')
      return
    }

    try {
      const url = editingId 
        ? `/api/admin/questions/bank/${editingId}`
        : '/api/admin/questions/bank'
      
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchQuestions()
        closeModal()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save question')
      }
    } catch (error) {
      console.error('Failed to save question:', error)
      alert('Failed to save question. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const response = await fetch(`/api/admin/questions/bank/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchQuestions()
      } else {
        alert('Failed to delete question')
      }
    } catch (error) {
      console.error('Failed to delete question:', error)
      alert('Failed to delete question. Please try again.')
    }
  }

  const handleEdit = (question: Question) => {
    setEditingId(question.id)
    setFormData({
      text: question.text,
      answer: question.answer,
      explanation: question.explanation || '',
      categoryId: question.categoryId,
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({
      text: '',
      answer: '',
      explanation: '',
      categoryId: '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      text: '',
      answer: '',
      explanation: '',
      categoryId: '',
    })
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

  const filteredAndSortedQuestions = questions
    .filter(q => {
      if (categoryFilter && q.categoryId !== categoryFilter) return false
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase()
        return (
          q.text.toLowerCase().includes(searchLower) ||
          q.answer.toLowerCase().includes(searchLower) ||
          (q.explanation && q.explanation.toLowerCase().includes(searchLower))
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
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
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
            Question Bank
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Manage your question library
          </p>
        </div>
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={5} />
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
            Question Bank
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Manage your question library for use in quizzes
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:inline">Add Question</span>
        </button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Input
              type="text"
              placeholder="Search questions..."
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
          <TableSkeleton rows={10} columns={5} />
        </Card>
      ) : (
        <DataTable
          emptyState={{
            icon: <Database className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />,
            message: 'No questions found'
          }}
        >
          {filteredAndSortedQuestions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <DataTableHeader>
                  <tr>
                    <DataTableHeaderCell 
                      sortable 
                      sorted={sortBy === 'text' ? sortOrder : undefined}
                      onSort={() => handleSort('text')}
                    >
                      Question
                    </DataTableHeaderCell>
                    <DataTableHeaderCell 
                      sortable 
                      sorted={sortBy === 'answer' ? sortOrder : undefined}
                      onSort={() => handleSort('answer')}
                    >
                      Answer
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
                      sorted={sortBy === 'updatedAt' ? sortOrder : undefined}
                      onSort={() => handleSort('updatedAt')}
                    >
                      Updated
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>Actions</DataTableHeaderCell>
                  </tr>
                </DataTableHeader>
                <DataTableBody>
                  {filteredAndSortedQuestions.map((question) => (
                    <DataTableRow key={question.id}>
                      <DataTableCell>
                        <div className="text-xs text-[hsl(var(--foreground))] max-w-md">
                          <p className="font-medium line-clamp-2">{question.text}</p>
                          {question.explanation && (
                            <p className="text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-xs font-medium text-[hsl(var(--foreground))]">
                          {question.answer}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryDisplayName(question.categoryId)}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(question.updatedAt)}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(question)}
                            className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(question.id)}
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
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  {editingId ? 'Edit Question' : 'Add New Question'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Question *
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="Enter your question..."
                    className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Answer *
                  </label>
                  <Input
                    type="text"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Enter the answer..."
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Add an explanation..."
                    className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                    rows={2}
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

                <div className="flex items-center gap-2 pt-4 border-t border-[hsl(var(--border))]">
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    size="md"
                    className="gap-2"
                  >
                    {editingId ? 'Update Question' : 'Save Question'}
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

export default function QuestionBankPage() {
  return <QuestionBankPageContent />
}

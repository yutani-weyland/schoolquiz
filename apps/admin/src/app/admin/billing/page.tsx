'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CreditCard, DollarSign, TrendingUp, FileText, ExternalLink, AlertCircle, CheckCircle2, Clock, Plus, XCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, PageHeader, Badge, Button, StatusStrip } from '@/components/admin/ui'

interface Subscription {
  id: string
  organisationId: string
  organisationName: string
  plan: string
  status: string
  amount: number
  currency: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  seats: number
  maxSeats: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

interface Invoice {
  id: string
  organisationId: string
  organisationName: string
  amount: number
  currency: string
  status: string
  invoiceDate: string
  dueDate: string
  paidDate: string | null
  stripeInvoiceId: string
  pdfUrl: string
}

interface Revenue {
  thisMonth: number
  lastMonth: number
  thisYear: number
  change: number
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [revenue, setRevenue] = useState<Revenue | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [subsRes, invRes] = await Promise.all([
        fetch('/api/admin/billing/subscriptions'),
        fetch('/api/admin/billing/invoices'),
      ])
      
      const subsData = await subsRes.json()
      const invData = await invRes.json()
      
      if (subsRes.ok) setSubscriptions(subsData.subscriptions || [])
      if (invRes.ok) setInvoices(invData.invoices || [])
      
      // Calculate revenue from invoices
      const thisMonth = new Date()
      const thisMonthInvoices = (invData.invoices || []).filter((inv: Invoice) => {
        const invDate = new Date(inv.invoiceDate)
        return invDate.getMonth() === thisMonth.getMonth() && invDate.getFullYear() === thisMonth.getFullYear()
      })
      const thisMonthRevenue = thisMonthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0)
      
      setRevenue({
        thisMonth: thisMonthRevenue,
        lastMonth: thisMonthRevenue * 0.9, // Dummy calculation
        thisYear: thisMonthRevenue * 12, // Dummy calculation
        change: 10.0,
      })
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: { label: 'Active', variant: 'success' as const, icon: CheckCircle2 },
      TRIALING: { label: 'Trial', variant: 'info' as const, icon: Clock },
      PAST_DUE: { label: 'Past Due', variant: 'error' as const, icon: AlertCircle },
      CANCELLED: { label: 'Cancelled', variant: 'default' as const, icon: AlertCircle },
      PAID: { label: 'Paid', variant: 'success' as const, icon: CheckCircle2 },
      OVERDUE: { label: 'Overdue', variant: 'error' as const, icon: AlertCircle },
    }
    return badges[status as keyof typeof badges] || badges.ACTIVE
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    )
  }

  // Check for billing issues
  const pastDueSubscriptions = subscriptions.filter(s => s.status === 'PAST_DUE')
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage subscriptions, invoices, and payment information"
      />

      {/* Status Strips */}
      {pastDueSubscriptions.length > 0 && (
        <StatusStrip
          variant="error"
          message={`${pastDueSubscriptions.length} organisation${pastDueSubscriptions.length > 1 ? 's' : ''} ${pastDueSubscriptions.length > 1 ? 'have' : 'has'} past due subscriptions`}
          details="Payment failed or subscription is past due. Review and update payment methods."
          action={{
            label: 'View Subscriptions',
            onClick: () => setActiveTab('subscriptions'),
          }}
        />
      )}
      {overdueInvoices.length > 0 && (
        <StatusStrip
          variant="warning"
          message={`${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} ${overdueInvoices.length > 1 ? 'are' : 'is'} overdue`}
          details="Some invoices are past their due date and require attention."
          action={{
            label: 'View Invoices',
            onClick: () => setActiveTab('invoices'),
          }}
        />
      )}

      {/* Revenue Stats */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">This Month</p>
                <p className="text-3xl font-bold text-[hsl(var(--foreground))] mt-2">
                  {formatCurrency(revenue.thisMonth)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    +{revenue.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Last Month</p>
                <p className="text-3xl font-bold text-[hsl(var(--foreground))] mt-2">
                  {formatCurrency(revenue.lastMonth)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">This Year</p>
                <p className="text-3xl font-bold text-[hsl(var(--foreground))] mt-2">
                  {formatCurrency(revenue.thisYear)}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex border-b border-gray-200/50 dark:border-gray-700/50 mb-6 bg-transparent p-0 h-auto">
          <TabsTrigger
            value="subscriptions"
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
          >
            Subscriptions
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
          >
            Invoices
          </TabsTrigger>
          <TabsTrigger
            value="webhooks"
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
          >
            Webhooks
          </TabsTrigger>
          <TabsTrigger
            value="offer-codes"
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
          >
            Offer Codes
          </TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-0">
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Organisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Seats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Period
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {subscriptions.map((sub) => {
                    const statusBadge = getStatusBadge(sub.status)
                    const StatusIcon = statusBadge.icon
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-[hsl(var(--muted))] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/organisations/${sub.organisationId}`}
                            className="text-sm font-medium text-[hsl(var(--primary))] hover:underline"
                          >
                            {sub.organisationName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {sub.plan.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusBadge.variant} icon={statusBadge.icon}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={async () => {
                              const newAmount = prompt(`Enter new amount for ${sub.organisationName} (in cents, current: ${sub.amount}):`, sub.amount.toString())
                              if (newAmount && !isNaN(parseInt(newAmount))) {
                                try {
                                  const response = await fetch(`/api/admin/billing/subscriptions/${sub.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ amount: parseInt(newAmount) }),
                                  })
                                  if (response.ok) {
                                    fetchData()
                                    alert('Subscription cost updated successfully!')
                                  } else {
                                    const data = await response.json()
                                    alert(data.error || 'Failed to update subscription')
                                  }
                                } catch (error) {
                                  console.error('Failed to update subscription:', error)
                                  alert('Failed to update subscription')
                                }
                              }
                            }}
                            className="text-sm font-medium text-[hsl(var(--primary))] hover:underline cursor-pointer"
                            title="Click to modify cost"
                          >
                            {formatCurrency(sub.amount, sub.currency)}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {sub.seats} / {sub.maxSeats || '∞'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-0">
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Organisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[hsl(var(--card))]/50 divide-y divide-[hsl(var(--border))]">
                  {invoices.map((invoice) => {
                    const statusBadge = getStatusBadge(invoice.status)
                    const StatusIcon = statusBadge.icon
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-[hsl(var(--muted))] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
                          {invoice.stripeInvoiceId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/organisations/${invoice.organisationId}`}
                            className="text-sm text-[hsl(var(--primary))] hover:underline"
                          >
                            {invoice.organisationName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusBadge.variant} icon={statusBadge.icon}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-0">
          <Card>
            <div className="mb-4">
              <Link
                href="/admin/billing/webhooks"
                className="text-sm text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1"
              >
                View all webhook events <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              View detailed webhook events on the{' '}
              <Link href="/admin/billing/webhooks" className="text-[hsl(var(--primary))] hover:underline">
                webhooks page
              </Link>
              .
            </p>
          </Card>
        </TabsContent>

        {/* Offer Codes Tab */}
        <TabsContent value="offer-codes" className="mt-0">
          <OfferCodesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OfferCodesTab() {
  const [codes, setCodes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/billing/offer-codes')
      const data = await response.json()
      if (response.ok) {
        setCodes(data.codes || [])
      }
    } catch (error) {
      console.error('Failed to fetch offer codes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry'
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDiscount = (type: string, value: number) => {
    switch (type) {
      case 'PERCENTAGE':
        return `${value}% off`
      case 'FIXED_AMOUNT':
        return `$${(value / 100).toFixed(2)} off`
      case 'FREE_TRIAL_EXTENSION':
        return `${value} days free trial`
      default:
        return value.toString()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Special Offer Codes
        </h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Code
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
        </div>
      ) : codes.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No offer codes found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[hsl(var(--card))]/50 divide-y divide-[hsl(var(--border))]">
                {codes.map((code) => (
                  <tr
                    key={code.id}
                    className="hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono font-semibold text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded">
                        {code.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                      {code.description || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
                      {formatDiscount(code.discountType, code.discountValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                      {code.currentUses} / {code.maxUses || '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                      {formatDate(code.validUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        code.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreateModal && (
        <CreateOfferCodeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchCodes()
          }}
        />
      )}
    </div>
  )
}

function CreateOfferCodeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxUses: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    applicablePlans: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/billing/offer-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          validUntil: formData.validUntil || null,
          applicablePlans: formData.applicablePlans ? JSON.parse(formData.applicablePlans) : null,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create offer code')
      }
    } catch (error) {
      console.error('Failed to create offer code:', error)
      alert('Failed to create offer code')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
              Create Offer Code
            </h2>
            <button
              onClick={onClose}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              placeholder="SCHOOL2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              placeholder="20% off for schools in 2025"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                required
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount (cents)</option>
                <option value="FREE_TRIAL_EXTENSION">Free Trial Extension (days)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Discount Value *
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                placeholder={formData.discountType === 'PERCENTAGE' ? '20' : formData.discountType === 'FIXED_AMOUNT' ? '5000' : '30'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Max Uses (leave empty for unlimited)
              </label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Valid Until (optional)
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Code'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


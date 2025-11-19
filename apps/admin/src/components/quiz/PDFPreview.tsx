'use client'

import { useState, useEffect } from 'react'
import { FileDown, Eye, X, Loader2, CheckCircle2, AlertCircle, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PDFPreviewProps {
  pdfUrl: string | null
  pdfStatus: string | null
  quizId: string | null
  onGenerate?: () => Promise<void>
  onApprove?: () => Promise<void>
  onRegenerate?: () => Promise<void>
  isGenerating?: boolean
  isApproving?: boolean
  className?: string
}

export function PDFPreview({
  pdfUrl,
  pdfStatus,
  quizId,
  onGenerate,
  onApprove,
  onRegenerate,
  isGenerating = false,
  isApproving = false,
  className = '',
}: PDFPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // Reset error when PDF URL changes
  useEffect(() => {
    if (pdfUrl) {
      setPdfError(null)
    }
  }, [pdfUrl])

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `quiz-${quizId || 'preview'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleIframeError = () => {
    setPdfError('Failed to load PDF preview. You can still download it using the download button.')
  }

  if (!pdfUrl && pdfStatus !== 'generated' && pdfStatus !== 'approved') {
    return (
      <div className={`bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileDown className="w-12 h-12 text-[hsl(var(--muted-foreground))] mb-4" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
            No PDF Generated
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-md">
            Generate a PDF for this quiz to preview and review it before making it available.
          </p>
          {onGenerate && (
            <Button
              onClick={onGenerate}
              disabled={!quizId || isGenerating}
              className="inline-flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Generate PDF
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {pdfStatus === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <FileDown className="w-5 h-5 text-[hsl(var(--foreground))]" />
              )}
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  PDF {pdfStatus === 'approved' ? 'Approved' : 'Preview'}
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {pdfStatus === 'approved' 
                    ? 'This PDF is available on the quizzes page'
                    : 'Review the PDF before approving'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </>
            )}
            {onRegenerate && pdfStatus !== 'approved' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
            {onApprove && pdfStatus === 'generated' && (
              <Button
                onClick={onApprove}
                disabled={isApproving}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview */}
      {pdfUrl && (
        <div className={`relative bg-gray-100 dark:bg-gray-900 ${isExpanded ? 'h-[calc(100vh-300px)]' : 'h-[600px]'} transition-all duration-300`}>
          {pdfError ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mb-4">
                {pdfError}
              </p>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF Instead
              </Button>
            </div>
          ) : (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title="PDF Preview"
              onError={handleIframeError}
            />
          )}
        </div>
      )}

      {/* Footer Actions */}
      {pdfUrl && pdfStatus === 'generated' && (
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Review the PDF above. Once approved, it will be available on the quizzes page.
            </p>
            {onApprove && (
              <Button
                onClick={onApprove}
                disabled={isApproving}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



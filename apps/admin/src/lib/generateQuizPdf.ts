/**
 * Playwright PDF Generation Helper
 * 
 * Generates PDFs by rendering the printable quiz page in headless Chromium.
 * This ensures perfect font rendering, CSS support, and matches the live design.
 * 
 * Usage:
 *   const pdfBuffer = await generateQuizPdf(quizId)
 */

import { chromium, Browser, Page } from 'playwright'

let browserInstance: Browser | null = null

/**
 * Get or create a browser instance (singleton for performance)
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    })
  }
  return browserInstance
}

/**
 * Generate PDF for a quiz by ID
 * 
 * @param quizId - The quiz ID
 * @param baseUrl - Base URL for the app (should be provided by the caller)
 * @returns PDF buffer
 */
export async function generateQuizPdf(
  quizId: string,
  baseUrl: string
): Promise<Buffer> {
  // Use the provided baseUrl (should be derived from request URL)
  const appBaseUrl = baseUrl
  let page: Page | null = null
  let context: any = null

  try {
    // Check if Playwright browsers are installed
    let browser: Browser
    try {
      browser = await getBrowser()
    } catch (browserError: any) {
      // Check if it's a browser installation error
      if (browserError.message?.includes('Executable doesn\'t exist') ||
        browserError.message?.includes('BrowserType.launch') ||
        browserError.message?.includes('chromium')) {
        throw new Error(
          'Playwright browsers are not installed. Please run: pnpm exec playwright install chromium'
        )
      }
      throw browserError
    }

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Large viewport to capture full content
    })

    page = await context.newPage()

    // Navigate to the printable page (use route that bypasses admin layout)
    const url = `${appBaseUrl}/printable/quizzes/${quizId}?pdf=1`
    console.log('[PDF Generator] Loading printable page:', url)

    if (!page) {
      throw new Error('Failed to create browser page')
    }

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    console.log('[PDF Generator] Page loaded, waiting for rendering...')

    // Wait for page to be fully rendered
    await page.waitForSelector('body', { timeout: 10000 })

    console.log('[PDF Generator] Generating PDF...')

    // Wait for React Server Components to finish streaming
    // The page shows "Loading..." initially, so wait for actual content
    await page.waitForFunction(
      () => {
        const body = document.body
        if (!body) return false
        const text = body.textContent || ''
        // Wait until we have actual quiz content, not just "Loading..."
        return text.includes('printable-quiz') ||
          (text.includes('Round') && text.includes('Question')) ||
          text.includes('Error Loading Quiz') ||
          text.includes('Quiz not found') ||
          (!text.includes('Loading...') && text.length > 100)
      },
      { timeout: 20000 }
    )

    // Wait for the main content to be visible
    let hasContent = false
    try {
      await page.waitForSelector('.printable-quiz', { timeout: 10000, state: 'visible' })
      console.log('[PDF Generator] Found .printable-quiz selector')
      hasContent = true
    } catch (selectorError) {
      console.log('[PDF Generator] .printable-quiz selector not found, checking for content...')

      // Check if content exists anywhere on the page
      const contentCheck = await page.evaluate(() => {
        const body = document.body
        if (!body) return false

        const text = body.textContent || ''
        const hasPrintableQuiz = body.querySelector('.printable-quiz') !== null
        const hasError = text.includes('Error Loading Quiz') || text.includes('Quiz not found')
        const hasQuizContent = (text.includes('Round') && text.includes('Question')) || text.length > 500

        return {
          hasPrintableQuiz,
          hasError,
          hasQuizContent,
          textLength: text.length,
          preview: text.substring(0, 300)
        }
      })

      console.log('[PDF Generator] Content check:', contentCheck)

      if (typeof contentCheck === 'object' && contentCheck.hasError) {
        const errorText = await page.evaluate(() => document.body.textContent?.substring(0, 1000))
        throw new Error(`Quiz page returned an error. URL: ${url}\nError details: ${errorText}`)
      }

      if (typeof contentCheck === 'object' && (contentCheck.hasPrintableQuiz || contentCheck.hasQuizContent)) {
        hasContent = true
        console.log('[PDF Generator] Content found via fallback check')
      } else {
        const bodyText = await page.evaluate(() => document.body.textContent?.substring(0, 1000))
        console.error('[PDF Generator] No content found. Body preview:', bodyText)
        throw new Error(`Could not find quiz content. Page may have failed to load. URL: ${url}\nPage content: ${bodyText}`)
      }
    }

    if (!hasContent) {
      const bodyText = await page.evaluate(() => document.body.textContent?.substring(0, 1000))
      throw new Error(`Could not find quiz content. Page may have failed to load. URL: ${url}\nPage content: ${bodyText}`)
    }

    // If we're in the admin layout, try to scroll to the content
    await page.evaluate(() => {
      const printableQuiz = document.querySelector('.printable-quiz')
      if (printableQuiz) {
        printableQuiz.scrollIntoView({ behavior: 'instant', block: 'start' })
      }
    })

    // Wait for fonts to load
    await page.evaluate(() => {
      return document.fonts.ready
    })

    // Wait for all images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = resolve // Continue even if image fails
            setTimeout(resolve, 5000) // Timeout after 5s
          }))
      )
    })

    // Wait for any animations or transitions to complete
    await page.waitForTimeout(1000)

    // Ensure the page has fully rendered by checking scroll height
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let lastHeight = 0
        const checkHeight = () => {
          const currentHeight = document.documentElement.scrollHeight
          if (currentHeight === lastHeight) {
            resolve()
          } else {
            lastHeight = currentHeight
            setTimeout(checkHeight, 100)
          }
        }
        checkHeight()
      })
    })

    // Scroll to bottom to ensure all content is rendered
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
    await page.waitForTimeout(500)

    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(300)

    console.log('[PDF Generator] Page fully loaded, generating PDF...')

    // Get the full page height to verify content is loaded
    const fullHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      )
    })

    console.log('[PDF Generator] Page height:', fullHeight, 'px')

    // Ensure body and html have no height restrictions
    await page.evaluate(() => {
      document.body.style.height = 'auto'
      document.body.style.minHeight = '100%'
      document.documentElement.style.height = 'auto'
      document.documentElement.style.minHeight = '100%'
    })

    // Wait a bit more to ensure all content is rendered
    await page.waitForTimeout(500)

    // Get the actual full height of the content
    const actualHeight = await page.evaluate(() => {
      const body = document.body
      const html = document.documentElement
      return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      )
    })

    console.log('[PDF Generator] Actual content height:', actualHeight, 'px')

    // Generate PDF - Playwright will automatically handle multi-page PDFs
    // Use the full document height, not just viewport
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
      printBackground: true,
      preferCSSPageSize: false,
    })

    await context.close()

    console.log('[PDF Generator] PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    return pdfBuffer
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error)
    throw error
  } finally {
    if (page) {
      await page.close().catch(() => { })
    }
    if (context) {
      await context.close().catch(() => { })
    }
  }
}

/**
 * Cleanup browser instance (call on app shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

/**
 * Install Playwright browsers if not already installed
 * Call this during app initialization or setup
 */
export async function ensurePlaywrightBrowsers(): Promise<void> {
  try {
    // Try to create a browser - this will fail if browsers aren't installed
    const browser = await chromium.launch({ headless: true })
    await browser.close()
    console.log('[PDF Generator] Playwright browsers are installed')
  } catch (error) {
    console.warn('[PDF Generator] Playwright browsers not installed. Run: pnpm exec playwright install chromium')
    // Don't throw - allow graceful degradation
  }
}


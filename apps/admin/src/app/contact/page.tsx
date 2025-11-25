'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { Mail, MessageSquare, Send, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const { data: session } = useSession();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check premium status
    const checkPremium = async () => {
      try {
        if (!session?.user?.id) {
          setIsPremium(false);
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/user/subscription', {
          credentials: 'include', // Send session cookie
        });

        if (response.ok) {
          const data = await response.json();
          const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
          setIsPremium(premiumStatuses.includes(data.status));
        }
      } catch (err) {
        console.error('Failed to check premium status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremium();
  }, []);

  return (
    <PageLayout>
      <PageContainer maxWidth="4xl">
        <PageHeader
          title="Contact Us"
          subtitle="Have a suggestion or need support? We'd love to hear from you."
          centered
        />

        <div className="space-y-8">
          {/* Suggestions Form - Available to Everyone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ContentCard padding="lg" rounded="3xl" hoverAnimation={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Share Your Suggestions
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Open to everyone - share your ideas and feedback
                  </p>
                </div>
              </div>
              <SuggestionsForm />
            </ContentCard>
          </motion.div>

          {/* Support Form - Premium Only */}
          {!isLoading && isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ContentCard padding="lg" rounded="3xl" className="border-2 border-blue-200 dark:border-blue-800/50" hoverAnimation={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Premium Support
                      </h2>
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        Premium
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get priority support for technical issues and account questions
                    </p>
                  </div>
                </div>
                <SupportForm />
              </ContentCard>
            </motion.div>
          )}

          {/* Premium Upsell */}
          {!isLoading && !isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ContentCard padding="lg" rounded="3xl" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50" hoverAnimation={false}>
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Unlock Premium Support
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Premium subscribers get priority support for technical issues and account questions.
                  </p>
                  <a
                    href="/premium"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Premium
                  </a>
                </div>
              </ContentCard>
            </motion.div>
          )}
        </div>
      </PageContainer>
    </PageLayout>
  );
}

function SuggestionsForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/contact/suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit suggestion');
      }

      setSubmitStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your suggestion"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Suggestion
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Tell us your ideas, feedback, or feature requests..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          required
        />
      </div>

      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl text-green-700 dark:text-green-400"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Thank you! Your suggestion has been submitted.</span>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-700 dark:text-red-400"
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </motion.div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Suggestion
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function SupportForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/contact/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit support request');
      }

      setSubmitStatus('success');
      setSubject('');
      setMessage('');
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Failed to submit support request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Support Request
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Describe your issue or question in detail. We'll get back to you as soon as possible."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          required
        />
      </div>

      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl text-green-700 dark:text-green-400"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Support request submitted! We'll respond within 24 hours.</span>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-700 dark:text-red-400"
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </motion.div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Submit Support Request
            </>
          )}
        </button>
      </div>
    </form>
  );
}


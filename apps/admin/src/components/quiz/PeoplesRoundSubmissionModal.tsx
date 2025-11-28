'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, School, User, Palette, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface PeoplesRoundSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmissionData) => Promise<void>;
  quizSlug: string;
}

export interface SubmissionData {
  organisationId?: string;
  organisationName?: string;
  schoolName?: string;
  teacherName: string;
  wantsShoutout: boolean;
  color1?: string;
  color2?: string;
}

export function PeoplesRoundSubmissionModal({
  isOpen,
  onClose,
  onSubmit,
  quizSlug,
}: PeoplesRoundSubmissionModalProps) {
  const { data: session } = useSession();
  const [organisationId, setOrganisationId] = useState<string>('');
  const [organisationName, setOrganisationName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [wantsShoutout, setWantsShoutout] = useState<boolean>(true);
  const [color1, setColor1] = useState<string>('#3B82F6');
  const [color2, setColor2] = useState<string>('#10B981');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch user's organisation on mount
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchUserOrganisation();
    }
  }, [isOpen, session]);

  const fetchUserOrganisation = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.organisationName) {
          setOrganisationName(data.organisationName);
          // Note: organisationId would need to come from a different endpoint
          // For now, we'll use organisationName
        }
      }
    } catch (error) {
      console.error('Failed to fetch organisation:', error);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!teacherName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!organisationName && !schoolName.trim()) {
      setError('Please enter your school name or select your organisation');
      return;
    }

    if (wantsShoutout && (!color1 || !color2)) {
      setError('Please select both school colors');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        organisationId: organisationId || undefined,
        organisationName: organisationName || undefined,
        schoolName: schoolName.trim() || undefined,
        teacherName: teacherName.trim(),
        wantsShoutout,
        color1: wantsShoutout ? color1 : undefined,
        color2: wantsShoutout ? color2 : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-xl relative overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Submit to The People's Round
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share your quiz question with the community
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-6">
                  {/* Organisation/School */}
                  {organisationName ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <School className="w-4 h-4 inline mr-1" />
                        Organisation
                      </label>
                      <input
                        type="text"
                        value={organisationName}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Your organisation is automatically selected
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <School className="w-4 h-4 inline mr-1" />
                        School Name
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g., Springfield High School"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Teacher Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="e.g., Mr Smith or Miss S"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Shoutout Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Receive a Shoutout?
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your name and school will be displayed when your question appears
                      </p>
                    </div>
                    <button
                      onClick={() => setWantsShoutout(!wantsShoutout)}
                      className="flex-shrink-0"
                    >
                      {wantsShoutout ? (
                        <ToggleRight className="w-10 h-10 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* School Colors (only if shoutout enabled) */}
                  {wantsShoutout && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          School Colors (for question accent)
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Color 1
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={color1}
                              onChange={(e) => setColor1(e.target.value)}
                              className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={color1}
                              onChange={(e) => setColor1(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Color 2
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={color2}
                              onChange={(e) => setColor2(e.target.value)}
                              className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={color2}
                              onChange={(e) => setColor2(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-full font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


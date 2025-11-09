'use client';

import { useState } from 'react';
import { Trophy, Plus, X, Edit2, Mail, Copy, Check, Users, LogIn, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { allColors } from '@/lib/colors';

// Use the combined palette: 2025 trending warm colors + modern vibrant colors
export const leagueColors = allColors;

export type League = {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  inviteCode: string;
  isOwner: boolean;
  members?: LeagueMember[];
  avatar?: string; // Emoji or icon identifier
};

export type LeagueMember = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
};

// Mock leaderboards (private leagues)
const mockLeaderboards: League[] = [
  {
    id: 'lb-1',
    name: 'Maths Challenge',
    color: '#4ECDC4',
    memberCount: 24,
    inviteCode: 'MATH2024',
    isOwner: true,
    avatar: '🔢',
    members: [
      { id: 'm1', name: 'Sarah Johnson', email: 'sarah.j@school.edu.au', joinedAt: '2024-01-10' },
      { id: 'm2', name: 'Michael Chen', email: 'michael.c@school.edu.au', joinedAt: '2024-01-12' },
      { id: 'm3', name: 'Emma Williams', email: 'emma.w@school.edu.au', joinedAt: '2024-01-15' },
      { id: 'm4', name: 'James Brown', email: 'james.b@school.edu.au', joinedAt: '2024-01-18' },
      { id: 'm5', name: 'Olivia Davis', email: 'olivia.d@school.edu.au', joinedAt: '2024-01-20' },
      { id: 'm6', name: 'Liam Wilson', email: 'liam.w@school.edu.au', joinedAt: '2024-01-22' },
      { id: 'm7', name: 'Sophia Martinez', email: 'sophia.m@school.edu.au', joinedAt: '2024-01-24' },
      { id: 'm8', name: 'Noah Anderson', email: 'noah.a@school.edu.au', joinedAt: '2024-01-26' },
      { id: 'm9', name: 'Isabella Taylor', email: 'isabella.t@school.edu.au', joinedAt: '2024-01-28' },
      { id: 'm10', name: 'Ethan Thomas', email: 'ethan.t@school.edu.au', joinedAt: '2024-01-30' },
      { id: 'm11', name: 'Mia Jackson', email: 'mia.j@school.edu.au', joinedAt: '2024-02-01' },
      { id: 'm12', name: 'Aiden White', email: 'aiden.w@school.edu.au', joinedAt: '2024-02-03' },
      { id: 'm13', name: 'Charlotte Harris', email: 'charlotte.h@school.edu.au', joinedAt: '2024-02-05' },
      { id: 'm14', name: 'Lucas Martin', email: 'lucas.m@school.edu.au', joinedAt: '2024-02-07' },
      { id: 'm15', name: 'Amelia Thompson', email: 'amelia.t@school.edu.au', joinedAt: '2024-02-09' },
      { id: 'm16', name: 'Mason Garcia', email: 'mason.g@school.edu.au', joinedAt: '2024-02-11' },
      { id: 'm17', name: 'Harper Martinez', email: 'harper.m@school.edu.au', joinedAt: '2024-02-13' },
      { id: 'm18', name: 'Logan Robinson', email: 'logan.r@school.edu.au', joinedAt: '2024-02-15' },
      { id: 'm19', name: 'Evelyn Clark', email: 'evelyn.c@school.edu.au', joinedAt: '2024-02-17' },
      { id: 'm20', name: 'Alexander Rodriguez', email: 'alexander.r@school.edu.au', joinedAt: '2024-02-19' },
      { id: 'm21', name: 'Abigail Lewis', email: 'abigail.l@school.edu.au', joinedAt: '2024-02-21' },
      { id: 'm22', name: 'Benjamin Lee', email: 'benjamin.l@school.edu.au', joinedAt: '2024-02-23' },
      { id: 'm23', name: 'Emily Walker', email: 'emily.w@school.edu.au', joinedAt: '2024-02-25' },
      { id: 'm24', name: 'Daniel Hall', email: 'daniel.h@school.edu.au', joinedAt: '2024-02-27' },
    ],
  },
  {
    id: 'lb-2',
    name: 'Year 7 Championship',
    color: '#FF6B6B',
    memberCount: 45,
    inviteCode: 'YR7CHAMP',
    isOwner: false,
    avatar: '🏆',
    members: [
      { id: 'm25', name: 'Alex Taylor', email: 'alex.t@school.edu.au', joinedAt: '2024-01-08' },
      { id: 'm26', name: 'Sophie Martinez', email: 'sophie.m@school.edu.au', joinedAt: '2024-01-09' },
      { id: 'm27', name: 'Noah Anderson', email: 'noah.a@school.edu.au', joinedAt: '2024-01-11' },
      { id: 'm28', name: 'Grace Thompson', email: 'grace.t@school.edu.au', joinedAt: '2024-01-13' },
      { id: 'm29', name: 'Henry Moore', email: 'henry.m@school.edu.au', joinedAt: '2024-01-14' },
      { id: 'm30', name: 'Lily Young', email: 'lily.y@school.edu.au', joinedAt: '2024-01-16' },
      { id: 'm31', name: 'Jack King', email: 'jack.k@school.edu.au', joinedAt: '2024-01-17' },
      { id: 'm32', name: 'Zoe Wright', email: 'zoe.w@school.edu.au', joinedAt: '2024-01-19' },
      { id: 'm33', name: 'Owen Lopez', email: 'owen.l@school.edu.au', joinedAt: '2024-01-21' },
      { id: 'm34', name: 'Chloe Hill', email: 'chloe.h@school.edu.au', joinedAt: '2024-01-23' },
      { id: 'm35', name: 'Carter Scott', email: 'carter.s@school.edu.au', joinedAt: '2024-01-25' },
      { id: 'm36', name: 'Victoria Green', email: 'victoria.g@school.edu.au', joinedAt: '2024-01-27' },
      { id: 'm37', name: 'Wyatt Adams', email: 'wyatt.a@school.edu.au', joinedAt: '2024-01-29' },
      { id: 'm38', name: 'Natalie Baker', email: 'natalie.b@school.edu.au', joinedAt: '2024-01-31' },
      { id: 'm39', name: 'Ryan Nelson', email: 'ryan.n@school.edu.au', joinedAt: '2024-02-02' },
      { id: 'm40', name: 'Hannah Carter', email: 'hannah.c@school.edu.au', joinedAt: '2024-02-04' },
      { id: 'm41', name: 'Nathan Mitchell', email: 'nathan.m@school.edu.au', joinedAt: '2024-02-06' },
      { id: 'm42', name: 'Avery Perez', email: 'avery.p@school.edu.au', joinedAt: '2024-02-08' },
      { id: 'm43', name: 'Scarlett Roberts', email: 'scarlett.r@school.edu.au', joinedAt: '2024-02-10' },
      { id: 'm44', name: 'David Turner', email: 'david.t@school.edu.au', joinedAt: '2024-02-12' },
      { id: 'm45', name: 'Madison Phillips', email: 'madison.p@school.edu.au', joinedAt: '2024-02-14' },
      { id: 'm46', name: 'Joseph Campbell', email: 'joseph.c@school.edu.au', joinedAt: '2024-02-16' },
      { id: 'm47', name: 'Addison Parker', email: 'addison.p@school.edu.au', joinedAt: '2024-02-18' },
      { id: 'm48', name: 'Samuel Evans', email: 'samuel.e@school.edu.au', joinedAt: '2024-02-20' },
      { id: 'm49', name: 'Aria Edwards', email: 'aria.e@school.edu.au', joinedAt: '2024-02-22' },
      { id: 'm50', name: 'Gabriel Collins', email: 'gabriel.c@school.edu.au', joinedAt: '2024-02-24' },
      { id: 'm51', name: 'Penelope Stewart', email: 'penelope.s@school.edu.au', joinedAt: '2024-02-26' },
      { id: 'm52', name: 'Julian Sanchez', email: 'julian.s@school.edu.au', joinedAt: '2024-02-28' },
      { id: 'm53', name: 'Layla Morris', email: 'layla.m@school.edu.au', joinedAt: '2024-03-01' },
      { id: 'm54', name: 'Levi Rogers', email: 'levi.r@school.edu.au', joinedAt: '2024-03-03' },
      { id: 'm55', name: 'Nora Reed', email: 'nora.r@school.edu.au', joinedAt: '2024-03-05' },
      { id: 'm56', name: 'Isaac Cook', email: 'isaac.c@school.edu.au', joinedAt: '2024-03-07' },
      { id: 'm57', name: 'Riley Morgan', email: 'riley.m@school.edu.au', joinedAt: '2024-03-09' },
      { id: 'm58', name: 'Aubrey Bell', email: 'aubrey.b@school.edu.au', joinedAt: '2024-03-11' },
      { id: 'm59', name: 'Landon Murphy', email: 'landon.m@school.edu.au', joinedAt: '2024-03-13' },
      { id: 'm60', name: 'Savannah Bailey', email: 'savannah.b@school.edu.au', joinedAt: '2024-03-15' },
      { id: 'm61', name: 'Adrian Rivera', email: 'adrian.r@school.edu.au', joinedAt: '2024-03-17' },
      { id: 'm62', name: 'Claire Cooper', email: 'claire.c@school.edu.au', joinedAt: '2024-03-19' },
      { id: 'm63', name: 'Jonathan Richardson', email: 'jonathan.r@school.edu.au', joinedAt: '2024-03-21' },
      { id: 'm64', name: 'Skylar Cox', email: 'skylar.c@school.edu.au', joinedAt: '2024-03-23' },
      { id: 'm65', name: 'Brayden Howard', email: 'brayden.h@school.edu.au', joinedAt: '2024-03-25' },
      { id: 'm66', name: 'Lucy Ward', email: 'lucy.w@school.edu.au', joinedAt: '2024-03-27' },
      { id: 'm67', name: 'Tyler Torres', email: 'tyler.t@school.edu.au', joinedAt: '2024-03-29' },
      { id: 'm68', name: 'Stella Peterson', email: 'stella.p@school.edu.au', joinedAt: '2024-03-31' },
      { id: 'm69', name: 'Dominic Gray', email: 'dominic.g@school.edu.au', joinedAt: '2024-04-02' },
    ],
  },
  {
    id: 'lb-3',
    name: 'House Brennan League',
    color: '#F7DC6F',
    memberCount: 12,
    inviteCode: 'HOUSE-B',
    isOwner: true,
    avatar: '🏠',
    members: [
      { id: 'm70', name: 'Isabella Wilson', email: 'isabella.w@school.edu.au', joinedAt: '2024-01-14' },
      { id: 'm71', name: 'Lucas Moore', email: 'lucas.m@school.edu.au', joinedAt: '2024-01-16' },
      { id: 'm72', name: 'Ava Thompson', email: 'ava.t@school.edu.au', joinedAt: '2024-01-19' },
      { id: 'm73', name: 'Mason Davis', email: 'mason.d@school.edu.au', joinedAt: '2024-01-21' },
      { id: 'm74', name: 'Sophia Miller', email: 'sophia.m@school.edu.au', joinedAt: '2024-01-23' },
      { id: 'm75', name: 'Ethan Garcia', email: 'ethan.g@school.edu.au', joinedAt: '2024-01-25' },
      { id: 'm76', name: 'Olivia Rodriguez', email: 'olivia.r@school.edu.au', joinedAt: '2024-01-27' },
      { id: 'm77', name: 'Liam Martinez', email: 'liam.m@school.edu.au', joinedAt: '2024-01-29' },
      { id: 'm78', name: 'Emma Anderson', email: 'emma.a@school.edu.au', joinedAt: '2024-01-31' },
      { id: 'm79', name: 'Noah Taylor', email: 'noah.t@school.edu.au', joinedAt: '2024-02-02' },
      { id: 'm80', name: 'Charlotte Thomas', email: 'charlotte.t@school.edu.au', joinedAt: '2024-02-04' },
      { id: 'm81', name: 'Jackson Hernandez', email: 'jackson.h@school.edu.au', joinedAt: '2024-02-06' },
    ],
  },
];

function textOn(bg: string): 'black' | 'white' {
  const hex = bg.replace('#', '');
  if (hex.length !== 6) return 'black';
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = chan(r);
  const G = chan(g);
  const B = chan(b);
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  return luminance > 0.5 ? 'black' : 'white';
}

export function PrivateLeaguesTab() {
  const [leaderboards, setLeaderboards] = useState<League[]>(mockLeaderboards);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [viewingMembersId, setViewingMembersId] = useState<string | null>(null);

  const handleUpdate = (id: string, updates: Partial<League>) => {
    setLeaderboards(leaderboards.map(lb => lb.id === id ? { ...lb, ...updates } : lb));
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Private Leagues
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Create and manage your private competitions
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="text-base font-medium">Create League</span>
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg"
        >
          <LogIn className="w-5 h-5" />
          <span className="text-base font-medium">Join League</span>
        </button>
      </div>

      {/* Leagues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {leaderboards.map((league) => (
          <LeagueCard
            key={league.id}
            league={league}
            isEditing={editingId === league.id}
            isInviting={invitingId === league.id}
            onEdit={() => setEditingId(league.id)}
            onInvite={() => setInvitingId(league.id)}
            onUpdate={(updates) => handleUpdate(league.id, updates)}
            onDelete={() => {
              if (confirm('Delete this league?')) {
                setLeaderboards(leaderboards.filter(lb => lb.id !== league.id));
              }
            }}
            onClose={() => {
              setEditingId(null);
              setInvitingId(null);
            }}
            onViewMembers={() => setViewingMembersId(league.id)}
          />
        ))}
      </div>

      {leaderboards.length === 0 && (
        <div className="text-center py-24 text-gray-400 dark:text-gray-600">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No leagues yet</p>
        </div>
      )}

      {/* View Members Modal */}
      {viewingMembersId && (
        <ViewMembersModal
          league={leaderboards.find(lb => lb.id === viewingMembersId)!}
          onClose={() => setViewingMembersId(null)}
          onRemoveMember={(leagueId, memberId) => {
            setLeaderboards(leaderboards.map(lb => {
              if (lb.id === leagueId) {
                const updatedMembers = (lb.members || []).filter(m => m.id !== memberId);
                return {
                  ...lb,
                  members: updatedMembers,
                  memberCount: updatedMembers.length,
                };
              }
              return lb;
            }));
          }}
        />
      )}

      {/* Create League Modal */}
      {showCreateModal && (
        <CreateLeagueModal
          onCreate={(league) => {
            setLeaderboards([...leaderboards, league]);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Join League Modal */}
      {showJoinModal && (
        <JoinLeagueModal
          onJoin={(league) => {
            // Check if already exists
            if (!leaderboards.find(lb => lb.id === league.id)) {
              setLeaderboards([...leaderboards, league]);
            }
            setShowJoinModal(false);
          }}
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </div>
  );
}

function LeagueCard({
  league,
  isEditing,
  isInviting,
  onEdit,
  onInvite,
  onUpdate,
  onDelete,
  onClose,
  onViewMembers,
}: {
  league: League;
  isEditing: boolean;
  isInviting: boolean;
  onEdit: () => void;
  onInvite: () => void;
  onUpdate: (updates: Partial<League>) => void;
  onDelete: () => void;
  onClose: () => void;
  onViewMembers: () => void;
}) {
  const textColor = textOn(league.color);
  const textClass = textColor === 'white' ? 'text-white' : 'text-gray-900';
  const [isHovered, setIsHovered] = useState(false);

  if (isEditing) {
    return <EditLeagueCard league={league} onUpdate={onUpdate} onClose={onClose} />;
  }

  if (isInviting) {
    return <InviteLeagueCard league={league} onClose={onClose} />;
  }

  return (
    <motion.div
      className="rounded-3xl p-6 relative group h-full overflow-hidden cursor-pointer"
      style={{ backgroundColor: league.color }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        rotate: 1.4,
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      <div className={`${textClass} flex items-start justify-between mb-4 relative z-10`}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            {league.avatar && (
              <span className="text-3xl openmoji">{league.avatar}</span>
            )}
            <h3 className="text-2xl font-bold">{league.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Users className="w-4 h-4" />
            <span>{league.memberCount} members</span>
          </div>
        </div>
        {league.isOwner && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className={`${textClass} p-2 hover:opacity-70 transition-opacity`}
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className={`${textClass} p-2 hover:opacity-70 transition-opacity`}
              title="Delete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        <button
          onClick={onViewMembers}
          className={`w-full px-4 py-2 rounded-full font-medium ${textClass} bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-colors flex items-center justify-center gap-2`}
        >
          <Eye className="w-4 h-4" />
          View Members
        </button>
        {league.isOwner && (
          <button
            onClick={onInvite}
            className={`w-full px-4 py-2 rounded-full font-medium ${textClass} bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-colors flex items-center justify-center gap-2`}
          >
            <Mail className="w-4 h-4" />
            Invite Members
          </button>
        )}
      </div>
    </motion.div>
  );
}

function EditLeagueCard({
  league,
  onUpdate,
  onClose,
}: {
  league: League;
  onUpdate: (updates: Partial<League>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(league.name);
  const [color, setColor] = useState(league.color);
  const [avatar, setAvatar] = useState(league.avatar || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSave = () => {
    onUpdate({ name, color, avatar: avatar || undefined });
  };

  const popularEmojis = [
    // Animals & Nature (from OpenMoji)
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦅',
    '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
    '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖',
    '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬',
    '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘',
    '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄',
    '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮',
    '🐈', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️',
    '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️',
    '🌲', '🌳', '🌴', '🌵', '🌶️', '🌾', '🌿', '☘️', '🍀', '🍁',
    '🍂', '🍃', '🌺', '🌻', '🌹', '🌷', '🌼', '🌸', '💐',
    // Sports & Activities
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣',
    '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂',
    '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊',
    // Objects & Symbols
    '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎫', '🎟️', '🎪',
    '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺',
    '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
    // Education & Learning
    '📚', '📖', '📓', '📒', '📔', '📕', '📗', '📘', '📙', '📃',
    '📄', '📜', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '💴', '💵',
    '💶', '💷', '💸', '💳', '🧾', '💹', '📊', '📈', '📉', '📇',
    '📅', '📆', '🗓️', '🗒️', '📝', '✏️', '✒️', '🖊️', '🖋️',
    '📏', '📐', '📌', '📍', '📎', '🖇️', '🗃️', '🗄️', '🗂️', '📁',
    '📂', '🔗',
  ];

  return (
    <div className="rounded-3xl border-2 border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit League</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            League Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Avatar
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center text-3xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {avatar || '🎯'}
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={avatar}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow single emoji only
                  if (val === '' || /^[\p{Emoji}]$/u.test(val)) {
                    setAvatar(val);
                  }
                }}
                placeholder="Enter emoji"
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-center text-2xl"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                Choose an emoji to represent your league
              </p>
            </div>
          </div>
          
          {showEmojiPicker && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Pick</p>
                <a
                  href="https://openmoji.org/library/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Browse OpenMoji →
                </a>
              </div>
              <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto pr-2">
                {popularEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setAvatar(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className={`w-10 h-10 rounded-full text-xl hover:scale-110 transition-transform flex items-center justify-center openmoji ${
                      avatar === emoji ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {leagueColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-full aspect-square rounded-full border-2 transition-all ${
                  color === c
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-gray-300 dark:border-gray-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteLeagueCard({
  league,
  onClose,
}: {
  league: League;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${league.inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(league.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmailInvite = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would send an email
    alert(`Invite sent to ${email}`);
    setEmail('');
  };

  return (
    <div className="rounded-3xl border-2 border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Invite Members</h3>
      
      <div className="space-y-6">
        {/* Email Invite */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Invite by Email
          </label>
          <form onSubmit={handleEmailInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu.au"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </form>
        </div>

        {/* Invite Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Invite Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-full font-mono text-lg font-bold text-gray-900 dark:text-white text-center">
              {league.inviteCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Share this code with members to join
          </p>
        </div>

        {/* Invite Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Invite Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function JoinLeagueModal({
  onJoin,
  onClose,
}: {
  onJoin: (league: League) => void;
  onClose: () => void;
}) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/leaderboards/join-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join league');
      }

      const data = await response.json();
      
      // Create a league object from the response
      // In production, you'd fetch the full league details
      const joinedLeague: League = {
        id: data.leaderboard.id,
        name: data.leaderboard.name,
        color: leagueColors[Math.floor(Math.random() * leagueColors.length)],
        memberCount: 1, // Will be updated when fetching full details
        inviteCode: inviteCode.trim().toUpperCase(),
        isOwner: false,
      };

      onJoin(joinedLeague);
      setInviteCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to join league');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Join League
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="Enter invite code"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-center text-lg tracking-wider"
              required
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 px-4">
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-4">
              Enter the invite code provided by the league creator
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !inviteCode.trim()}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Join League
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewMembersModal({
  league,
  onClose,
  onRemoveMember,
}: {
  league: League;
  onClose: () => void;
  onRemoveMember: (leagueId: string, memberId: string) => void;
}) {
  const members = league.members || [];
  const textColor = textOn(league.color);
  const textClass = textColor === 'white' ? 'text-white' : 'text-gray-900';
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = (memberId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from ${league.name}?`)) {
      setRemovingId(memberId);
      setTimeout(() => {
        onRemoveMember(league.id, memberId);
        setRemovingId(null);
      }, 300);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl openmoji"
                style={{ backgroundColor: league.color }}
              >
                {league.avatar || <Users className={`w-6 h-6 ${textClass}`} />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {league.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: removingId === member.id ? 0 : 1, 
                      x: removingId === member.id ? -100 : 0,
                      scale: removingId === member.id ? 0.8 : 1,
                    }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {member.email}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                      Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    {league.isOwner && (
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        disabled={removingId === member.id}
                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 flex-shrink-0"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No members yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CreateLeagueModal({
  onCreate,
  onClose,
}: {
  onCreate: (league: League) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(leagueColors[0]);
  const [avatar, setAvatar] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || `LEAGUE${Date.now().toString().slice(-4)}`;

    onCreate({
      id: `lb-${Date.now()}`,
      name,
      color,
      memberCount: 0,
      inviteCode: code,
      isOwner: true,
      avatar: avatar || undefined,
    });

    setName('');
    setColor(leagueColors[0]);
    setAvatar('');
  };

  const popularEmojis = [
    // Animals & Nature (from OpenMoji)
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦅',
    '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
    '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖',
    '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬',
    '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘',
    '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄',
    '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮',
    '🐈', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️',
    '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️',
    '🌲', '🌳', '🌴', '🌵', '🌶️', '🌾', '🌿', '☘️', '🍀', '🍁',
    '🍂', '🍃', '🌺', '🌻', '🌹', '🌷', '🌼', '🌸', '💐',
    // Sports & Activities
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣',
    '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂',
    '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊',
    // Objects & Symbols
    '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎫', '🎟️', '🎪',
    '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺',
    '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
    // Education & Learning
    '📚', '📖', '📓', '📒', '📔', '📕', '📗', '📘', '📙', '📃',
    '📄', '📜', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '💴', '💵',
    '💶', '💷', '💸', '💳', '🧾', '💹', '📊', '📈', '📉', '📇',
    '📅', '📆', '🗓️', '🗒️', '📝', '✏️', '✒️', '🖊️', '🖋️',
    '📏', '📐', '📌', '📍', '📎', '🖇️', '🗃️', '🗄️', '🗂️', '📁',
    '📂', '🔗',
  ];

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full"
      >
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Create League
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              League Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Maths Challenge"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center text-3xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors openmoji"
              >
                {avatar || '🎯'}
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow single emoji only
                    if (val === '' || /^[\p{Emoji}]$/u.test(val)) {
                      setAvatar(val);
                    }
                  }}
                  placeholder="Enter emoji"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-center text-2xl openmoji"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Choose an emoji to represent your league
                </p>
              </div>
            </div>
            
            {showEmojiPicker && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Pick</p>
                  <a
                    href="https://openmoji.org/library/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Browse OpenMoji →
                  </a>
                </div>
                <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto pr-2">
                  {popularEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setAvatar(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className={`w-10 h-10 rounded-full text-xl hover:scale-110 transition-transform flex items-center justify-center ${
                        avatar === emoji ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {leagueColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full aspect-square rounded-full border-2 transition-all ${
                    color === c
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-gray-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Create League
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


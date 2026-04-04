'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Tables } from '@/lib/supabase/types';

type Profile = Tables<'profiles'>;

interface SignalCard {
  id: string;
  type: 'cert_alert' | 'unread_messages' | 'forum_activity' | 'review_signal' | 'pay_data';
  priority: number; // lower = higher priority
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  href: string;
  borderClass: string;
}

interface OnboardingStatus {
  profileComplete: boolean;
  hasCerts: boolean;
  hasSeaTime: boolean;
  hasCompanyFollows: boolean;
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [signals, setSignals] = useState<SignalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [portModalOpen, setPortModalOpen] = useState(false);
  const [portName, setPortName] = useState('');
  const [joiningPort, setJoiningPort] = useState(false);
  const [activePortCount, setActivePortCount] = useState(0);
  const [onboarding, setOnboarding] = useState<OnboardingStatus>({
    profileComplete: false,
    hasCerts: false,
    hasSeaTime: false,
    hasCompanyFollows: false,
  });

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!prof) { router.push('/profile/setup'); return; }
    setProfile(prof);

    const cards: SignalCard[] = [];

    // 1. Certificate alerts
    const { data: certs } = await supabase
      .from('certificates')
      .select('*')
      .eq('profile_id', prof.id)
      .neq('status', 'valid');

    if (certs) {
      for (const cert of certs) {
        const isExpired = cert.status === 'expired';
        let daysText = '';
        if (cert.expiry_date) {
          const days = Math.ceil(
            (new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          daysText = isExpired
            ? `Expired ${Math.abs(days)} days ago`
            : `Expires in ${days} days`;
        }
        cards.push({
          id: `cert-${cert.id}`,
          type: 'cert_alert',
          priority: isExpired ? 0 : 1,
          icon: isExpired ? '\u26A0' : '\u23F0',
          title: `Your ${cert.title} ${isExpired ? 'has expired' : 'is expiring soon'}`,
          description: daysText || (isExpired ? 'Certificate expired' : 'Certificate expiring'),
          timestamp: cert.updated_at,
          href: '/certs',
          borderClass: isExpired ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-500',
        });
      }
    }

    // 2. Unread messages
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('profile_id', prof.id);

    if (memberships && memberships.length > 0) {
      const convIds = memberships.map(m => m.conversation_id);
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, last_message_at, name, last_message_preview')
        .in('id', convIds);

      if (convos) {
        let unreadCount = 0;
        let latestUnreadAt = '';
        for (const conv of convos) {
          const membership = memberships.find(m => m.conversation_id === conv.id);
          if (
            conv.last_message_at &&
            (!membership?.last_read_at || conv.last_message_at > membership.last_read_at)
          ) {
            unreadCount++;
            if (!latestUnreadAt || conv.last_message_at > latestUnreadAt) {
              latestUnreadAt = conv.last_message_at;
            }
          }
        }
        if (unreadCount > 0) {
          cards.push({
            id: 'unread-messages',
            type: 'unread_messages',
            priority: 1,
            icon: '\u2709',
            title: `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
            description: 'You have conversations waiting for your reply',
            timestamp: latestUnreadAt,
            href: '/messages',
            borderClass: 'border-l-4 border-l-teal-500',
          });
        }
      }
    }

    // 3. Forum activity (recent posts in categories matching user department)
    if (prof.department_tag) {
      const { data: categories } = await supabase
        .from('forum_categories')
        .select('id, name, slug');

      if (categories) {
        const deptKeyword = prof.department_tag.toLowerCase();
        const matchedCategories = categories.filter(
          c => c.name.toLowerCase().includes(deptKeyword) || c.slug.toLowerCase().includes(deptKeyword)
        );

        if (matchedCategories.length > 0) {
          const catIds = matchedCategories.map(c => c.id);
          const { data: recentPosts } = await supabase
            .from('forum_posts')
            .select('id, title, category_id, created_at')
            .in('category_id', catIds)
            .is('parent_id', null)
            .order('created_at', { ascending: false })
            .limit(3);

          if (recentPosts) {
            for (const post of recentPosts) {
              const cat = matchedCategories.find(c => c.id === post.category_id);
              cards.push({
                id: `forum-${post.id}`,
                type: 'forum_activity',
                priority: 3,
                icon: '\uD83D\uDCAC',
                title: post.title || 'New discussion',
                description: `New discussion in ${cat?.name || 'forum'}`,
                timestamp: post.created_at,
                href: `/forums/post/${post.id}`,
                borderClass: '',
              });
            }
          }
        }
      }
    }

    // 4. Review signals (reviews on companies from user's crew history)
    const { data: crewHistory } = await supabase
      .from('crew_history')
      .select('company_id')
      .eq('profile_id', prof.id);

    if (crewHistory) {
      const companyIds = crewHistory
        .map(ch => ch.company_id)
        .filter((id): id is string => id !== null);

      if (companyIds.length > 0) {
        const uniqueCompanyIds = [...new Set(companyIds)];
        const { data: recentReviews } = await supabase
          .from('reviews')
          .select('id, company_id, review_type, created_at, status')
          .in('company_id', uniqueCompanyIds)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentReviews) {
          // Get company names
          const { data: companies } = await supabase
            .from('companies')
            .select('id, name')
            .in('id', uniqueCompanyIds);

          for (const review of recentReviews) {
            const company = companies?.find(c => c.id === review.company_id);
            cards.push({
              id: `review-${review.id}`,
              type: 'review_signal',
              priority: 4,
              icon: '\u2B50',
              title: `New ${review.review_type} review`,
              description: `Recent review on ${company?.name || 'a company from your history'}`,
              timestamp: review.created_at,
              href: `/companies/${review.company_id}`,
              borderClass: '',
            });
          }
        }
      }
    }

    // 5. Pay data matching user's rank/vessel type
    if (prof.rank_range || (prof.vessel_type_tags && prof.vessel_type_tags.length > 0)) {
      let payQuery = supabase
        .from('pay_reports')
        .select('id, rank, vessel_type, monthly_base_usd, year, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (prof.vessel_type_tags && prof.vessel_type_tags.length > 0) {
        payQuery = payQuery.in('vessel_type', prof.vessel_type_tags);
      }

      const { data: payReports } = await payQuery;
      if (payReports) {
        for (const report of payReports) {
          cards.push({
            id: `pay-${report.id}`,
            type: 'pay_data',
            priority: 5,
            icon: '\uD83D\uDCB0',
            title: `Pay report: ${report.rank} on ${report.vessel_type?.replace(/_/g, ' ')}`,
            description: `$${report.monthly_base_usd.toLocaleString()}/mo (${report.year})`,
            timestamp: report.created_at,
            href: '/pay',
            borderClass: '',
          });
        }
      }
    }

    // 6. Count active port channels
    const { count: portCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'port_channel');

    setActivePortCount(portCount ?? 0);

    // 7. Onboarding completion checks
    const profileComplete = !!(prof.department_tag && prof.rank_range);

    const { count: certCount } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', prof.id);

    const { count: seaTimeCount } = await supabase
      .from('sea_time_records')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', prof.id);

    const { count: followCount } = await supabase
      .from('company_follows')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', prof.id);

    setOnboarding({
      profileComplete,
      hasCerts: (certCount ?? 0) > 0,
      hasSeaTime: (seaTimeCount ?? 0) > 0,
      hasCompanyFollows: (followCount ?? 0) > 0,
    });

    setSignals(cards);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedSignals = useMemo(() => {
    return [...signals].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [signals]);

  const handleJoinPort = async () => {
    if (!portName.trim() || !profile) return;
    setJoiningPort(true);

    try {
      const normalizedPort = portName.trim();

      // Look for existing port channel
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('type', 'port_channel')
        .eq('context_port', normalizedPort)
        .limit(1)
        .single();

      let conversationId: string;

      if (existing) {
        conversationId = existing.id;
      } else {
        // Create new port channel
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            type: 'port_channel' as const,
            name: `Port: ${normalizedPort}`,
            context_port: normalizedPort,
            created_by: profile.id,
          })
          .select('id')
          .single();

        if (createError || !newConv) {
          console.error('Failed to create port channel:', createError);
          setJoiningPort(false);
          return;
        }
        conversationId = newConv.id;
      }

      // Add user as member (ignore if already exists)
      await supabase
        .from('conversation_members')
        .upsert(
          {
            conversation_id: conversationId,
            profile_id: profile.id,
            role: 'member',
          },
          { onConflict: 'conversation_id,profile_id' }
        );

      setPortModalOpen(false);
      setPortName('');
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error('Error joining port channel:', err);
    } finally {
      setJoiningPort(false);
    }
  };

  const completedCount = [
    onboarding.profileComplete,
    onboarding.hasCerts,
    onboarding.hasSeaTime,
    onboarding.hasCompanyFollows,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-48 bg-navy-800/50 rounded-lg animate-pulse" />
        </div>
        {/* Large Port Beacon skeleton */}
        <div className="h-16 bg-navy-800/50 rounded-lg animate-pulse mb-6" />
        {/* Staggered medium skeleton cards */}
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="h-14 bg-navy-800/50 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '1.5s' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.display_name || 'Seafarer';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          The Pulse
        </h1>
        <p className="text-slate-400 text-sm">
          Welcome back, {displayName}
          {' \u00B7 '}
          {signals.length > 0 ? `${signals.length} signal${signals.length > 1 ? 's' : ''}` : 'All quiet'}
        </p>
      </div>

      {/* Port Beacon */}
      <div className="mb-6">
        <button
          onClick={() => setPortModalOpen(true)}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 relative"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          I&apos;m in Port
          {activePortCount > 0 && (
            <span className="ml-2 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activePortCount} active
            </span>
          )}
        </button>
      </div>

      {/* Port Beacon Modal */}
      {portModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold mb-1">Join a Port Channel</h2>
            <p className="text-slate-400 text-sm mb-4">
              Connect with other seafarers at your port.
            </p>
            <input
              type="text"
              value={portName}
              onChange={e => setPortName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleJoinPort(); }}
              placeholder="Enter port name (e.g. Rotterdam, Singapore)"
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleJoinPort}
                disabled={!portName.trim() || joiningPort}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {joiningPort ? 'Joining...' : 'Join Channel'}
              </button>
              <button
                onClick={() => { setPortModalOpen(false); setPortName(''); }}
                className="px-4 py-2.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signal Feed */}
      {sortedSignals.length === 0 ? (
        <div className="py-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-1">
              Welcome aboard, {displayName}!
            </h2>
            <p className="text-slate-400 text-sm">
              Your Pulse feed is quiet — let&apos;s change that. Complete these steps to unlock your full SeaSignal experience.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">
                {completedCount} of 5 complete
              </span>
              <span className="text-xs text-slate-500">
                {Math.round((completedCount / 5) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Onboarding checklist */}
          <div className="space-y-3">
            <OnboardingItem
              completed={onboarding.profileComplete}
              title="Complete your profile"
              description="Set your rank, department, and vessel type preferences"
              href="/profile/edit"
            />
            <OnboardingItem
              completed={onboarding.hasCerts}
              title="Add your certificates"
              description="Track expiry dates and get timely alerts"
              href="/certs"
            />
            <OnboardingItem
              completed={onboarding.hasSeaTime}
              title="Log your sea time"
              description="Build your career record and track STCW progress"
              href="/sea-time"
            />
            <OnboardingItem
              completed={onboarding.hasCompanyFollows}
              title="Browse companies"
              description="Follow companies you've worked with"
              href="/companies"
            />
            <OnboardingItem
              completed={false}
              title="Join the forums"
              description="Connect with fellow seafarers"
              href="/forums"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSignals.map((signal, index) => (
            <Link
              key={signal.id}
              href={signal.href}
              className={`block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-teal-500/30 transition-all ${signal.borderClass} animate-signal-in`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{signal.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-100 leading-tight">
                      {signal.title}
                    </h3>
                    {(signal.type === 'cert_alert' || signal.type === 'unread_messages') && (
                      <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-teal-400 animate-pulse-dot" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{signal.description}</p>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {formatTimestamp(signal.timestamp)}
                  </p>
                </div>
                <svg className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/reviews/new" label="Write Review" />
          <QuickAction href="/pay" label="Check Pay Data" />
          <QuickAction href="/companies" label="Browse Companies" />
          <QuickAction href="/forums" label="Visit Forums" />
          <QuickAction href="/certs" label="Manage Certs" />
          <QuickAction href="/vessels" label="Browse Vessels" />
          <QuickAction href="/incidents" label="Log Incident" />
          <QuickAction href="/messages" label="Messages" />
        </div>
      </div>
    </div>
  );
}

function OnboardingItem({
  completed,
  title,
  description,
  href,
}: {
  completed: boolean;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 bg-teal-500/5 border border-navy-700 rounded-lg p-4 hover:border-teal-500/30 transition-all ${completed ? 'opacity-60' : ''}`}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {completed ? (
          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-teal-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold leading-tight ${completed ? 'text-slate-400' : 'text-slate-100'}`}>
          {title}
        </h3>
        <p className={`text-xs mt-0.5 ${completed ? 'text-slate-500' : 'text-slate-400'}`}>
          {description}
        </p>
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center px-3 py-3 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-300 hover:text-teal-400 hover:border-teal-500/30 transition-colors text-center"
    >
      {label}
    </Link>
  );
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Beat the Bet - Recovery App
// Uses React, ReactDOM, and Lucide icons from CDN

const { useState, useEffect } = React;
const { Clock, AlertCircle, Phone, MapPin, LifeBuoy, Home, Info, Sparkles, TrendingUp, DollarSign, ShoppingBag, BarChart3, Lock, ArrowLeft, ChevronRight, Users, User, Download, X } = lucide;

// Supabase Configuration
const SUPABASE_URL = 'https://emrpkubjspydnbrittuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcnBrdWJqc3B5ZG5icml0dHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTE1MjQsImV4cCI6MjA5NTIyNzUyNH0.wyrwYfXyOZgdS3NnK7z-kTU-KwbfOH_TF1vv6CsNCmI';

// ============================================================
// Supabase Client
// ============================================================
const supabase = (() => {
  let _session = null;

  const getSession = () => {
    if (_session) return _session;
    const saved = localStorage.getItem('sb_session');
    if (saved) { _session = JSON.parse(saved); }
    return _session;
  };

  const saveSession = (session) => {
    _session = session;
    if (session) {
      localStorage.setItem('sb_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('sb_session');
    }
  };

  const authHeaders = () => {
    const session = getSession();
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session ? session.access_token : SUPABASE_ANON_KEY}`
    };
  };

  const dbHeaders = () => authHeaders();

  return {
    getSession,

    auth: {
      signUp: async ({ email, password }) => {
        try {
          const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data };
          if (data.access_token) saveSession(data);
          return { data, error: null };
        } catch (e) {
          return { data: null, error: { message: e.message } };
        }
      },

      signInWithPassword: async ({ email, password }) => {
        try {
          const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data };
          if (data.access_token) saveSession(data);
          return { data, error: null };
        } catch (e) {
          return { data: null, error: { message: e.message } };
        }
      },

      signOut: async () => {
        try {
          const session = getSession();
          if (session) {
            await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.access_token}`
              }
            });
          }
        } catch (e) {}
        saveSession(null);
        return { error: null };
      },

      getUser: () => {
        const session = getSession();
        if (!session) return null;
        return session.user || null;
      }
    },

    // Database helpers
    from: (table) => ({
      select: (cols = '*') => ({
        eq: async (col, val) => {
          try {
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}&select=${cols}`,
              { headers: dbHeaders() }
            );
            const data = await res.json();
            if (!res.ok) return { data: null, error: data };
            return { data, error: null };
          } catch (e) { return { data: null, error: { message: e.message } }; }
        },
        maybeSingle: async () => {
          try {
            const session = getSession();
            if (!session) return { data: null, error: null };
            const uid = session.user.id;
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${uid}&select=${cols}&limit=1`,
              { headers: dbHeaders() }
            );
            const data = await res.json();
            if (!res.ok) return { data: null, error: data };
            return { data: data[0] || null, error: null };
          } catch (e) { return { data: null, error: { message: e.message } }; }
        }
      }),

      upsert: async (row, opts = {}) => {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              ...dbHeaders(),
              'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(row)
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data };
          return { data, error: null };
        } catch (e) { return { data: null, error: { message: e.message } }; }
      },

      insert: async (row) => {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: { ...dbHeaders(), 'Prefer': 'return=representation' },
            body: JSON.stringify(row)
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data };
          return { data, error: null };
        } catch (e) { return { data: null, error: { message: e.message } }; }
      },

      update: (vals) => ({
        eq: async (col, val) => {
          try {
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`,
              {
                method: 'PATCH',
                headers: { ...dbHeaders(), 'Prefer': 'return=representation' },
                body: JSON.stringify(vals)
              }
            );
            const data = await res.json();
            if (!res.ok) return { data: null, error: data };
            return { data, error: null };
          } catch (e) { return { data: null, error: { message: e.message } }; }
        }
      }),

      delete: () => ({
        eq: async (col, val) => {
          try {
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`,
              { method: 'DELETE', headers: dbHeaders() }
            );
            if (!res.ok) {
              const data = await res.json();
              return { error: data };
            }
            return { error: null };
          } catch (e) { return { error: { message: e.message } }; }
        }
      })
    }),

    // Realtime subscription for chat
    realtime: {
      subscribeToMessages: (room, callback) => {
        // Poll every 3 seconds as a realtime substitute
        // (True Supabase realtime requires websocket which needs the JS SDK)
        const interval = setInterval(async () => {
          try {
            const session = localStorage.getItem('sb_session');
            const token = session ? JSON.parse(session).access_token : SUPABASE_ANON_KEY;
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/messages?room=eq.${encodeURIComponent(room)}&order=created_at.asc&limit=50`,
              {
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            if (res.ok) {
              const data = await res.json();
              callback(data);
            }
          } catch (e) {}
        }, 3000);
        return () => clearInterval(interval);
      }
    },

    // Storage helpers
    storage: {
      from: (bucket) => ({
        upload: async (path, file) => {
          try {
            const session = getSession();
            const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session ? session.access_token : SUPABASE_ANON_KEY}`,
                'Content-Type': file.type
              },
              body: file
            });
            const data = await res.json();
            if (!res.ok) return { data: null, error: data };
            return { data, error: null };
          } catch (e) { return { data: null, error: { message: e.message } }; }
        },
        getPublicUrl: (path) => {
          return { data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/why-quitting-photos/${path}` } };
        },
        createSignedUrl: async (path, expiresIn = 3600) => {
          try {
            const session = getSession();
            const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session ? session.access_token : SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ expiresIn })
            });
            const data = await res.json();
            if (!res.ok) return { data: null, error: data };
            return { data: { signedUrl: `${SUPABASE_URL}/storage/v1${data.signedURL}` }, error: null };
          } catch (e) { return { data: null, error: { message: e.message } }; }
        }
      })
    }
  };
})();

/**
 * REMINDER FOR FUTURE DEVELOPMENT:
 * 
 * Savings Calculator "What You're Protecting" — liabilities and goals tracker.
 * Current approach shows unlockable items (coffee, lunches, gadgets) as rewards.
 * 
 * ISSUE: This could promote spending instead of saving, which contradicts financial recovery goals.
 * 
 * BETTER APPROACH TO IMPLEMENT:
 * - Focus on debt payoff milestones (credit card, loans, mortgage payments covered)
 * - Emergency fund building (3 months expenses, 6 months expenses)
 * - Investment milestones (first $1000 saved, first $5000, etc.)
 * - Bills paid ahead (utilities, rent, car payments)
 * - Meaningful savings goals (house deposit, education fund, retirement contribution)
 * 
 * The unlock/progression mechanic is good for motivation, but items should encourage 
 * financial stability and savings, not consumption.
 */


function AdminPanel({ adminEmails, setAdminEmails, setActiveTool, showSuccess, showError, validators }) {
  const [criticalQueue, setCriticalQueue] = React.useState([]);
  const [highQueue, setHighQueue] = React.useState([]);
  const [supportQueue, setSupportQueue] = React.useState([]);
  const [userStats, setUserStats] = React.useState(null);
  const [localAdminEmails, setLocalAdminEmails] = React.useState(adminEmails);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');
  const [newAdminEmail, setNewAdminEmail] = React.useState('');
  const [activeAdminTab, setActiveAdminTab] = React.useState('critical');
  const isFetching = React.useRef(false);

  const CACHE_KEY = 'btb_admin_cache';

  // Load from sessionStorage cache instantly on mount
  React.useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const c = JSON.parse(cached);
        if (c.criticalQueue) setCriticalQueue(c.criticalQueue);
        if (c.highQueue) setHighQueue(c.highQueue);
        if (c.supportQueue) setSupportQueue(c.supportQueue);
        if (c.userStats) setUserStats(c.userStats);
        if (c.adminEmails) setLocalAdminEmails(c.adminEmails);
        setLoaded(true);
        return; // Don't fetch again - user can hit Refresh manually
      }
    } catch (e) {}
    // No cache - do initial load
    loadData();
  }, []);

  const loadData = React.useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setLoadError('');

    const session = supabase.getSession();
    if (!session) {
      setLoading(false);
      isFetching.current = false;
      setLoadError('Not logged in.');
      return;
    }

    const token = session.access_token;
    const h = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` };
    const safe = (promise) => promise.catch(() => ({ ok: false, data: [] }));

    try {
      const [critRes, highRes, suppRes, usersRes, adminsRes] = await Promise.all([
        safe(fetch(`${SUPABASE_URL}/rest/v1/messages?flagged=eq.true&moderation_level=eq.critical&reviewed=eq.false&order=created_at.desc&limit=50`, { headers: h }).then(async r => ({ ok: r.ok, data: await r.json() }))),
        safe(fetch(`${SUPABASE_URL}/rest/v1/messages?flagged=eq.true&moderation_level=eq.high&reviewed=eq.false&order=created_at.desc&limit=50`, { headers: h }).then(async r => ({ ok: r.ok, data: await r.json() }))),
        safe(fetch(`${SUPABASE_URL}/rest/v1/messages?moderation_level=eq.support&reviewed=eq.false&order=created_at.desc&limit=50`, { headers: h }).then(async r => ({ ok: r.ok, data: await r.json() }))),
        safe(fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,created_at,points,level&order=created_at.desc&limit=100`, { headers: h }).then(async r => ({ ok: r.ok, data: await r.json() }))),
        safe(fetch(`${SUPABASE_URL}/rest/v1/admins?select=email,added_at&order=added_at.asc`, { headers: h }).then(async r => ({ ok: r.ok, data: await r.json() }))),
      ]);

      const crit = critRes.ok && Array.isArray(critRes.data) ? critRes.data : [];
      const high = highRes.ok && Array.isArray(highRes.data) ? highRes.data : [];
      const supp = suppRes.ok && Array.isArray(suppRes.data) ? suppRes.data : [];
      const users = usersRes.ok && Array.isArray(usersRes.data) ? usersRes.data : [];
      const admins = adminsRes.ok && Array.isArray(adminsRes.data) ? adminsRes.data.map(a => a.email) : localAdminEmails;

      setCriticalQueue(crit);
      setHighQueue(high);
      setSupportQueue(supp);
      setUserStats({ total: users.length, users });
      setLocalAdminEmails(admins);
      setAdminEmails(admins);
      localStorage.setItem('adminEmails', JSON.stringify(admins));

      // Cache to sessionStorage so remounts don't re-fetch
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          criticalQueue: crit, highQueue: high, supportQueue: supp,
          userStats: { total: users.length, users }, adminEmails: admins
        }));
      } catch (e) {}

      if (!critRes.ok && !highRes.ok) {
        setLoadError('Could not load messages. Make sure admin_fix.sql has been run.');
      }
    } catch (e) {
      setLoadError(`Error: ${e.message}`);
    } finally {
      isFetching.current = false;
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  const approveMessage = async (msg) => {
    const session = supabase.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${msg.id}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged: false, reviewed: true })
    });
    setCriticalQueue(p => p.filter(m => m.id !== msg.id));
    setHighQueue(p => p.filter(m => m.id !== msg.id));
    setSupportQueue(p => p.filter(m => m.id !== msg.id));
    showSuccess('Message restored.');
  };

  const deleteMessage = async (msg) => {
    const session = supabase.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${msg.id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.access_token}` }
    });
    setCriticalQueue(p => p.filter(m => m.id !== msg.id));
    setHighQueue(p => p.filter(m => m.id !== msg.id));
    setSupportQueue(p => p.filter(m => m.id !== msg.id));
    showSuccess('Message deleted.');
  };

  const addAdminEmail = async () => {
    const trimmed = newAdminEmail.trim().toLowerCase();
    if (!trimmed || !validators.email(trimmed)) { showError('Enter a valid email.'); return; }
    if (localAdminEmails.includes(trimmed)) { showError('Already an admin.'); return; }
    const session = supabase.getSession();
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/admins`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ email: trimmed })
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showError(e.message || 'Failed to add admin.'); return; }
      const updated = [...localAdminEmails, trimmed];
      setLocalAdminEmails(updated);
      setAdminEmails(updated);
      localStorage.setItem('adminEmails', JSON.stringify(updated));
      setNewAdminEmail('');
      showSuccess(`${trimmed} added as admin.`);
    } catch (e) { showError('Failed to add admin.'); }
  };

  const removeAdminEmail = async (email) => {
    const session = supabase.getSession();
    if (session && session.user.email.toLowerCase() === email.toLowerCase()) { showError("You can't remove yourself."); return; }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/admins?email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.access_token}` }
      });
      const updated = localAdminEmails.filter(e => e !== email);
      setLocalAdminEmails(updated);
      setAdminEmails(updated);
      localStorage.setItem('adminEmails', JSON.stringify(updated));
      showSuccess('Admin removed.');
    } catch (e) { showError('Failed to remove admin.'); }
  };

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const QueueView = ({ msgs, type }) => {
    const borderMap = { critical: 'border-red-400', high: 'border-orange-400', support: 'border-blue-400' };
    const labelMap = {
      critical: 'Auto-hidden — requires review',
      high: 'Flagged — visible to users, needs review',
      support: 'Support queue — user may need help'
    };
    const bgMap = { critical: 'bg-red-50 text-red-800', high: 'bg-orange-50 text-orange-800', support: 'bg-blue-50 text-blue-800' };
    return (
      <div className="space-y-4">
        <div className={`rounded-lg p-3 text-sm font-medium ${bgMap[type]}`}>
          {labelMap[type]} · {msgs.length} item{msgs.length !== 1 ? 's' : ''}
        </div>
        {msgs.length === 0 && <p className="text-center text-gray-400 py-8">Nothing in this queue.</p>}
        {msgs.map(msg => (
          <div key={msg.id} className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${borderMap[type]}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{msg.username}</p>
                <p className="text-xs text-gray-400">{formatDate(msg.created_at)} · #{msg.room}</p>
              </div>
              {msg.moderation_score && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{msg.moderation_score}% confidence</span>
              )}
            </div>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mb-2 text-sm">{msg.message}</p>
            {msg.moderation_reason && <p className="text-xs text-gray-500 mb-1"><strong>Reason:</strong> {msg.moderation_reason}</p>}
            {msg.moderation_matched && <p className="text-xs text-gray-500 mb-3"><strong>Matched:</strong> "{msg.moderation_matched}"</p>}
            <div className="flex gap-2">
              <button onClick={() => approveMessage(msg)} className={`flex-1 ${type === 'support' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg py-2 font-semibold text-sm`}>
                {type === 'support' ? 'Mark Reviewed' : 'Restore'}
              </button>
              <button onClick={() => deleteMessage(msg)} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 font-semibold text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-900 text-white p-6">
        <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5 mr-2" /><span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm opacity-70">Beat the Bet — moderation & management</p>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'critical', label: `Critical (${criticalQueue.length})`, color: 'bg-red-600' },
            { id: 'high', label: `High (${highQueue.length})`, color: 'bg-orange-500' },
            { id: 'support', label: `Support (${supportQueue.length})`, color: 'bg-blue-500' },
            { id: 'users', label: `Users (${userStats?.total ?? '—'})`, color: null },
            { id: 'admins', label: 'Admins', color: null },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveAdminTab(tab.id)}
              className={`px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition-colors ${activeAdminTab === tab.id ? (tab.color || 'bg-gray-900') + ' text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
          <button onClick={() => { sessionStorage.removeItem('btb_admin_cache'); loadData(); }} disabled={loading} className="ml-auto px-3 py-2 rounded-lg text-xs bg-blue-100 text-blue-700 font-semibold disabled:opacity-50">
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {loading && !loaded && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          )}
          {loadError && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-4">
              <p className="font-semibold text-red-800 mb-1">Error loading data</p>
              <p className="text-sm text-red-700">{loadError}</p>
              <button onClick={loadData} className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">Retry</button>
            </div>
          )}

          {activeAdminTab === 'critical' && <QueueView msgs={criticalQueue} type="critical" />}
          {activeAdminTab === 'high' && <QueueView msgs={highQueue} type="high" />}
          {activeAdminTab === 'support' && <QueueView msgs={supportQueue} type="support" />}

          {activeAdminTab === 'users' && (
            <div className="space-y-3">
              {userStats ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-xl shadow-md p-5 text-center">
                      <p className="text-3xl font-bold text-gray-800">{userStats.total}</p>
                      <p className="text-sm text-gray-500">Total users</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {userStats.users.filter(u => (new Date() - new Date(u.created_at)) < 7*24*60*60*1000).length}
                      </p>
                      <p className="text-sm text-gray-500">New this week</p>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800">All users</h3>
                  {userStats.users.map(user => (
                    <div key={user.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{user.username || 'No username'}</p>
                        <p className="text-xs text-gray-400">{formatDate(user.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-600">Lvl {user.level}</p>
                        <p className="text-xs text-gray-400">{user.points} pts</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-center text-gray-400 py-8">Loading users...</p>
              )}
            </div>
          )}

          {activeAdminTab === 'admins' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="font-bold text-gray-800 mb-4">Admin Accounts</h3>
                <div className="space-y-2 mb-4">
                  {localAdminEmails.map(email => (
                    <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">{email}</span>
                      <button onClick={() => removeAdminEmail(email)} className="text-red-400 hover:text-red-600 text-sm font-semibold">Remove</button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Add admin email</p>
                  <div className="flex gap-2">
                    <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAdminEmail()}
                      placeholder="email@example.com"
                      className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-800" />
                    <button onClick={addAdminEmail} className="bg-gray-900 hover:bg-gray-700 text-white px-4 rounded-lg font-semibold text-sm">Add</button>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-1">Add an email to grant admin access. The user must have signed up first.</p>
                <p className="text-xs text-gray-500">After adding, run in Supabase SQL Editor:</p>
                <code className="block text-xs bg-white rounded p-2 mt-1 text-gray-700 select-all">
                  {"update public.admins a set user_id = u.id from auth.users u where lower(u.email) = lower(a.email);"}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ============================================================
// Privacy Policy Page
// ============================================================
const PrivacyPolicyPage = () => (
  <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
    <div className="bg-gray-900 text-white p-6">
      <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
        <ArrowLeft className="w-5 h-5 mr-2" /><span>Back</span>
      </button>
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm opacity-70">Version 1.0 · Last updated 1 June 2026</p>
    </div>
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6 text-gray-700 text-sm leading-relaxed">

        {[
          { title: "1. About Beat the Bet", content: `Beat the Bet is an Australian-based gambling addiction recovery and support platform. Beat the Bet is operated by an Australian sole trader. All enquiries may be directed to beatthebetadmin@gmail.com. Further business details are available upon reasonable request.` },
          { title: "2. Important Disclaimer", content: `Beat the Bet is a peer-support and recovery platform — not a medical, counselling, crisis, financial, or legal service. The Services are not a substitute for professional help. The platform may surface crisis resources where distress is detected; this does not constitute clinical assessment or intervention. If you are in crisis, contact emergency services immediately.` },
          { title: "3. Information We Collect", content: `We collect: account information (email, username, password); recovery content (journal entries, timer data, milestones, chat messages, photos); usage information (feature use, activity logs, login history); device and technical information (IP address, device type, browser); and user-generated community content. You are responsible for what you share publicly.` },
          { title: "4. Why We Collect Information", content: `We collect information to: provide and improve the Services; personalise your recovery experience; maintain community safety through moderation; detect fraud and unauthorised access; comply with legal obligations; and collect anonymised analytics (app opens, panic button activations) for platform improvement. We do not sell this data or share it for advertising.` },
          { title: "5. Community Chat Moderation", content: `Community messages may be automatically screened using keyword detection systems and reviewed by human moderators. Messages violating Community Guidelines may be removed. Chat messages are automatically deleted after 30 days as a data minimisation measure (subject to safety, legal, or dispute resolution requirements). Moderation is conducted to protect users and maintain platform safety.` },
          { title: "6. Data Storage & Security", content: `Your data is stored via Supabase (authentication, database, storage) on Amazon Web Services infrastructure in Sydney, Australia (ap-southeast-2). We use encryption in transit, secure authentication, access controls, and monitoring. No method of storage is completely secure and we cannot guarantee absolute security.` },
          { title: "7. Third-Party Services", content: `We use: Supabase (auth, database, storage); Amazon Web Services (infrastructure through Supabase); Last.fm API (music recommendations — artist names only, no personal data); Vercel (hosting and deployment).` },
          { title: "8. Cookies & Local Storage", content: `We do not use advertising cookies. We use localStorage for session persistence, user preferences, and platform functionality. Disabling local storage may affect app functionality.` },
          { title: "9. Push Notifications", content: `We may provide optional push notifications for recovery reminders, payday alerts, milestone celebrations, and progress updates. You can enable or disable notifications through your device settings. Notification content is not shared with third parties.` },
          { title: "10. Data Retention", content: `User data is retained while your account is active. When deleted, personal information is removed within a reasonable period unless retention is required by law, safety obligations, or dispute resolution. Community chat messages are deleted after 30 days automatically.` },
          { title: "11. Your Privacy Rights", content: `Australian users have rights under the Privacy Act 1988 (Cth) including access, correction, and deletion rights. You can delete your account directly in the app. If unsatisfied with our response to a privacy complaint, you may contact the OAIC at www.oaic.gov.au. GDPR rights apply where applicable.` },
          { title: "12. Children's Privacy", content: `Beat the Bet is for users aged 18 and over. We do not knowingly collect information from anyone under 18. If we become aware of such collection, we will delete the information and terminate the account.` },
          { title: "13. Contact Us", content: `For privacy questions, requests, or complaints: beatthebetadmin@gmail.com. For privacy-related requests, please include information to verify your identity. Further business details are available upon reasonable request.` },
          { title: "14. Consent & Lawful Processing", content: `By using the Services you consent to collection and use of your information as described here. Some processing is on the basis of legitimate interest (security, moderation, fraud prevention). You may object to legitimate-interest processing by contacting beatthebetadmin@gmail.com.` },
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-gray-600 leading-relaxed">{section.content}</p>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 py-4">© 2026 Beat the Bet. All rights reserved.</p>
      </div>
    </div>
  </div>
);

// ============================================================
// Terms of Service Page
// ============================================================
const TermsOfServicePage = () => (
  <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
    <div className="bg-gray-900 text-white p-6">
      <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
        <ArrowLeft className="w-5 h-5 mr-2" /><span>Back</span>
      </button>
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-sm opacity-70">Version 1.0 · Effective 1 June 2026</p>
    </div>
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6 text-gray-700 text-sm leading-relaxed">

        {[
          { title: "1. Acceptance of These Terms", content: `By creating an account or using Beat the Bet (available at btb1.vercel.app), you agree to these Terms of Service. If you do not agree, do not use the Services. By using the Services, you also acknowledge the Beat the Bet Privacy Policy.` },
          { title: "2. About the Service", content: `Beat the Bet is an Australian peer-support and recovery platform provided free of charge. It is not a medical, healthcare, counselling, psychiatric, or crisis service. Nothing in the app constitutes professional advice. Seek qualified help where appropriate. Beat the Bet is not monitored as an emergency service — if you are in crisis, contact emergency services immediately.` },
          { title: "3. Eligibility", content: `You must be at least 18 years old to use the Services. By registering, you confirm you are 18 or over. Each person may hold only one account. You must not use the Services to harm, exploit, or manipulate other users.` },
          { title: "4. User Accounts", content: `You are responsible for keeping your account credentials confidential and for all activity under your account. Notify us immediately of unauthorised access. Provide accurate information. Usernames must not be offensive, impersonate others, or mislead users about your identity.` },
          { title: "5. Community Standards", content: `You may discuss recovery experiences, urges, coping strategies, progress, and encouragement. You must not post gambling promotions, betting tips, scams, personal contact details, harassment, abuse, or content that undermines others' recovery. No links or images in community chat (photo uploads are available in Why I'm Quitting). No direct messaging between users.` },
          { title: "6. Content & Moderation", content: `All community content is subject to moderation using automated detection and human review. Flagged content may be hidden, removed, or escalated. Beat the Bet has sole discretion over moderation decisions and is not obligated to explain them. Chat messages are automatically deleted after 30 days.` },
          { title: "7. Prohibited Conduct", content: `You must not: promote gambling; solicit money or loans; engage in scams or fraud; harass or exploit users; impersonate others; attempt to bypass moderation; share external contact details; interfere with the platform (including scraping or unauthorised access); or engage in predatory behaviour toward vulnerable users.` },
          { title: "8. Intellectual Property", content: `All rights in the Services (software, branding, design, content) belong to Beat the Bet or its licensors. You retain ownership of content you submit, but grant Beat the Bet a non-exclusive worldwide licence to store, display, process, and moderate it for the purpose of operating the Services.` },
          { title: "9. Privacy", content: `Your use is governed by the Beat the Bet Privacy Policy. By using the Services, you consent to data handling as described in the Privacy Policy. Contact beatthebetadmin@gmail.com for privacy enquiries.` },
          { title: "10. Third-Party Services", content: `The app uses Supabase, Vercel, Last.fm, and Amazon Web Services (AWS). Beat the Bet is not responsible for third-party service outages, failures, or security incidents beyond its reasonable control.` },
          { title: "11. Disclaimers", content: `The Services are provided "as is" and "as available". Beat the Bet makes no guarantees about accuracy, availability, or recovery outcomes. Community content is user-generated and not endorsed by Beat the Bet. Nothing in the Services constitutes medical, legal, or financial advice.` },
          { title: "12. Limitation of Liability", content: `To the maximum extent permitted by Australian law, Beat the Bet is not liable for indirect, consequential, or incidental loss, loss of data, financial loss, or emotional distress arising from use of the Services. Nothing excludes rights that cannot lawfully be excluded under Australian consumer law.` },
          { title: "13. Account Suspension & Termination", content: `Beat the Bet may suspend or terminate accounts that violate these Terms. We reserve the right to archive inactive accounts with reasonable notice. You may delete your account at any time through the in-app account deletion feature. Termination may result in loss of access to account data and features.` },
          { title: "14. Changes to These Terms", content: `We may update these Terms. Where material changes are made, we will notify users through the app or other appropriate means. Continued use after an update constitutes acceptance. If you disagree with revised Terms, stop using the Services.` },
          { title: "15. Governing Law", content: `These Terms are governed by the laws of New South Wales, Australia. You submit to the non-exclusive jurisdiction of the courts of New South Wales.` },
          { title: "16. Contact", content: `Beat the Bet is operated by an Australian sole trader. For enquiries, support, or legal notices: beatthebetadmin@gmail.com. Further business details are available upon reasonable request.` },
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-gray-600 leading-relaxed">{section.content}</p>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 py-4">© 2026 Beat the Bet. All rights reserved.</p>
      </div>
    </div>
  </div>
);

export default function BeatTheBet() {
  // ============================================================
  // All localStorage keys that hold per-account data. Used on
  // signup, login, and logout to make sure one account's data
  // never bleeds into another account on the same device.
  // ============================================================
  const USER_SCOPED_STORAGE_KEYS = [
    'startDate','gambleFreeStartDate','userPoints','userLevel',
    'earnedBadges','journalEntries','activityLog','whyImQuitting',
    'savingsMilestones','paydaySettings','selectedInterests',
    'seedArtists','artistFeedback','favoriteArtists','savedForLater',
    'dailyGamblingSpend','lastCheckIn','journalMode','chatUsername',
    'hasCompletedOnboarding','username','userAgeRange','userCity',
    'myBudgetData','adminEmails','reportedMessageIds',
    'appOpenTimestamps','panicButtonTimestamps','toolUsage',
    'streakData','favoritePrompts','dailyStepGoal',
    'journalCalendarMonth','currentUser','isAuthenticated','sb_session'
  ];

  const clearUserScopedStorage = () => {
    USER_SCOPED_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
  };

  // Admin access
  const [isAdminUser, setIsAdminUser] = React.useState(false);
  const [adminCheckDone, setAdminCheckDone] = React.useState(false);

  // adminEmails lives in parent (needed for isAdmin check outside panel)
  const [adminEmails, setAdminEmails] = React.useState(() => {
    const saved = localStorage.getItem('adminEmails');
    return saved ? JSON.parse(saved) : ['beatthebetadmin@gmail.com'];
  });


  const checkAdminStatus = React.useCallback(async () => {
    const session = supabase.getSession();
    if (!session) {
      setIsAdminUser(false);
      setAdminCheckDone(true);
      return;
    }

    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Primary: check admins table directly by email
      // More reliable than RPC since auth.uid() can be tricky in functions
      const emailCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/admins?select=email&email=eq.${encodeURIComponent(session.user.email)}`,
        { headers }
      );
      console.log('[Admin] email check status:', emailCheck.status);

      if (emailCheck.ok) {
        const data = await emailCheck.json();
        console.log('[Admin] email check result:', data);
        if (Array.isArray(data) && data.length > 0) {
          setIsAdminUser(true);
          setAdminCheckDone(true);
          return;
        }
      }

      // Secondary: try is_admin() RPC
      const rpcRes = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/is_admin`,
        { method: 'POST', headers, body: JSON.stringify({}) }
      );
      const rawText = await rpcRes.text();
      console.log('[Admin] RPC status:', rpcRes.status, 'body:', rawText);

      if (rpcRes.ok) {
        const result = JSON.parse(rawText);
        setIsAdminUser(result === true);
      } else {
        setIsAdminUser(false);
      }
    } catch (e) {
      console.error('[Admin] checkAdminStatus error:', e);
      setIsAdminUser(false);
    } finally {
      setAdminCheckDone(true);
    }
  }, []);

  const isAdmin = () => isAdminUser;

  // Authentication State
  // Restore session from Supabase on load
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('isAuthenticated');
    const session = localStorage.getItem('sb_session');
    // If we have a saved session, validate it's not expired
    if (saved === 'true' && session) {
      try {
        const s = JSON.parse(session);
        const expiresAt = s.expires_at * 1000;
        if (Date.now() > expiresAt) {
          // Session expired — clear and force re-login
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('sb_session');
          return false;
        }
      } catch (e) {}
    }
    return saved === 'true';
  });
  const [authScreen, setAuthScreen] = useState('welcome'); // 'welcome', 'login', 'signup'
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Timer State
  // Track whether profile data has been loaded from Supabase
  // Prevents timer from showing wrong value before login restores the correct date
  const [profileLoaded, setProfileLoaded] = React.useState(() => {
    // If we have a saved startDate in localStorage, the data is already present
    const hasSavedDate = !!(localStorage.getItem('startDate') || localStorage.getItem('gambleFreeStartDate'));
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    // Profile is "loaded" if not authenticated (nothing to load)
    // or if we have saved data from a previous session
    return !isAuth || hasSavedDate;
  });

  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('startDate') || localStorage.getItem('gambleFreeStartDate');
    return saved ? new Date(saved) : new Date();
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeTool, setActiveTool] = useState(null); // null means showing tools list
  
  // Achievement & Points System
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('userPoints');
    return saved ? parseInt(saved) : 0;
  });
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('userLevel');
    return saved ? parseInt(saved) : 1;
  });
  const [earnedBadges, setEarnedBadges] = useState(() => {
    const saved = localStorage.getItem('earnedBadges');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastCheckIn, setLastCheckIn] = useState(() => {
    return localStorage.getItem('lastCheckIn');
  });
  const [dailyGamblingSpend, setDailyGamblingSpend] = useState(() => {
    const saved = localStorage.getItem('dailyGamblingSpend');
    return saved ? parseFloat(saved) : 0;
  });
  const [userAgeRange, setUserAgeRange] = useState(() => {
    const saved = localStorage.getItem('userAgeRange');
    return saved || '';
  });
  const [userCity, setUserCity] = useState(() => {
    const saved = localStorage.getItem('userCity');
    return saved || '';
  });
  const [userLiabilities, setUserLiabilities] = useState(() => {
    const saved = localStorage.getItem('userLiabilities');
    return saved ? JSON.parse(saved) : [];
  });

  // Journal System
  const [journalEntries, setJournalEntries] = useState(() => {
    const saved = localStorage.getItem('journalEntries');
    return saved ? JSON.parse(saved) : [];
  });
  const [journalMode, setJournalMode] = useState(() => {
    const saved = localStorage.getItem('journalMode');
    return saved || 'structured'; // 'structured' or 'open'
  });
  const [selectedJournalDate, setSelectedJournalDate] = useState(null);
  const [showJournalCalendar, setShowJournalCalendar] = useState(false);
  const [favoritePrompts, setFavoritePrompts] = useState(() => {
    const saved = localStorage.getItem('favoritePrompts');
    return saved ? JSON.parse(saved) : [];
  });
  const [showInterests, setShowInterests] = useState(false);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);

  // Skill Builder System
  const [selectedInterests, setSelectedInterests] = useState(() => {
    const saved = localStorage.getItem('selectedInterests');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteArtists, setFavoriteArtists] = useState(() => {
    const saved = localStorage.getItem('favoriteArtists');
    return saved ? JSON.parse(saved) : [];
  });
  const [skillBuilderView, setSkillBuilderView] = useState('main'); // 'main', 'interests', 'bored', 'music'
  const [currentBoredActivity, setCurrentBoredActivity] = useState('');
  
  // Activity Challenges State
  const [activityLog, setActivityLog] = useState(() => {
    const saved = localStorage.getItem('activityLog');
    return saved ? JSON.parse(saved) : [];
  });
  const [dailyStepGoal, setDailyStepGoal] = useState(() => {
    const saved = localStorage.getItem('dailyStepGoal');
    return saved ? parseInt(saved) : 5000;
  });
  const [todaySteps, setTodaySteps] = useState(0);
  
  // Community Chat State
  const [chatRoom, setChatRoom] = useState('general'); // 'general', 'cravings', 'wins'
  const [chatMessages, setChatMessages] = useState([]);
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem('chatUsername');
    return saved || '';
  });
  const [hasSetUsername, setHasSetUsername] = useState(() => {
    return localStorage.getItem('chatUsername') !== null;
  });
  
  // Streak Analytics State
  const [streakData, setStreakData] = useState(() => {
    const saved = localStorage.getItem('streakData');
    return saved ? JSON.parse(saved) : {
      relapses: [], // Array of relapse dates for pattern detection
      closeCallDays: [], // Days where they had strong urges but didn't gamble
      triggerTimes: {}, // Time of day patterns
      triggerDays: {}, // Day of week patterns
    };
  });
  
  // Music Discovery State
  const [seedArtists, setSeedArtists] = useState(() => {
    const saved = localStorage.getItem('seedArtists');
    return saved ? JSON.parse(saved) : [];
  });
  const [artistFeedback, setArtistFeedback] = useState(() => {
    const saved = localStorage.getItem('artistFeedback');
    return saved ? JSON.parse(saved) : {}; // { artistName: 'known'|'liked'|'disliked'|'saved'|'skipped' }
  });
  const [recommendedArtists, setRecommendedArtists] = useState([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [savedForLater, setSavedForLater] = useState(() => {
    const saved = localStorage.getItem('savedForLater');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Why I'm Quitting State
  const [whyImQuitting, setWhyImQuitting] = useState(() => {
    const saved = localStorage.getItem('whyImQuitting');
    return saved ? JSON.parse(saved) : {
      reasons: [], // Array of { id, type: 'text'|'photo'|'video'|'voice', content, timestamp }
      primaryReason: '' // Main reason text
    };
  });
  
  // Payday Tracking State
  const [paydaySettings, setPaydaySettings] = useState(() => {
    const saved = localStorage.getItem('paydaySettings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      startDate: null, // First payday date
      frequency: 'weekly', // 'weekly', 'fortnightly', 'monthly', 'custom'
      customDays: null // For custom frequency (number of days)
    };
  });
  
  // Savings Goals State
  const [savingsGoals, setSavingsGoals] = useState(() => {
    const saved = localStorage.getItem('savingsGoals');
    return saved ? JSON.parse(saved) : []; // Array of { id, name, amount, icon, timestamp }
  });
  
  // Success Toast State
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };
  
  // Loading Spinner Component
  const LoadingSpinner = ({ size = 'md', message = '' }) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };
    
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}></div>
        {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
      </div>
    );
  };
  
  // Full Page Loading Component
  const LoadingScreen = ({ message = 'Loading...' }) => {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">{message}</p>
        </div>
      </div>
    );
  };
  
  // Empty State Components
  const EmptyState = ({ icon, title, description, actionText, onAction }) => (
    <div className="text-center py-12 px-6">
      <span className="text-7xl block mb-4">{icon}</span>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
        >
          {actionText}
        </button>
      )}
    </div>
  );
  
  // Form Validation Utilities
  const validators = {
    email: (value) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(value);
    },
    
    password: (value) => {
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
      return value.length >= 8 && 
             /[A-Z]/.test(value) && 
             /[a-z]/.test(value) && 
             /[0-9]/.test(value);
    },
    
    phone: (value) => {
      // Australian phone numbers (04XX XXX XXX or 1800 XXX XXX)
      const cleaned = value.replace(/\s/g, '');
      return /^(04\d{8}|1800\d{6})$/.test(cleaned);
    },
    
    required: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined;
    },
    
    minLength: (value, min) => {
      return value.length >= min;
    },
    
    maxLength: (value, max) => {
      return value.length <= max;
    },
    
    number: (value) => {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    positiveNumber: (value) => {
      return validators.number(value) && parseFloat(value) > 0;
    },
    
    age: (value) => {
      const age = parseInt(value);
      return age >= 18 && age <= 120;
    },
    
    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  };
  
  // Validation error messages
  const validationMessages = {
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number',
    phone: 'Please enter a valid Australian phone number (04XX XXX XXX or 1800 XXX XXX)',
    required: 'This field is required',
    minLength: (min) => `Must be at least ${min} characters`,
    maxLength: (max) => `Must be no more than ${max} characters`,
    number: 'Please enter a valid number',
    positiveNumber: 'Please enter a positive number',
    age: 'You must be 18 or older',
    url: 'Please enter a valid URL'
  };
  
  // Validate form helper
  const validateForm = (fields) => {
    const errors = {};
    
    Object.entries(fields).forEach(([fieldName, config]) => {
      const { value, rules } = config;
      
      for (const rule of rules) {
        if (rule === 'required' && !validators.required(value)) {
          errors[fieldName] = validationMessages.required;
          break;
        }
        
        if (rule === 'email' && value && !validators.email(value)) {
          errors[fieldName] = validationMessages.email;
          break;
        }
        
        if (rule === 'password' && value && !validators.password(value)) {
          errors[fieldName] = validationMessages.password;
          break;
        }
        
        if (rule === 'phone' && value && !validators.phone(value)) {
          errors[fieldName] = validationMessages.phone;
          break;
        }
        
        if (rule === 'positiveNumber' && value && !validators.positiveNumber(value)) {
          errors[fieldName] = validationMessages.positiveNumber;
          break;
        }
        
        if (typeof rule === 'object') {
          if (rule.type === 'minLength' && value && !validators.minLength(value, rule.value)) {
            errors[fieldName] = validationMessages.minLength(rule.value);
            break;
          }
          
          if (rule.type === 'maxLength' && value && !validators.maxLength(value, rule.value)) {
            errors[fieldName] = validationMessages.maxLength(rule.value);
            break;
          }
        }
      }
    });
    
    return errors;
  };
  
  // ============================================================
  // Real Supabase Authentication
  // ============================================================
  const realLogin = async (email, password) => {
    if (!validators.email(email)) throw new Error('Please enter a valid email address');
    if (!password) throw new Error('Please enter your password');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const rawMessage = error.message || error.error_description || error.msg || '';
      if (/email.*not.*confirm|confirm.*email/i.test(rawMessage)) {
        throw new Error('Login failed: please verify your email before logging in.');
      }
      throw new Error(rawMessage || 'Login failed');
    }

    const loggedInUser = data && data.user ? data.user : data;
    if (!loggedInUser || !loggedInUser.id) {
      throw new Error('Login failed: please try again.');
    }

    // Clear any leftover data from a previous account on this device before
    // restoring this account's data, in case logout was skipped (e.g. the
    // browser was closed without logging out first).
    const preservedSession = localStorage.getItem('sb_session');
    clearUserScopedStorage();
    if (preservedSession) localStorage.setItem('sb_session', preservedSession);

    const user = {
      id: loggedInUser.id,
      email: loggedInUser.email,
      username: '',
      createdAt: loggedInUser.created_at,
      profileComplete: false
    };

    // Load profile from database
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', loggedInUser.id);
    if (profile && profile.length > 0) {
      const p = profile[0];
      const resolvedUsername = p.username || '';
      user.username = resolvedUsername;
      user.profileComplete = !!(resolvedUsername && resolvedUsername.length >= 2);
      // Also restore username to global state
      if (resolvedUsername) {
        setUsername(resolvedUsername);
        localStorage.setItem('username', resolvedUsername);
      }

      // Restore profile data to state
      if (p.start_date) {
        setStartDate(new Date(p.start_date));
        localStorage.setItem('startDate', new Date(p.start_date).toISOString());
      }
      if (p.age_range) {
        setUserAgeRange(p.age_range);
        localStorage.setItem('userAgeRange', p.age_range);
      }
      if (p.daily_gambling_spend) {
        setDailyGamblingSpend(parseFloat(p.daily_gambling_spend));
        localStorage.setItem('dailyGamblingSpend', p.daily_gambling_spend.toString());
      }
      if (p.points) {
        setPoints(p.points);
        localStorage.setItem('userPoints', p.points.toString());
      }
      if (p.level) {
        setLevel(p.level);
        localStorage.setItem('userLevel', p.level.toString());
      }
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    setProfileLoaded(true);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));

    // Restore all user data from Supabase in background
    const uid = loggedInUser.id;
    const token = data.access_token;
    const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` };

    // Restore data in parallel - don't await, let it load in background
    Promise.allSettled([

      // Journal entries
      fetch(`${SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${uid}&order=created_at.asc&limit=500`, { headers })
        .then(r => r.json()).then(entries => {
          if (Array.isArray(entries) && entries.length > 0) {
            const mapped = entries.map(e => ({
              id: e.id,
              date: e.created_at,
              timestamp: new Date(e.created_at).toLocaleString(),
              mode: e.mode,
              mood: e.mood,
              content: e.content,
              responses: e.responses
            }));
            setJournalEntries(mapped);
            localStorage.setItem('journalEntries', JSON.stringify(mapped));
          }
        }).catch(() => {}),

      // Why I'm quitting - restore with fresh signed URLs for photos
      fetch(`${SUPABASE_URL}/rest/v1/why_quitting?user_id=eq.${uid}&limit=1`, { headers })
        .then(r => r.json()).then(async rows => {
          if (!Array.isArray(rows) || rows.length === 0) return;
          const row = rows[0];
          let reasons = Array.isArray(row.reasons) ? row.reasons : [];

          // Refresh signed URLs for any photo reasons
          reasons = await Promise.all(reasons.map(async (reason) => {
            if (reason.type === 'photo' && reason.storagePath) {
              try {
                const signRes = await fetch(
                  `${SUPABASE_URL}/storage/v1/object/sign/why-quitting-photos/${reason.storagePath}`,
                  {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expiresIn: 31536000 })
                  }
                );
                if (signRes.ok) {
                  const signData = await signRes.json();
                  return { ...reason, content: `${SUPABASE_URL}/storage/v1${signData.signedURL}` };
                }
              } catch (e) {}
            }
            return reason;
          }));

          const restored = { primaryReason: row.primary_reason || '', reasons };
          setWhyImQuitting(restored);
          localStorage.setItem('whyImQuitting', JSON.stringify(restored));
        }).catch(() => {}),

      // Earned badges
      fetch(`${SUPABASE_URL}/rest/v1/earned_badges?user_id=eq.${uid}`, { headers })
        .then(r => r.json()).then(rows => {
          if (Array.isArray(rows) && rows.length > 0) {
            const badgeIds = rows.map(r => r.badge_id);
            setEarnedBadges(badgeIds);
            localStorage.setItem('earnedBadges', JSON.stringify(badgeIds));
          }
        }).catch(() => {}),

      // Activity log
      fetch(`${SUPABASE_URL}/rest/v1/activity_log?user_id=eq.${uid}&order=logged_at.desc&limit=200`, { headers })
        .then(r => r.json()).then(rows => {
          if (Array.isArray(rows) && rows.length > 0) {
            const mapped = rows.map(a => ({
              id: a.id,
              type: a.type,
              duration: a.duration_minutes,
              distance: a.distance,
              date: a.logged_at
            }));
            setActivityLog(mapped);
            localStorage.setItem('activityLog', JSON.stringify(mapped));
          }
        }).catch(() => {}),

      // My Budget data (income, expenses, accounts, allocations)
      fetch(`${SUPABASE_URL}/rest/v1/liabilities?user_id=eq.${uid}&limit=1`, { headers })
        .then(r => r.json()).then(rows => {
          if (Array.isArray(rows) && rows.length > 0 && rows[0].items) {
            localStorage.setItem('myBudgetData', JSON.stringify(rows[0].items));
          }
        }).catch(() => {}),

      // User settings
      fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${uid}&limit=1`, { headers })
        .then(r => r.json()).then(rows => {
          if (!Array.isArray(rows) || rows.length === 0) return;
          const s = rows[0];
          if (s.journal_mode) { setJournalMode(s.journal_mode); localStorage.setItem('journalMode', s.journal_mode); }
          if (s.daily_gambling_spend) { setDailyGamblingSpend(parseFloat(s.daily_gambling_spend)); localStorage.setItem('dailyGamblingSpend', String(s.daily_gambling_spend)); }
          if (s.selected_interests?.length) { setSelectedInterests(s.selected_interests); localStorage.setItem('selectedInterests', JSON.stringify(s.selected_interests)); }
          if (s.payday_settings) { setPaydaySettings(s.payday_settings); localStorage.setItem('paydaySettings', JSON.stringify(s.payday_settings)); }
          if (s.last_check_in) { setLastCheckIn(s.last_check_in); localStorage.setItem('lastCheckIn', s.last_check_in); }
          if (s.seed_artists?.length) { setSeedArtists(s.seed_artists); localStorage.setItem('seedArtists', JSON.stringify(s.seed_artists)); }
          if (s.artist_feedback && Object.keys(s.artist_feedback).length) { setArtistFeedback(s.artist_feedback); localStorage.setItem('artistFeedback', JSON.stringify(s.artist_feedback)); }
          if (s.favorite_artists?.length) { setFavoriteArtists(s.favorite_artists); localStorage.setItem('favoriteArtists', JSON.stringify(s.favorite_artists)); }
          if (s.daily_step_goal) { setDailyStepGoal(parseInt(s.daily_step_goal)); localStorage.setItem('dailyStepGoal', String(s.daily_step_goal)); }
        }).catch(() => {}),

    ]).then(() => {
      console.log('Data restore complete');
      // Force a full reload so every piece of React state (music likes,
      // budget, journal, badges, etc.) re-initializes fresh from the
      // newly-restored localStorage. Without this, state from a previous
      // account can keep showing even after localStorage is corrected,
      // because useState's lazy initializer only runs once on first mount.
      window.location.reload();
    });

    // Check admin status after login
    setTimeout(() => checkAdminStatus(), 500);
    return user;
  };

  const realSignup = async (email, password, confirmPassword) => {
    if (!validators.email(email)) throw new Error('Please enter a valid email address');
    if (!validators.password(password)) throw new Error('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
    if (password !== confirmPassword) throw new Error('Passwords do not match');

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message || error.error_description || 'Sign up failed');

    // Supabase returns the user object directly at the top level when email
    // confirmation is required (no session yet), or nested under `user` when
    // a session is created immediately. Handle both shapes defensively.
    const signedUpUser = data && data.user ? data.user : data;
    if (!signedUpUser || !signedUpUser.id) {
      throw new Error('Something went wrong creating your account. Please try again.');
    }

    // If there's no access_token, email confirmation is required and no
    // session exists yet - don't pretend the user is logged in.
    const hasSession = !!data.access_token;

    if (!hasSession) {
      return { needsEmailConfirmation: true, email };
    }

    const user = {
      id: signedUpUser.id,
      email: signedUpUser.email,
      username: '',
      createdAt: signedUpUser.created_at,
      profileComplete: false
    };

    // Clear any stale data from previous sessions/accounts (but keep the
    // session we just created a moment ago via supabase.auth.signUp)
    const preservedSession = localStorage.getItem('sb_session');
    clearUserScopedStorage();
    if (preservedSession) localStorage.setItem('sb_session', preservedSession);
    const now = new Date();
    setStartDate(now);
    setProfileLoaded(true);
    localStorage.setItem('startDate', now.toISOString());

    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  };

  const deleteAccount = async () => {
    const session = supabase.getSession();
    if (!session) return;
    const uid = session.user.id;
    const token = session.access_token;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Delete all user data in order (cascade handles most, but be explicit)
      await Promise.allSettled([
        fetch(`${SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${uid}`, { method: 'DELETE', headers }),
        fetch(`${SUPABASE_URL}/rest/v1/earned_badges?user_id=eq.${uid}`, { method: 'DELETE', headers }),
        fetch(`${SUPABASE_URL}/rest/v1/activity_log?user_id=eq.${uid}`, { method: 'DELETE', headers }),
        fetch(`${SUPABASE_URL}/rest/v1/why_quitting?user_id=eq.${uid}`, { method: 'DELETE', headers }),
        fetch(`${SUPABASE_URL}/rest/v1/liabilities?user_id=eq.${uid}`, { method: 'DELETE', headers }),
        fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${uid}`, { method: 'DELETE', headers }),
        fetch(`${SUPABASE_URL}/rest/v1/app_events?user_id=eq.${uid}`, { method: 'DELETE', headers }),
        fetch(`${SUPABASE_URL}/rest/v1/user_moderation?user_id=eq.${uid}`, { method: 'DELETE', headers }),
      ]);

      // Delete profile
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, { method: 'DELETE', headers });

      // Delete auth user via Supabase admin API
      await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'DELETE',
        headers
      });
    } catch (e) {
      console.warn('Some deletion steps failed:', e);
    }

    // Clear all local data regardless
    const keys = [
      'startDate','gambleFreeStartDate','userPoints','userLevel','earnedBadges',
      'journalEntries','activityLog','whyImQuitting','savingsMilestones',
      'paydaySettings','selectedInterests','seedArtists','artistFeedback',
      'favoriteArtists','savedForLater','dailyGamblingSpend','lastCheckIn',
      'journalMode','chatUsername','hasCompletedOnboarding','username',
      'userAgeRange','userCity','isAuthenticated','currentUser','sb_session',
      'adminEmails','reportedMessageIds','appOpenTimestamps','panicButtonTimestamps'
    ];
    keys.forEach(k => localStorage.removeItem(k));

    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthScreen('welcome');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    clearUserScopedStorage();
    setAuthScreen('welcome');
  };

  // ============================================================
  // Sync ALL user settings to Supabase user_settings table
  // ============================================================
  const syncSettingsToSupabase = React.useCallback(async (overrides = {}) => {
    const session = supabase.getSession();
    if (!session) return;
    const uid = session.user.id;
    const token = session.access_token;
    const payload = {
      user_id: uid,
      journal_mode: overrides.journal_mode ?? journalMode,
      daily_gambling_spend: overrides.daily_gambling_spend ?? dailyGamblingSpend,
      selected_interests: overrides.selected_interests ?? selectedInterests,
      payday_settings: overrides.payday_settings ?? paydaySettings,
      last_check_in: overrides.last_check_in ?? lastCheckIn,
      seed_artists: overrides.seed_artists ?? seedArtists,
      artist_feedback: overrides.artist_feedback ?? artistFeedback,
      favorite_artists: overrides.favorite_artists ?? favoriteArtists,
      daily_step_goal: overrides.daily_step_goal ?? dailyStepGoal,
      updated_at: new Date().toISOString()
    };
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/user_settings`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }, [journalMode, dailyGamblingSpend, selectedInterests, paydaySettings,
      lastCheckIn, seedArtists, artistFeedback, favoriteArtists, dailyStepGoal]);

  // ============================================================
  // Sync data to Supabase (called after profile setup and on key changes)
  // ============================================================
  const syncProfileToSupabase = async (overrides = {}) => {
    const session = supabase.getSession();
    if (!session) return;
    const uid = session.user.id;

    // Only include fields that are either explicitly overridden or already
    // have a real value in state. This prevents accidentally blanking out
    // a field (like username) in Supabase when this function is called
    // for an unrelated update (e.g. awarding points) from a stale closure.
    const upsertData = {
      id: uid,
      updated_at: new Date().toISOString()
    };

    const resolvedUsername = overrides.username ?? username;
    if (resolvedUsername) upsertData.username = resolvedUsername;

    const resolvedAgeRange = overrides.age_range ?? userAgeRange;
    if (resolvedAgeRange) upsertData.age_range = resolvedAgeRange;

    upsertData.daily_gambling_spend = overrides.daily_gambling_spend ?? dailyGamblingSpend;
    upsertData.points = overrides.points ?? points;
    upsertData.level = overrides.level ?? level;

    // Only write start_date if explicitly passed - never use default state value
    if (overrides.start_date !== undefined) {
      upsertData.start_date = overrides.start_date;
    }
    await supabase.from('profiles').upsert(upsertData);
  };

  const syncJournalEntry = async (entry) => {
    const session = supabase.getSession();
    if (!session) return;
    await supabase.from('journal_entries').insert({
      user_id: session.user.id,
      mode: entry.mode,
      mood: entry.mood,
      content: entry.content,
      responses: entry.responses,
      created_at: entry.date
    });
  };

  const syncAppEvent = async (eventType) => {
    const session = supabase.getSession();
    if (!session) return;
    await supabase.from('app_events').insert({
      user_id: session.user.id,
      event_type: eventType,
      occurred_at: new Date().toISOString()
    });
  };
  
  // Error Toast State
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 4000);
  };
  
  // Loading State (global for API calls)
  const [isLoading, setIsLoading] = useState(false);
  
  // Pattern Detection State
  const [appOpenTimestamps, setAppOpenTimestamps] = useState(() => {
    const saved = localStorage.getItem('appOpenTimestamps');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [panicButtonTimestamps, setPanicButtonTimestamps] = useState(() => {
    const saved = localStorage.getItem('panicButtonTimestamps');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Onboarding State
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    const saved = localStorage.getItem('hasCompletedOnboarding');
    return saved === 'true';
  });
  
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  // Tool Usage Tracking
  const [toolUsage, setToolUsage] = useState(() => {
    const saved = localStorage.getItem('toolUsage');
    return saved ? JSON.parse(saved) : {};
  });
  
  const trackToolUsage = (toolName) => {
    const updated = {
      ...toolUsage,
      [toolName]: (toolUsage[toolName] || 0) + 1
    };
    setToolUsage(updated);
    localStorage.setItem('toolUsage', JSON.stringify(updated));
  };
  
  // Check admin status only when fully authenticated with a complete profile
  // NOT during profile setup - would cause remount and clear the username field
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.profileComplete) {
      checkAdminStatus();
    }
  }, [isAuthenticated, currentUser?.profileComplete]);

  // Track app open on mount - use ref to avoid triggering re-renders
  const hasTrackedOpen = React.useRef(false);
  useEffect(() => {
    if (hasTrackedOpen.current) return;
    hasTrackedOpen.current = true;
    const now = new Date().toISOString();
    // Update localStorage directly without setState to avoid re-renders
    const existing = JSON.parse(localStorage.getItem('appOpenTimestamps') || '[]');
    const updated = [...existing, now];
    localStorage.setItem('appOpenTimestamps', JSON.stringify(updated));
    // Sync state quietly
    setAppOpenTimestamps(updated);
  }, []);
  
  // Pattern Analysis Functions
  const analyzePatterns = () => {
    const allTimestamps = [...appOpenTimestamps, ...panicButtonTimestamps];
    if (allTimestamps.length === 0) return null;
    
    // Group by day of week
    const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const hourCount = {};
    
    allTimestamps.forEach(ts => {
      const date = new Date(ts);
      const day = date.getDay();
      const hour = date.getHours();
      
      dayCount[day]++;
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    
    // Find riskiest day
    const riskiestDay = Object.entries(dayCount).reduce((max, [day, count]) => 
      count > max.count ? { day: parseInt(day), count } : max
    , { day: 0, count: 0 });
    
    // Find riskiest hour range
    const riskiestHour = Object.entries(hourCount).reduce((max, [hour, count]) => 
      count > max.count ? { hour: parseInt(hour), count } : max
    , { hour: 0, count: 0 });
    
    // Get time category
    const getTimeCategory = (hour) => {
      if (hour >= 6 && hour < 12) return 'Morning (6am-12pm)';
      if (hour >= 12 && hour < 18) return 'Afternoon (12pm-6pm)';
      if (hour >= 18 && hour < 24) return 'Evening (6pm-12am)';
      return 'Night (12am-6am)';
    };
    
    // This week's activity
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = allTimestamps.filter(ts => new Date(ts) >= oneWeekAgo);
    
    return {
      totalOpens: appOpenTimestamps.length,
      panicButtonUses: panicButtonTimestamps.length,
      riskiestDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][riskiestDay.day],
      riskiestDayCount: riskiestDay.count,
      riskiestHour: riskiestHour.hour,
      riskiestTimeCategory: getTimeCategory(riskiestHour.hour),
      thisWeekOpens: thisWeek.length,
      averagePerDay: (allTimestamps.length / Math.max(1, getDaysClean())).toFixed(1)
    };
  };
  
  // Check if user is in a high-risk time right now
  const getProactiveLiveWarning = () => {
    const patterns = analyzePatterns();
    if (!patterns || patterns.totalOpens < 5) return null; // Need at least 5 data points
    
    const now = new Date();
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const currentHour = now.getHours();
    
    // Check if current time matches risky pattern
    const isRiskyDay = currentDay === patterns.riskiestDay && patterns.riskiestDayCount >= 3;
    const isRiskyHour = Math.abs(currentHour - patterns.riskiestHour) <= 1; // Within 1 hour
    
    if (isRiskyDay || isRiskyHour) {
      return {
        message: `Heads up - you typically get triggered around this time (${patterns.riskiestTimeCategory}${isRiskyDay ? ` on ${patterns.riskiestDay}s` : ''}). The urge will pass in 15-20 minutes.`,
        severity: 'warning'
      };
    }
    
    return null;
  };
  
  // (duplicate useEffect removed)

  // Isolated Timer Component - doesn't trigger parent re-renders

  const TimerDisplay = React.memo(({ startDate }) => {
    const [timeClean, setTimeClean] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
      const calculateTime = () => {
        const now = new Date();
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const diff = now - start;
        
        setTimeClean({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60)
        });
      };

      calculateTime(); // Initial calculation
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    }, [startDate]);

    const formatTime = (num) => String(num).padStart(2, '0');

    return (
      <div className="text-6xl font-bold text-white mb-2 font-mono tracking-wider">
        {timeClean.days}:{formatTime(timeClean.hours)}:{formatTime(timeClean.minutes)}
      </div>
    );
  });

  // Helper function to calculate days clean (for badges, stats, etc.)
  const getDaysClean = () => {
    const now = new Date();
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };
  
  // Form Validation Helpers
  const validateInput = {
    email: (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    phone: (phone) => {
      // Australian phone format: 04XX XXX XXX or (0X) XXXX XXXX
      const re = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
      return re.test(phone.replace(/\s/g, ''));
    },
    username: (username) => {
      return username && username.trim().length >= 2 && username.trim().length <= 30;
    },
    password: (password) => {
      // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
      return password && password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
    },
    required: (value) => {
      return value !== null && value !== undefined && value.toString().trim() !== '';
    },
    number: (value, min = null, max = null) => {
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      if (min !== null && num < min) return false;
      if (max !== null && num > max) return false;
      return true;
    },
    url: (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
  };

  // Daily check-in on app open
  useEffect(() => {
    // Small delay to allow settings restore from Supabase to complete first
    // This prevents double-awarding daily check-in points on new devices
    const timer = setTimeout(() => {
      if (isAuthenticated) checkDailyCheckIn();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleReset = () => {
    const newDate = new Date();
    setStartDate(newDate);
    localStorage.setItem('startDate', newDate.toISOString());
    syncProfileToSupabase({ start_date: newDate.toISOString() }).catch(() => {});
    setShowResetModal(false);
  };

  const formatNumber = (num) => String(num).padStart(2, '0');

  // Points & Achievement Functions
  const addPoints = (amount, reason) => {
    const newPoints = points + amount;
    setPoints(newPoints);
    localStorage.setItem('userPoints', newPoints);

    // Check for level up
    const newLevel = calculateLevel(newPoints);
    if (newLevel > level) {
      setLevel(newLevel);
      localStorage.setItem('userLevel', newLevel);
      syncProfileToSupabase({ points: newPoints, level: newLevel }).catch(() => {});
    } else {
      syncProfileToSupabase({ points: newPoints }).catch(() => {});
    }
  };

  const calculateLevel = (totalPoints) => {
    // Level progression: 500 points per level for first 5, then scales up
    if (totalPoints < 500) return 1;
    if (totalPoints < 1000) return 2;
    if (totalPoints < 1500) return 3;
    if (totalPoints < 2000) return 4;
    if (totalPoints < 2500) return 5;
    // After level 5: 500 points per level
    return 5 + Math.floor((totalPoints - 2500) / 500);
  };

  const getLevelTier = (lvl) => {
    if (lvl <= 5) return { name: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-100', icon: '🥉' };
    if (lvl <= 10) return { name: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100', icon: '🥈' };
    if (lvl <= 15) return { name: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '🥇' };
    if (lvl <= 20) return { name: 'Platinum', color: 'text-blue-600', bg: 'bg-blue-100', icon: '💎' };
    return { name: 'Diamond', color: 'text-purple-600', bg: 'bg-purple-100', icon: '💎' };
  };

  const checkDailyCheckIn = () => {
    const today = new Date().toDateString();
    if (lastCheckIn !== today) {
      addPoints(10, 'Daily check-in');
      setLastCheckIn(today);
      localStorage.setItem('lastCheckIn', today);
      syncSettingsToSupabase({ last_check_in: today }).catch(() => {});
      return true;
    }
    return false;
  };

  // Journal Functions
  const saveJournalEntry = (entry) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
      ...entry
    };
    
    const updated = [...journalEntries, newEntry];
    setJournalEntries(updated);
    localStorage.setItem('journalEntries', JSON.stringify(updated));
    
    // Award points
    const isFirstToday = !journalEntries.some(e => 
      new Date(e.date).toDateString() === new Date().toDateString()
    );
    
    const basePoints = isFirstToday ? 15 : 10;
    const modeBonus = entry.mode === 'structured' ? 5 : 0;
    addPoints(basePoints + modeBonus, 'Journal entry');
    
    // Show success message
    showSuccess('Journal entry saved!');

    // Sync to Supabase in background
    syncJournalEntry(newEntry).catch(() => {});

    return newEntry;
  };

  const getEntriesForDate = (date) => {
    const dateString = new Date(date).toDateString();
    return journalEntries.filter(entry => 
      new Date(entry.date).toDateString() === dateString
    );
  };

  const hasEntryOnDate = (date) => {
    return getEntriesForDate(date).length > 0;
  };

  const HomeTab = () => {
    // Get most used tools (top 3)
    const getMostUsedTools = () => {
      const tools = [
        { id: 'mindfulness', name: 'Journal', icon: '📝', color: 'blue' },
        { id: 'my-budget', name: 'My Budget', icon: '💰', color: 'green' },
        { id: 'analytics', name: 'My Progress', icon: '📊', color: 'indigo' },
        { id: 'music-discovery', name: 'Music Discovery', icon: '🎵', color: 'purple' },
        { id: 'activities', name: 'Challenges', icon: '🎯', color: 'orange' },
        { id: 'chat', name: 'Community', icon: '💬', color: 'pink' },
        { id: 'why-quitting', name: 'Why I\'m Quitting', icon: '♥', color: 'red' },
        { id: 'shop', name: 'Skill Builder', icon: '🛠️', color: 'teal' }
      ];

      // Sort by usage count
      const sorted = tools
        .map(tool => ({ ...tool, uses: toolUsage[tool.id] || 0 }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 3);

      // If no usage data, show default tools
      if (sorted.every(t => t.uses === 0)) {
        return [
          tools.find(t => t.id === 'mindfulness'),
          tools.find(t => t.id === 'my-budget'),
          tools.find(t => t.id === 'analytics')
        ];
      }

      return sorted;
    };

    const mostUsedTools = getMostUsedTools();
    const daysClean = getDaysClean();
    const totalSaved = (dailyGamblingSpend * daysClean).toFixed(0);

    const quotes = [
      "Every urge you resist is a victory.",
      "Progress, not perfection.",
      "You're stronger than the urge.",
      "One day at a time.",
      "Recovery is worth fighting for.",
      "The urge will pass. It always does.",
      "You're building a better future.",
      "Every clean day is a gift to yourself.",
      "Chase the dopamine that builds you up, not the kind that tears you down.",
      "Your future self is grateful for every choice you make today.",
      "You don't have to be perfect. You just have to keep going.",
      "The version of you that wins is the one who shows up again tomorrow."
    ];

    // Pick 3 candidate quotes for today, seeded by the date so the same
    // 3 options show up all day even if the page reloads.
    const todayKey = new Date().toDateString();
    const dayNumber = new Date().getDate() + new Date().getMonth() * 31;
    const todaysOptions = [
      quotes[dayNumber % quotes.length],
      quotes[(dayNumber + 5) % quotes.length],
      quotes[(dayNumber + 9) % quotes.length],
    ];

    const [dailyQuoteChoice, setDailyQuoteChoice] = useState(() => {
      const saved = localStorage.getItem('dailyQuoteChoice');
      if (!saved) return null;
      try {
        const parsed = JSON.parse(saved);
        // Only use the saved choice if it was made today
        return parsed.date === todayKey ? parsed.quote : null;
      } catch (e) {
        return null;
      }
    });

    const chooseDailyQuote = (quote) => {
      setDailyQuoteChoice(quote);
      localStorage.setItem('dailyQuoteChoice', JSON.stringify({ date: todayKey, quote }));
    };

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
        {/* Sleek Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Beat the Bet</h1>
              <p className="text-xs text-gray-500 mt-0.5">Recovery Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${getLevelTier(level).bg} ${getLevelTier(level).color} px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm`}>
                <span className="text-sm">{getLevelTier(level).icon}</span>
                <span>Lvl {level}</span>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm">
                {points}pts
              </div>
            </div>
          </div>
        </div>

        {/* Main Timer Card */}
        <div className="px-6 pt-6">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="text-center">
              <p className="text-sm font-semibold opacity-90 mb-2 uppercase tracking-wide">Time Gamble-Free</p>
              {!profileLoaded && isAuthenticated ? (
                <div className="text-4xl font-bold text-white mb-2 opacity-50">Loading...</div>
              ) : (
                <TimerDisplay startDate={startDate} />
              )}
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs opacity-75 mb-0.5">Clean Days</p>
                  <p className="text-2xl font-bold">{daysClean}</p>
                </div>
                {dailyGamblingSpend > 0 && (
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <p className="text-xs opacity-75 mb-0.5">Money Saved</p>
                    <p className="text-2xl font-bold">${totalSaved}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowResetModal(true)}
                className="text-xs text-white opacity-60 hover:opacity-100 transition-opacity underline mt-4"
              >
                Reset Timer
              </button>
            </div>
          </div>
        </div>

        {/* SOS Panic Button */}
        <div className="px-6 pt-4">
          <button
            onClick={() => {
              const now = new Date().toISOString();
              const updated = [...panicButtonTimestamps, now];
              setPanicButtonTimestamps(updated);
              localStorage.setItem('panicButtonTimestamps', JSON.stringify(updated));
              syncAppEvent('panic_button').catch(() => {});
              setShowPanicModal(true);
            }}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl p-5 shadow-lg transition-all active:scale-95"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🆘</span>
              <div className="text-left">
                <p className="font-bold text-lg">I Need Help Right Now</p>
                <p className="text-sm opacity-90">Tap here when you feel the urge</p>
              </div>
            </div>
          </button>
        </div>

        {/* First Time Welcome */}
        {daysClean === 0 && (
          <div className="px-6 pt-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Beat the Bet!</h2>
                <p className="text-gray-700 mb-4">
                  You've taken the first step toward recovery. Every journey starts with day one.
                </p>
                <div className="bg-white rounded-xl p-4 text-left space-y-2 mb-4">
                  <p className="text-sm text-gray-800"><strong>✅ Start journaling</strong> - Write about your thoughts and feelings</p>
                  <p className="text-sm text-gray-800"><strong>✅ Set a savings goal</strong> - See how much you can save</p>
                  <p className="text-sm text-gray-800"><strong>✅ Explore tools</strong> - Discover resources to help you succeed</p>
                </div>
                <p className="text-xs text-gray-600">
                  Remember: You're not alone. We're here to support you every step of the way.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Section */}
        <div className="px-6 pt-4 space-y-3">
          {(() => {
            if (!paydaySettings.enabled || !paydaySettings.startDate) return null;
            
            const start = new Date(paydaySettings.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let daysToAdd;
            switch(paydaySettings.frequency) {
              case 'weekly': daysToAdd = 7; break;
              case 'fortnightly': daysToAdd = 14; break;
              case 'monthly': daysToAdd = 30; break;
              case 'custom': daysToAdd = paydaySettings.customDays || 7; break;
              default: daysToAdd = 7;
            }
            
            let nextPayday = new Date(start);
            while (nextPayday < today) {
              nextPayday.setDate(nextPayday.getDate() + daysToAdd);
            }
            
            const isToday = nextPayday.toDateString() === new Date().toDateString();
            
            if (!isToday) return null;
            
            return (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-4 shadow-md">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-bold text-red-900 mb-1">Today is Payday</p>
                    <p className="text-sm text-red-800">
                      Stay strong. Don't gamble it away. You've worked too hard for this money.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {(() => {
            const liveWarning = getProactiveLiveWarning();
            if (!liveWarning) return null;
            
            return (
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-xl p-4 shadow-md">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">Pattern Alert</p>
                    <p className="text-sm text-gray-800 mb-2">{liveWarning.message}</p>
                    <button
                      onClick={() => setShowPanicModal(true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                    >
                      Get Support Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pt-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            
            {/* Daily Quote */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <p className="text-xs font-semibold opacity-75 uppercase tracking-wide mb-3">Today's Reminder</p>
              {dailyQuoteChoice ? (
                <div>
                  <p className="text-lg font-semibold italic mb-2">"{dailyQuoteChoice}"</p>
                  <button
                    onClick={() => setDailyQuoteChoice(null)}
                    className="text-xs text-white opacity-70 hover:opacity-100 underline"
                  >
                    Choose a different one
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm opacity-90 mb-2">Pick the one that speaks to you today:</p>
                  {todaysOptions.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => chooseDailyQuote(option)}
                      className="w-full text-left bg-white bg-opacity-15 hover:bg-opacity-25 rounded-lg px-4 py-3 transition-colors"
                    >
                      <p className="text-sm font-semibold italic">"{option}"</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Check-In */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      Daily Check-In
                    </h3>
                    <p className="text-sm text-gray-600">
                      {lastCheckIn === new Date().toDateString() 
                        ? '✓ Completed today - great job!' 
                        : 'Take a moment to reflect — how are you feeling today?'}
                    </p>
                  </div>
                  {lastCheckIn === new Date().toDateString() ? (
                    <div className="bg-green-100 rounded-full p-3">
                      <span className="text-2xl">✅</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        trackToolUsage('mindfulness');
                        setActiveTool('mindfulness');
                        setShowJournalCalendar(true);
                        setSelectedJournalDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Quick Access</h2>
                <span className="text-xs text-gray-500">Most used</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {mostUsedTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      trackToolUsage(tool.id);
                      setActiveTab('resources');
                      setActiveTool(tool.id);
                      if (tool.id === 'mindfulness') {
                        setShowJournalCalendar(true);
                      }
                    }}
                    className="bg-white hover:shadow-lg rounded-xl p-4 text-center transition-all duration-200 shadow-md"
                  >
                    <div className={`bg-${tool.color}-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-3xl">{tool.icon}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{tool.name}</p>
                    {tool.uses > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{tool.uses} uses</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* All Tools Button */}
            <button
              onClick={() => { setActiveTab('resources'); setActiveTool(null); }}
              className="w-full bg-white hover:bg-gray-50 rounded-xl shadow-md p-4 text-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all"
            >
              <p className="text-sm font-semibold text-gray-700">View All Tools →</p>
            </button>

          </div>
        </div>
      </div>
    );
  };

  const ResetModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Reset Your Timer?</h2>
        
        <p className="text-gray-700 mb-6">
          Recovery isn't always linear. If you need to reset, that's okay. What matters is that you're here, trying again.
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => window.location.href = 'tel:1800858858'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 flex items-center transition-colors"
          >
            <Phone className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Talk to Someone</div>
              <div className="text-sm opacity-90">1800 858 858 (24/7)</div>
            </div>
          </button>

          <button
            onClick={() => window.open(`https://gaaustralia.org.au/meetings/?tsml-query=${encodeURIComponent(userCity || '')}&tsml-view=map`, '_blank')}
            className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 flex items-center transition-colors"
          >
            <MapPin className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Find a Meeting</div>
              <div className="text-sm opacity-90">Gamblers Anonymous</div>
            </div>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowResetModal(false)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  const PanicModal = () => {
    const [step, setStep] = useState('questions'); // 'questions' or 'answers'
    const [panicResponses, setPanicResponses] = useState({
      trigger: '',
      why: '',
      what_will_happen: ''
    });

    const panicQuestions = [
      {
        id: 'trigger',
        question: 'What is triggering you right now?',
        placeholder: 'Name the specific situation, feeling, or thought...',
        helpText: 'Be specific. Naming it helps you see it clearly.'
      },
      {
        id: 'why',
        question: 'Why do you want to gamble right now?',
        placeholder: 'What do you think gambling will give you?',
        helpText: 'Is this really what you need, or just what feels urgent?'
      },
      {
        id: 'what_will_happen',
        question: 'How will you feel when you go to sleep tonight if you gamble now?',
        placeholder: 'Think about lying in bed tonight...',
        helpText: 'Picture yourself tonight. The shame. The regret. The broken promises.'
      }
    ];

    const healthyDopamineActivities = [
      { icon: '🏃', text: 'Go for a brisk walk or run right now', action: 'Move your body' },
      { icon: '☀️', text: 'Step outside and get some sunlight and fresh air', action: 'Get outside' },
      { icon: '🎵', text: 'Put on music you love and really listen, or dance', action: 'Listen to music' },
      { icon: '📞', text: 'Call or text someone who supports you', action: 'Reach out' },
      { icon: '🧘', text: 'Do 5 deep breaths - in for 4, out for 6', action: 'Breathe' },
      { icon: '🚿', text: 'Take a cold shower', action: 'Cold shower' },
      { icon: '✍️', text: 'Journal about this urge - get it out of your head', action: 'Write it out' },
      { icon: '🤸', text: 'Do 20 push-ups, squats, or jumping jacks', action: 'Quick exercise' },
    ];

    const viewAnswers = () => {
      if (!panicResponses.trigger && !panicResponses.why && !panicResponses.what_will_happen) {
        return; // Don't proceed if no answers
      }
      setStep('answers');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
          {step === 'questions' ? (
            <>
              <div className="text-center mb-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Slow Down</h2>
                <p className="text-gray-600">
                  Before you do anything, answer these questions honestly.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {panicQuestions.map((q) => (
                  <div key={q.id} className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-800 mb-1">{q.question}</h3>
                    <p className="text-xs text-gray-500 mb-2">{q.helpText}</p>
                    <textarea
                      value={panicResponses[q.id]}
                      onChange={(e) => setPanicResponses({...panicResponses, [q.id]: e.target.value})}
                      placeholder={q.placeholder}
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPanicModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl py-3 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={viewAnswers}
                  disabled={!panicResponses.trigger && !panicResponses.why && !panicResponses.what_will_happen}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl py-3 font-bold transition-colors"
                >
                  Read My Answers
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💭</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Read What You Just Wrote</h2>
                <p className="text-gray-600">
                  Does this sound like rational thinking, or addiction talking?
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {panicQuestions.map((q) => (
                  panicResponses[q.id] && (
                    <div key={q.id} className="bg-blue-50 rounded-xl p-4">
                      <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                      <p className="text-gray-700 italic">"{panicResponses[q.id]}"</p>
                    </div>
                  )
                ))}
              </div>

              {/* Why I'm Quitting Reminder */}
              {(whyImQuitting.primaryReason || whyImQuitting.reasons.length > 0) && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-5 mb-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">❤️</span>
                    <h3 className="font-bold text-gray-900 text-lg">Remember Why You're Doing This</h3>
                  </div>
                  
                  {whyImQuitting.primaryReason && (
                    <p className="text-gray-800 font-semibold mb-3 text-center italic">
                      "{whyImQuitting.primaryReason}"
                    </p>
                  )}
                  
                  {whyImQuitting.reasons.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {whyImQuitting.reasons.slice(0, 4).map((reason, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2 border border-red-200">
                          {reason.type === 'text' && (
                            <p className="text-xs text-gray-700 line-clamp-2">{reason.content}</p>
                          )}
                          {reason.type === 'photo' && (
                            <img src={reason.content} alt="Reminder" className="w-full rounded-lg object-cover max-h-24" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600 text-center mt-3">
                    Is gambling really worth losing this?
                  </p>
                </div>
              )}

              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6">
                <p className="font-bold text-gray-800 mb-3">Instead of gambling, try one of these:</p>
                <div className="grid grid-cols-2 gap-2">
                  {healthyDopamineActivities.map((activity, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-green-200 rounded-lg p-3 text-left"
                    >
                      <span className="text-2xl block mb-1">{activity.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{activity.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700 text-center leading-relaxed">
                  <strong>Remember:</strong> You've come {getDaysClean()} day{getDaysClean() !== 1 ? 's' : ''} without gambling. This urge will pass in 10-20 minutes. You just need to get through the next few minutes.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => window.location.href = 'tel:1800858858'}
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl p-4 flex items-center transition-colors shadow-md"
                >
                  <Phone className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-bold">Call Gambling Helpline Now</div>
                    <div className="text-sm opacity-95">1800 858 858 (Free, 24/7)</div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => {
                  setStep('questions');
                  setPanicResponses({ trigger: '', why: '', what_will_happen: '' });
                  setShowPanicModal(false);
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl py-3 font-semibold transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const ResourcesTab = () => {
    // If a tool is selected, show that tool's page
    if (activeTool === 'helpline') return <HelplinePage />;
    if (activeTool === 'betstop') return <BetStopPage />;
    if (activeTool === 'meetings') return <MeetingsPage />;
    if (activeTool === 'my-budget') return <MyBudgetPage />;
    if (activeTool === 'mindfulness') return showJournalCalendar ? <JournalCalendarView /> : <MindfulnessPage />;
    if (activeTool === 'shop') return <ShopPage />;
    if (activeTool === 'activities') return <ActivityChallengesPage />;
    if (activeTool === 'chat') return <CommunityChatPage />;
    if (activeTool === 'analytics') return <StreakAnalyticsPage />;
    if (activeTool === 'music-discovery') return <MusicDiscoveryPage />;
    if (activeTool === 'why-quitting') return <WhyImQuittingPage />;
    if (activeTool === 'settings') return <SettingsPage />;
    if (activeTool === 'admin') return isAdmin() ? <AdminPanel adminEmails={adminEmails} setAdminEmails={setAdminEmails} setActiveTool={setActiveTool} showSuccess={showSuccess} showError={showError} validators={validators} /> : <div className='p-8 text-center text-gray-500'>Access denied.</div>;
    if (activeTool === 'privacy') return <PrivacyPolicyPage />;
    if (activeTool === 'terms') return <TermsOfServicePage />;
    if (activeTool === 'nearby') return <NearbyPage />;

    // Otherwise show the tools list
    return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Tools & Resources</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Everything you need to support your recovery</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6">
          {/* Free Resources Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">Free Support</h2>
            
            {/* Call Helpline */}
            <div className="space-y-3">
              <button
                onClick={() => setActiveTool('helpline')}
                className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">Call Helpline</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">
                      Free, confidential support available 24/7
                    </p>
                  </div>
                </div>
              </button>

              {/* Visit BetStop */}
              <button
                onClick={() => setActiveTool('betstop')}
                className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-red-100 p-3 rounded-full mr-4">
                    <LifeBuoy className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">Visit BetStop</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">
                      National self-exclusion register
                    </p>
                  </div>
                </div>
              </button>

              {/* Find a Meeting */}
              <button
                onClick={() => setActiveTool('meetings')}
                className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">Find a Meeting</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">
                      Connect with others in recovery
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Premium Tools Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-lg font-bold text-gray-800">Premium Tools</h2>
            </div>

            {/* Premium Banner */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg p-5 mb-4 text-white">
              <div className="flex items-center mb-2">
                <Sparkles className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-bold">Beat the Bet Premium</h3>
              </div>
              <p className="text-sm opacity-90 mb-3">
                Advanced tools to strengthen your recovery and build a better life.
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-2 text-xs">
                <strong>Our commitment:</strong> A portion of all revenue supports Lifeline Australia.
              </div>
            </div>

            <div className="space-y-3">
              {/* My Budget */}
              <button
                onClick={() => { trackToolUsage('my-budget'); setActiveTool('my-budget'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-2.5 rounded-full mr-3">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">My Budget</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Know exactly where your money goes
                    </p>
                  </div>
                </div>
              </button>

              {/* Music Discovery */}
              <button
                onClick={() => { trackToolUsage('music-discovery'); setActiveTool('music-discovery'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-pink-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-pink-100 p-2.5 rounded-full mr-3">
                    <span className="text-xl">🎵</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">Music Discovery</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {seedArtists.length === 0
                        ? "Find new artists - healthy dopamine replacement"
                        : `${seedArtists.length} artists • ${Object.keys(artistFeedback).filter(a => artistFeedback[a] === 'liked').length} liked`}
                    </p>
                  </div>
                </div>
              </button>

              {/* Private Journal & Mindfulness */}
              <button
                onClick={() => { trackToolUsage('mindfulness'); setActiveTool('mindfulness'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2.5 rounded-full mr-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">Private Journal & Mindfulness</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Daily journaling, breathing exercises, coping tools
                    </p>
                  </div>
                </div>
              </button>

              {/* Why I'm Quitting */}
              <button
                onClick={() => { trackToolUsage('why-quitting'); setActiveTool('why-quitting'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-red-100 p-2.5 rounded-full mr-3">
                    <span className="text-xl">❤️</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">Why I'm Quitting</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {whyImQuitting.primaryReason || whyImQuitting.reasons.length > 0
                        ? `${whyImQuitting.reasons.length + (whyImQuitting.primaryReason ? 1 : 0)} reason${whyImQuitting.reasons.length > 0 ? 's' : ''} saved`
                        : 'Save your reasons - your anchor during urges'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Skill Builder */}
              <button
                onClick={() => { trackToolUsage('shop'); setActiveTool('shop'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2.5 rounded-full mr-3">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">Skill Builder</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Interest-based activities and discovery tools
                    </p>
                  </div>
                </div>
              </button>

              {/* Community Chat */}
              <button
                onClick={() => { trackToolUsage('chat'); setActiveTool('chat'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-green-100 p-2.5 rounded-full mr-3">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">Community Chat</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Connect with others in anonymous chat rooms
                    </p>
                  </div>
                </div>
              </button>

              {/* Activity Challenges */}
              <button
                onClick={() => { trackToolUsage('activities'); setActiveTool('activities'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-orange-100 p-2.5 rounded-full mr-3">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">Activity Challenges</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Physical movement tracker and challenges
                    </p>
                  </div>
                </div>
              </button>

              {/* Streak Analytics */}
              <button
                onClick={() => { trackToolUsage('analytics'); setActiveTool('analytics'); }}
                className="w-full bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-2.5 rounded-full mr-3">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">Streak Analytics</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Detailed insights into recovery patterns
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Attribution */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Free resources provided in partnership with Gambling Help Online, BetStop (Australian Government), 
              and Gamblers Anonymous Australia. Beat the Bet is not affiliated with these organizations 
              but supports their mission.
            </p>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // Individual Tool Pages
  const HelplinePage = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-6">
        <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Tools</span>
        </button>
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
            <Phone className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Call Helpline</h1>
            <p className="text-sm opacity-90">Free, confidential support 24/7</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gambling Help Online</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Talk to a professional counsellor who understands what you're going through. 
              All calls are free, confidential, and available 24 hours a day, 7 days a week.
            </p>
            
            <a 
              href="tel:1800858858"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-5 text-center transition-colors mb-4"
            >
              <div className="text-3xl font-bold mb-1">1800 858 858</div>
              <div className="text-sm opacity-90">Tap to call now</div>
            </a>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">What to expect:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Speak with trained gambling counsellors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Get help creating a recovery plan</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Information about financial counselling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Support for family members affected</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-3">Online Chat Available</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you prefer not to call, online chat counselling is also available through the Gambling Help Online website.
            </p>
            <button
              onClick={() => window.open('https://www.gamblinghelponline.org.au/', '_blank')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg py-3 font-semibold transition-colors"
            >
              Visit Website →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const BetStopPage = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-red-500 text-white p-6">
        <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Tools</span>
        </button>
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">BetStop</h1>
            <p className="text-sm opacity-90">Australia's national self-exclusion register</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">BetStop</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              BetStop is Australia's national self-exclusion register, run by the Australian Government. Registering means you'll be excluded from all licensed Australian online wagering services and mobile betting apps.
            </p>
            
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">A single registration covers every licensed online wagering operator in Australia — you don't need to contact them individually. It's completely free, with no fees to register or maintain your exclusion. It's also legally enforceable: operators are required by law to verify registrations and refuse bets from excluded users. Your exclusion takes effect immediately after registration.</p>
            </div>

            <button
              onClick={() => window.open('https://www.betstop.gov.au/', '_blank')}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg p-4 font-bold transition-colors"
            >
              Register with BetStop →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-3">Exclusion Periods</h3>
            <p className="text-gray-600 text-sm mb-4">
              Choose an exclusion period that works for you:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-800 mr-2">3 months</span>
                <span className="text-gray-600">Minimum period</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-800 mr-2">6 months</span>
                <span className="text-gray-600">Recommended</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-800 mr-2">1-5 years</span>
                <span className="text-gray-600">Long-term protection</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-800 mr-2">Permanent</span>
                <span className="text-gray-600">Lifetime exclusion</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> BetStop is run by the Australian Government and is completely free to use. 
              Your exclusion begins immediately after registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const MeetingsPage = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-green-500 text-white p-6">
        <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Tools</span>
        </button>
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Find a Meeting</h1>
            <p className="text-sm opacity-90">Gamblers Anonymous Australia</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Connect With Others</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Gamblers Anonymous is a fellowship of people who share their experience, strength, 
              and hope with each other. Find meetings in your area and connect with others who 
              understand your journey.
            </p>
            
            <button
              onClick={() => window.open(`https://gaaustralia.org.au/meetings/?tsml-query=${encodeURIComponent(userCity || '')}&tsml-view=map`, '_blank')}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 font-bold transition-colors mb-4"
            >
              Search Meetings Near You →
            </button>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Meeting formats:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>In-person meetings across Australia</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Online meetings via Zoom</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Phone meetings available</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>No fees or dues required</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-3">What Happens at a Meeting?</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              GA meetings are peer-led support groups where members share their experiences and support 
              each other's recovery. You don't have to speak if you don't want to - just listening helps.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-800 text-sm mb-1">Safe Space</div>
                <div className="text-xs text-gray-600">Everything shared stays confidential</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-800 text-sm mb-1">No Judgment</div>
                <div className="text-xs text-gray-600">Everyone is there for the same reason</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-800 text-sm mb-1">Free Support</div>
                <div className="text-xs text-gray-600">No fees, registration, or commitment required</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <strong>First time?</strong> It's normal to feel nervous. Everyone was new once. 
              You can just listen at your first meeting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const PollsPage = () => {
    const [selections, setSelections] = useState({});
    const [submitted, setSubmitted] = useState(false);

    // Sample NBA games for tomorrow (January 30, 2026)
    const games = [
      { id: 1, away: "Boston Celtics", home: "Miami Heat", time: "7:30 PM ET" },
      { id: 2, away: "Los Angeles Lakers", home: "Golden State Warriors", time: "10:00 PM ET" },
      { id: 3, away: "Milwaukee Bucks", home: "Philadelphia 76ers", time: "7:00 PM ET" },
      { id: 4, away: "Phoenix Suns", home: "Denver Nuggets", time: "9:00 PM ET" },
      { id: 5, away: "Dallas Mavericks", home: "Oklahoma City Thunder", time: "8:00 PM ET" },
      { id: 6, away: "New York Knicks", home: "Cleveland Cavaliers", time: "7:30 PM ET" },
    ];

    const handleTeamSelect = (gameId, team) => {
      if (!submitted) {
        setSelections({ ...selections, [gameId]: team });
      }
    };

    const handleSubmit = () => {
      if (Object.keys(selections).length === games.length) {
        setSubmitted(true);
      } else {
        alert('Please make predictions for all games first.');
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-purple-500 text-white p-6">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Urge Outlet Polls</h1>
              <p className="text-sm opacity-90">Tomorrow's NBA Games</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">
            {/* Info Banner */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Safe prediction outlet:</strong> Pick who you think will win. No money, no consequences, just a harmless way to scratch the itch.
              </p>
            </div>

            {/* Games List */}
            {games.map((game) => (
              <div key={game.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Game Header */}
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold">{game.time}</p>
                </div>

                {/* Teams */}
                <div className="p-4">
                  {/* Away Team */}
                  <button
                    onClick={() => handleTeamSelect(game.id, 'away')}
                    disabled={submitted}
                    className={`w-full p-4 rounded-lg mb-2 text-left font-semibold transition-all ${
                      selections[game.id] === 'away'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                    } ${submitted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{game.away}</span>
                      {selections[game.id] === 'away' && (
                        <span className="text-sm font-bold">✓</span>
                      )}
                    </div>
                  </button>

                  {/* Home Team */}
                  <button
                    onClick={() => handleTeamSelect(game.id, 'home')}
                    disabled={submitted}
                    className={`w-full p-4 rounded-lg text-left font-semibold transition-all ${
                      selections[game.id] === 'home'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                    } ${submitted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{game.home}</span>
                      {selections[game.id] === 'home' && (
                        <span className="text-sm font-bold">✓</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ))}

            {/* Submit Section */}
            {!submitted ? (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <h3 className="font-bold text-gray-800 mb-3">Ready to submit?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You've made {Object.keys(selections).length} of {games.length} predictions.
                </p>
                <button
                  onClick={handleSubmit}
                  className={`w-full py-3 rounded-lg font-bold transition-colors ${
                    Object.keys(selections).length === games.length
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit Predictions
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <div className="text-center mb-4">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Predictions Submitted!</h3>
                  <p className="text-sm text-gray-600">
                    Your picks are locked in. Check back after the games to see how you did!
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Your Picks:</h4>
                  <div className="space-y-2">
                    {games.map((game) => {
                      const pickedTeam = selections[game.id] === 'away' ? game.away : game.home;
                      return (
                        <div key={game.id} className="text-sm text-gray-700 flex items-center">
                          <span className="text-purple-600 mr-2">•</span>
                          <span className="font-semibold">{pickedTeam}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelections({});
                    setSubmitted(false);
                  }}
                  className="w-full py-3 border-2 border-purple-500 text-purple-500 rounded-lg font-bold hover:bg-purple-50 transition-colors"
                >
                  Make New Predictions
                </button>
              </div>
            )}

            {/* Reminder */}
            <div className="bg-green-50 rounded-xl p-5 border-l-4 border-green-500">
              <p className="text-sm text-gray-700">
                <strong>Remember:</strong> This is just for fun. No money involved, nothing to win or lose. 
                You're building healthier habits, one prediction at a time.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ActivityChallengesPage = () => {
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [newActivity, setNewActivity] = useState({ type: '', duration: '', distance: '' });
    
    const activityTypes = [
      { id: 'walk', name: 'Walk', emoji: '🚶', unit: 'minutes' },
      { id: 'run', name: 'Run', emoji: '🏃', unit: 'minutes' },
      { id: 'bike', name: 'Bike Ride', emoji: '🚴', unit: 'minutes' },
      { id: 'yoga', name: 'Yoga/Stretch', emoji: '🧘', unit: 'minutes' },
      { id: 'gym', name: 'Gym Workout', emoji: '🏋️', unit: 'minutes' },
      { id: 'swim', name: 'Swimming', emoji: '🏊', unit: 'minutes' },
      { id: 'dance', name: 'Dancing', emoji: '💃', unit: 'minutes' },
      { id: 'sports', name: 'Sports', emoji: '⚽', unit: 'minutes' },
    ];

    const dailyChallenges = [
      { id: 'steps', goal: dailyStepGoal, current: todaySteps, title: `${dailyStepGoal.toLocaleString()} Steps`, emoji: '👟', unit: 'steps' },
      { id: 'movement', goal: 30, current: getTodayActivityMinutes(), title: '30 Minutes Active', emoji: '🔥', unit: 'min' },
      { id: 'fresh_air', goal: 1, current: getTodayOutdoorActivities(), title: 'Get Outside', emoji: '🌳', unit: 'times' },
    ];

    function getTodayActivityMinutes() {
      const today = new Date().toDateString();
      return activityLog
        .filter(a => new Date(a.date).toDateString() === today)
        .reduce((sum, a) => sum + parseInt(a.duration || 0), 0);
    }

    function getTodayOutdoorActivities() {
      const today = new Date().toDateString();
      const outdoorTypes = ['walk', 'run', 'bike', 'sports'];
      return activityLog
        .filter(a => new Date(a.date).toDateString() === today && outdoorTypes.includes(a.type))
        .length > 0 ? 1 : 0;
    }

    function getWeeklyStats() {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekActivities = activityLog.filter(a => new Date(a.date) >= weekAgo);
      const totalMinutes = weekActivities.reduce((sum, a) => sum + parseInt(a.duration || 0), 0);
      const daysActive = new Set(weekActivities.map(a => new Date(a.date).toDateString())).size;
      
      return { totalMinutes, daysActive };
    }

    const addActivity = () => {
      if (newActivity.type && newActivity.duration) {
        const activity = {
          id: Date.now(),
          type: newActivity.type,
          duration: parseInt(newActivity.duration),
          distance: newActivity.distance,
          date: new Date().toISOString(),
        };
        
        const updated = [...activityLog, activity];
        setActivityLog(updated);
        localStorage.setItem('activityLog', JSON.stringify(updated));

        // Sync to Supabase
        const session = supabase.getSession();
        if (session) {
          supabase.from('activity_log').insert({
            user_id: session.user.id,
            type: activity.type,
            duration_minutes: activity.duration,
            distance: activity.distance || null,
            logged_at: activity.date
          }).catch(() => {});
        }

        addPoints(10, `Logged ${activityTypes.find(t => t.id === newActivity.type)?.name}`);
        setNewActivity({ type: '', duration: '', distance: '' });
        setShowAddActivity(false);
      }
    };

    const deleteActivity = (id) => {
      const updated = activityLog.filter(a => a.id !== id);
      setActivityLog(updated);
      localStorage.setItem('activityLog', JSON.stringify(updated));
    };

    const weeklyStats = getWeeklyStats();
    const todayActivities = activityLog.filter(a => 
      new Date(a.date).toDateString() === new Date().toDateString()
    );

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-orange-500 text-white p-6">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Activity Challenges</h1>
              <p className="text-sm opacity-90">Move your body, change your mind</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            
            {/* Daily Challenges */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Today's Challenges</h3>
              <div className="space-y-3">
                {dailyChallenges.map(challenge => {
                  const progress = Math.min((challenge.current / challenge.goal) * 100, 100);
                  const isComplete = challenge.current >= challenge.goal;
                  
                  return (
                    <div key={challenge.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{challenge.emoji}</span>
                          <span className="font-semibold text-gray-800">{challenge.title}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
                            {challenge.current}/{challenge.goal}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">{challenge.unit}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {isComplete && (
                        <p className="text-xs text-green-600 font-semibold">✓ Complete!</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-4">This Week</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold">{weeklyStats.totalMinutes}</p>
                  <p className="text-sm opacity-90">Minutes Active</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{weeklyStats.daysActive}/7</p>
                  <p className="text-sm opacity-90">Days Active</p>
                </div>
              </div>
            </div>

            {/* Quick Activity Buttons */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Quick Log Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                {activityTypes.slice(0, 6).map(type => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setNewActivity({ type: type.id, duration: '20', distance: '' });
                      setShowAddActivity(true);
                    }}
                    className="bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-lg p-4 transition-all"
                  >
                    <div className="text-3xl mb-2">{type.emoji}</div>
                    <div className="text-sm font-semibold text-gray-700">{type.name}</div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowAddActivity(true)}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 font-semibold transition-colors"
              >
                + Log Custom Activity
              </button>
            </div>

            {/* Add Activity Form */}
            {showAddActivity && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-500" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Log Activity</h3>
                  <button
                    onClick={() => {
                      setShowAddActivity(false);
                      setNewActivity({ type: '', duration: '', distance: '' });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Type</label>
                    <select
                      value={newActivity.type}
                      onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select activity</option>
                      {activityTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.emoji} {type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newActivity.duration}
                      onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                      placeholder="30"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Distance (optional)</label>
                    <input
                      type="text"
                      value={newActivity.distance}
                      onChange={(e) => setNewActivity({...newActivity, distance: e.target.value})}
                      placeholder="5 km"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <button
                    onClick={addActivity}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 font-bold transition-colors"
                  >
                    Log Activity
                  </button>
                </div>
              </div>
            )}

            {/* Today's Activities */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Today's Log</h3>
              {todayActivities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No activities logged today</p>
              ) : (
                <div className="space-y-3">
                  {todayActivities.map(activity => {
                    const type = activityTypes.find(t => t.id === activity.type);
                    return (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{type?.emoji}</span>
                          <div>
                            <p className="font-semibold text-gray-800">{type?.name}</p>
                            <p className="text-sm text-gray-600">
                              {activity.duration} min
                              {activity.distance && ` • ${activity.distance}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteActivity(activity.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Why Movement Helps */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Why this matters:</strong> Physical activity releases endorphins and reduces stress - the same feelings gambling falsely promises. Moving your body rewires your brain's reward system naturally.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MoneySavedPage = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-green-500 text-white p-6">
        <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Tools</span>
        </button>
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Money Saved Tracker</h1>
            <p className="text-sm opacity-90">Coming Soon • Premium Feature</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-center mb-6">
              <Lock className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">See Your Financial Recovery</h2>
            <p className="text-gray-700 mb-6 leading-relaxed text-center">
              Track how much money you're saving by not gambling. Visualize your progress with charts and set meaningful savings goals.
            </p>
            
            <div className="bg-green-50 rounded-lg p-5 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Features include:</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Set your average daily gambling spend</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Watch your savings grow in real-time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Visual charts showing weekly/monthly progress</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Set savings goals for things you want</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Celebrate milestones ($100, $500, $1000+)</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 rounded-lg p-4 font-bold cursor-not-allowed"
            >
              Available with Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );


  // Payday Tracking Component
  const PaydayTrackingSection = ({ paydaySettings, setPaydaySettings }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [tempFrequency, setTempFrequency] = useState('weekly');
    const [customDays, setCustomDays] = useState('');

    const savePaydaySettings = () => {
      if (!selectedDate) return;
      
      const settings = {
        enabled: true,
        startDate: selectedDate,
        frequency: tempFrequency,
        customDays: tempFrequency === 'custom' ? parseInt(customDays) : null
      };
      
      setPaydaySettings(settings);
      localStorage.setItem('paydaySettings', JSON.stringify(settings));
      syncSettingsToSupabase({ payday_settings: settings }).catch(() => {});
      setShowCalendar(false);
    };

    const disablePayday = () => {
      const settings = { enabled: false, startDate: null, frequency: 'weekly', customDays: null };
      setPaydaySettings(settings);
      localStorage.setItem('paydaySettings', JSON.stringify(settings));
    };

    const getNextPayday = () => {
      if (!paydaySettings.enabled || !paydaySettings.startDate) return null;
      
      const start = new Date(paydaySettings.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let daysToAdd;
      switch(paydaySettings.frequency) {
        case 'weekly': daysToAdd = 7; break;
        case 'fortnightly': daysToAdd = 14; break;
        case 'monthly': daysToAdd = 30; break;
        case 'custom': daysToAdd = paydaySettings.customDays || 7; break;
        default: daysToAdd = 7;
      }
      
      let nextPayday = new Date(start);
      while (nextPayday < today) {
        nextPayday.setDate(nextPayday.getDate() + daysToAdd);
      }
      
      return nextPayday;
    };

    const nextPayday = getNextPayday();
    const isToday = nextPayday && nextPayday.toDateString() === new Date().toDateString();

    // Simple calendar for current month
    const renderCalendar = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square" />);
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isSelected = selectedDate === dateStr;
        const isPast = date < new Date().setHours(0, 0, 0, 0);
        
        days.push(
          <button
            key={day}
            onClick={() => !isPast && setSelectedDate(dateStr)}
            disabled={isPast}
            className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
              isSelected
                ? 'bg-green-500 text-white'
                : isPast
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-green-100 border border-gray-200'
            }`}
          >
            {day}
          </button>
        );
      }
      
      return days;
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Payday Reminders</h3>
          {paydaySettings.enabled && (
            <button
              onClick={disablePayday}
              className="text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              Disable
            </button>
          )}
        </div>

        {isToday && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">💰</span>
              <p className="font-bold text-red-800">Today is Payday</p>
            </div>
            <p className="text-sm text-red-700">
              Stay strong. Don't gamble it away. You've worked too hard for this money.
            </p>
          </div>
        )}

        {paydaySettings.enabled && !isToday && nextPayday && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              <strong>Next payday:</strong> {nextPayday.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {paydaySettings.frequency === 'custom' 
                ? `Every ${paydaySettings.customDays} days`
                : `Every ${paydaySettings.frequency}`}
            </p>
          </div>
        )}

        {!paydaySettings.enabled && (
          <p className="text-sm text-gray-600 mb-4">
            Get reminded on payday to stay strong and not gamble your money away.
          </p>
        )}

        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-3 font-semibold transition-colors"
        >
          {paydaySettings.enabled ? 'Change Payday Settings' : '📅 Set Up Payday Reminders'}
        </button>

        {showCalendar && (
          <div className="mt-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-gray-800 mb-3">Select Your Next Payday</h4>
            
            {/* Month/Year Header */}
            <div className="text-center font-bold text-gray-800 mb-2">
              {new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
            </div>
            
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {renderCalendar()}
            </div>

            {/* Frequency Selector */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pay Frequency</label>
              <select
                value={tempFrequency}
                onChange={(e) => setTempFrequency(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="weekly">Weekly (every 7 days)</option>
                <option value="fortnightly">Fortnightly (every 14 days)</option>
                <option value="monthly">Monthly (every 30 days)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {tempFrequency === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Every ___ days</label>
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                  max="365"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCalendar(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={savePaydaySettings}
                disabled={!selectedDate || (tempFrequency === 'custom' && !customDays)}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg py-2 font-bold"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const MyBudgetPage = React.memo(() => {
    // ============================================================
    // State: Bank Accounts, Income, Expenses, Allocations
    // ============================================================
    const [budgetData, setBudgetData] = React.useState(() => {
      const saved = localStorage.getItem('myBudgetData');
      return saved ? JSON.parse(saved) : {
        accounts: [],
        primaryIncome: { amount: '', frequency: 'fortnightly' },
        additionalIncome: [],
        expenses: [],
        allocations: [],
        tags: ['Subscriptions', 'Loan Repayments', 'Bills', 'Insurance']
      };
    });

    const { accounts, primaryIncome, additionalIncome, expenses, allocations, tags } = budgetData;

    const saveBudgetData = (updated) => {
      setBudgetData(updated);
      localStorage.setItem('myBudgetData', JSON.stringify(updated));
      const session = supabase.getSession();
      if (session) {
        supabase.from('liabilities').upsert({
          user_id: session.user.id,
          items: updated,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      }
    };

    // ============================================================
    // Frequency conversion - normalise everything to the primary pay cycle
    // ============================================================
    const FREQUENCY_PER_YEAR = {
      weekly: 52,
      fortnightly: 26,
      monthly: 12,
      quarterly: 4,
      yearly: 1
    };

    const toPerCycle = (amount, itemFrequency, targetFrequency) => {
      const amt = parseFloat(amount) || 0;
      if (amt === 0) return 0;
      const itemPerYear = FREQUENCY_PER_YEAR[itemFrequency] || 12;
      const targetPerYear = FREQUENCY_PER_YEAR[targetFrequency] || 26;
      // Convert item amount to an annual figure, then divide by target cycles per year
      const annual = amt * itemPerYear;
      const perCycle = annual / targetPerYear;
      // Round up on uneven divisions so the user always sets aside slightly more, never short
      return Math.ceil(perCycle * 100) / 100;
    };

    const primaryFrequency = primaryIncome.frequency || 'fortnightly';

    const totalIncomePerCycle = React.useMemo(() => {
      const primary = parseFloat(primaryIncome.amount) || 0;
      const additional = additionalIncome.reduce((sum, inc) => {
        return sum + toPerCycle(inc.amount, inc.frequency, primaryFrequency);
      }, 0);
      return primary + additional;
    }, [primaryIncome, additionalIncome, primaryFrequency]);

    const totalExpensesPerCycle = React.useMemo(() => {
      return expenses.reduce((sum, exp) => {
        return sum + toPerCycle(exp.amount, exp.frequency, primaryFrequency);
      }, 0);
    }, [expenses, primaryFrequency]);

    const leftover = Math.max(0, totalIncomePerCycle - totalExpensesPerCycle);
    const isOverBudget = totalExpensesPerCycle > totalIncomePerCycle;

    const totalAllocated = React.useMemo(() => {
      return allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    }, [allocations]);

    const unallocated = Math.max(0, leftover - totalAllocated);
    const isOverAllocated = totalAllocated > leftover;

    const frequencyLabels = {
      weekly: 'Weekly',
      fortnightly: 'Fortnightly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    };

    // ============================================================
    // Bank Accounts
    // ============================================================
    const [showAccountForm, setShowAccountForm] = React.useState(false);
    const [newAccountName, setNewAccountName] = React.useState('');

    const addAccount = () => {
      if (!newAccountName.trim()) return;
      const updated = {
        ...budgetData,
        accounts: [...accounts, { id: Date.now(), name: newAccountName.trim() }]
      };
      saveBudgetData(updated);
      setNewAccountName('');
      setShowAccountForm(false);
    };

    const deleteAccount = (id) => {
      const updated = {
        ...budgetData,
        accounts: accounts.filter(a => a.id !== id),
        expenses: expenses.map(e => e.accountId === id ? { ...e, accountId: null } : e),
        allocations: allocations.map(a => a.accountId === id ? { ...a, accountId: null } : a)
      };
      saveBudgetData(updated);
    };

    // ============================================================
    // Income
    // ============================================================
    const [editingIncome, setEditingIncome] = React.useState(false);
    const [tempIncomeAmount, setTempIncomeAmount] = React.useState(primaryIncome.amount || '');
    const [tempIncomeFreq, setTempIncomeFreq] = React.useState(primaryIncome.frequency || 'fortnightly');

    const savePrimaryIncome = () => {
      const updated = {
        ...budgetData,
        primaryIncome: { amount: tempIncomeAmount, frequency: tempIncomeFreq }
      };
      saveBudgetData(updated);
      setEditingIncome(false);
      showSuccess('Income updated!');
    };

    const [showAdditionalIncomeForm, setShowAdditionalIncomeForm] = React.useState(false);
    const [newIncomeTitle, setNewIncomeTitle] = React.useState('');
    const [newIncomeAmount, setNewIncomeAmount] = React.useState('');
    const [newIncomeFreq, setNewIncomeFreq] = React.useState('monthly');

    const addAdditionalIncome = () => {
      if (!newIncomeTitle.trim() || !newIncomeAmount) return;
      const updated = {
        ...budgetData,
        additionalIncome: [...additionalIncome, {
          id: Date.now(),
          title: newIncomeTitle.trim(),
          amount: parseFloat(newIncomeAmount),
          frequency: newIncomeFreq
        }]
      };
      saveBudgetData(updated);
      setNewIncomeTitle('');
      setNewIncomeAmount('');
      setNewIncomeFreq('monthly');
      setShowAdditionalIncomeForm(false);
    };

    const deleteAdditionalIncome = (id) => {
      saveBudgetData({ ...budgetData, additionalIncome: additionalIncome.filter(i => i.id !== id) });
    };

    // ============================================================
    // Expenses
    // ============================================================
    const [showExpenseForm, setShowExpenseForm] = React.useState(false);
    const [editingExpenseId, setEditingExpenseId] = React.useState(null);
    const [expTitle, setExpTitle] = React.useState('');
    const [expAmount, setExpAmount] = React.useState('');
    const [expFreq, setExpFreq] = React.useState('monthly');
    const [expTag, setExpTag] = React.useState(tags[0] || '');
    const [expAccountId, setExpAccountId] = React.useState(null);
    const [newTagInput, setNewTagInput] = React.useState('');
    const [showNewTagInput, setShowNewTagInput] = React.useState(false);

    const resetExpenseForm = () => {
      setExpTitle('');
      setExpAmount('');
      setExpFreq('monthly');
      setExpTag(tags[0] || '');
      setExpAccountId(null);
      setEditingExpenseId(null);
      setShowExpenseForm(false);
      setShowNewTagInput(false);
      setNewTagInput('');
    };

    const startEditExpense = (exp) => {
      setEditingExpenseId(exp.id);
      setExpTitle(exp.title);
      setExpAmount(String(exp.amount));
      setExpFreq(exp.frequency);
      setExpTag(exp.tag || tags[0] || '');
      setExpAccountId(exp.accountId || null);
      setShowExpenseForm(true);
    };

    const addOrUpdateExpense = () => {
      if (!expTitle.trim() || !expAmount) return;
      let updatedTags = tags;
      let finalTag = expTag;
      if (showNewTagInput && newTagInput.trim()) {
        finalTag = newTagInput.trim();
        if (!tags.includes(finalTag)) {
          updatedTags = [...tags, finalTag];
        }
      }

      let updatedExpenses;
      if (editingExpenseId) {
        updatedExpenses = expenses.map(e => e.id === editingExpenseId
          ? { ...e, title: expTitle.trim(), amount: parseFloat(expAmount), frequency: expFreq, tag: finalTag, accountId: expAccountId }
          : e
        );
      } else {
        updatedExpenses = [...expenses, {
          id: Date.now(),
          title: expTitle.trim(),
          amount: parseFloat(expAmount),
          frequency: expFreq,
          tag: finalTag,
          accountId: expAccountId
        }];
      }

      saveBudgetData({ ...budgetData, expenses: updatedExpenses, tags: updatedTags });
      resetExpenseForm();
    };

    const deleteExpense = (id) => {
      saveBudgetData({ ...budgetData, expenses: expenses.filter(e => e.id !== id) });
    };

    // ============================================================
    // Allocations (leftover money targets)
    // ============================================================
    const [showAllocationForm, setShowAllocationForm] = React.useState(false);
    const [editingAllocationId, setEditingAllocationId] = React.useState(null);
    const [allocTitle, setAllocTitle] = React.useState('');
    const [allocAmount, setAllocAmount] = React.useState('');
    const [allocAccountId, setAllocAccountId] = React.useState(null);

    const resetAllocationForm = () => {
      setAllocTitle('');
      setAllocAmount('');
      setAllocAccountId(null);
      setEditingAllocationId(null);
      setShowAllocationForm(false);
    };

    const startEditAllocation = (alloc) => {
      setEditingAllocationId(alloc.id);
      setAllocTitle(alloc.title);
      setAllocAmount(String(alloc.amount));
      setAllocAccountId(alloc.accountId || null);
      setShowAllocationForm(true);
    };

    const addOrUpdateAllocation = () => {
      if (!allocTitle.trim() || !allocAmount) return;
      let updatedAllocations;
      if (editingAllocationId) {
        updatedAllocations = allocations.map(a => a.id === editingAllocationId
          ? { ...a, title: allocTitle.trim(), amount: parseFloat(allocAmount), accountId: allocAccountId }
          : a
        );
      } else {
        updatedAllocations = [...allocations, {
          id: Date.now(),
          title: allocTitle.trim(),
          amount: parseFloat(allocAmount),
          accountId: allocAccountId
        }];
      }
      saveBudgetData({ ...budgetData, allocations: updatedAllocations });
      resetAllocationForm();
    };

    const deleteAllocation = (id) => {
      saveBudgetData({ ...budgetData, allocations: allocations.filter(a => a.id !== id) });
    };

    // Colors for the allocation bar segments
    const segmentColors = [
      'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500'
    ];

    const getAccountName = (id) => accounts.find(a => a.id === id)?.name || null;

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-green-500 text-white p-6">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Budget</h1>
              <p className="text-sm opacity-90">Know exactly where your money goes</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">

            {/* Intro */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <p className="text-sm text-gray-700">Add your income and expenses below. We'll work out exactly how much you have left over each pay, and help you decide where it goes.</p>
            </div>

            {/* ============================================ */}
            {/* BANK ACCOUNTS */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Bank Accounts</h3>
                <button onClick={() => setShowAccountForm(!showAccountForm)} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  {showAccountForm ? 'Cancel' : '+ Add'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Add your accounts so you can assign expenses and savings to the right place.</p>

              {showAccountForm && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAccount()}
                    placeholder="e.g. Everyday, Savings, Joint"
                    className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button onClick={addAccount} disabled={!newAccountName.trim()} className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 rounded-lg font-semibold text-sm">Add</button>
                </div>
              )}

              {accounts.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-2">No accounts added yet.</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">{acc.name}</span>
                      <button onClick={() => deleteAccount(acc.id)} className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* BOX 1: INCOME & EXPENSES */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold text-gray-800 mb-4">Income & Expenses</h3>

              {/* Primary Income */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Your Pay</p>
                {editingIncome ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-green-500">
                      <span className="text-gray-500 font-semibold">$</span>
                      <input
                        type="number"
                        value={tempIncomeAmount}
                        onChange={(e) => setTempIncomeAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2.5 focus:outline-none bg-transparent"
                      />
                    </div>
                    <select
                      value={tempIncomeFreq}
                      onChange={(e) => setTempIncomeFreq(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      {Object.keys(frequencyLabels).map(f => <option key={f} value={f}>{frequencyLabels[f]}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingIncome(false)} className="flex-1 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold">Cancel</button>
                      <button onClick={savePrimaryIncome} disabled={!tempIncomeAmount} className="flex-1 py-2 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-semibold">Save</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditingIncome(true)} className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left">
                    <div>
                      {primaryIncome.amount ? (
                        <>
                          <p className="font-bold text-gray-800">${parseFloat(primaryIncome.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{frequencyLabels[primaryFrequency]}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Tap to set your pay amount</p>
                      )}
                    </div>
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Additional Income */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Additional Income</p>
                  <button onClick={() => setShowAdditionalIncomeForm(!showAdditionalIncomeForm)} className="text-blue-600 hover:text-blue-700 font-semibold text-xs">
                    {showAdditionalIncomeForm ? 'Cancel' : '+ Add'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Rental income, bonuses, side income — anything extra.</p>

                {showAdditionalIncomeForm && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-2 space-y-2">
                    <input
                      type="text"
                      value={newIncomeTitle}
                      onChange={(e) => setNewIncomeTitle(e.target.value)}
                      placeholder="e.g. Rental income, Bonus"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 flex-1 border border-gray-300 rounded-lg px-2.5 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={newIncomeAmount}
                          onChange={(e) => setNewIncomeAmount(e.target.value)}
                          placeholder="Amount"
                          className="flex-1 p-2.5 focus:outline-none text-sm bg-transparent"
                        />
                      </div>
                      <select value={newIncomeFreq} onChange={(e) => setNewIncomeFreq(e.target.value)} className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        {Object.keys(frequencyLabels).map(f => <option key={f} value={f}>{frequencyLabels[f]}</option>)}
                      </select>
                    </div>
                    <button onClick={addAdditionalIncome} disabled={!newIncomeTitle.trim() || !newIncomeAmount} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg py-2 font-semibold text-sm">Add</button>
                  </div>
                )}

                {additionalIncome.length > 0 && (
                  <div className="space-y-2">
                    {additionalIncome.map(inc => (
                      <div key={inc.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{inc.title}</p>
                          <p className="text-xs text-gray-500">${inc.amount.toLocaleString()} {frequencyLabels[inc.frequency]}</p>
                        </div>
                        <button onClick={() => deleteAdditionalIncome(inc.id)} className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 my-4"></div>

              {/* Expenses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Expenses</p>
                  <button onClick={() => { resetExpenseForm(); setShowExpenseForm(!showExpenseForm); }} className="text-blue-600 hover:text-blue-700 font-semibold text-xs">
                    {showExpenseForm ? 'Cancel' : '+ Add'}
                  </button>
                </div>

                {showExpenseForm && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-3 space-y-2">
                    <input
                      type="text"
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      placeholder="e.g. Rent, Netflix, Car loan"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 flex-1 border border-gray-300 rounded-lg px-2.5 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          placeholder="Amount"
                          className="flex-1 p-2.5 focus:outline-none text-sm bg-transparent"
                        />
                      </div>
                      <select value={expFreq} onChange={(e) => setExpFreq(e.target.value)} className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        {Object.keys(frequencyLabels).map(f => <option key={f} value={f}>{frequencyLabels[f]}</option>)}
                      </select>
                    </div>

                    {/* Tag selector */}
                    {!showNewTagInput ? (
                      <div className="flex gap-2">
                        <select value={expTag} onChange={(e) => setExpTag(e.target.value)} className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                          {tags.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => setShowNewTagInput(true)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded-lg text-sm font-semibold">New Tag</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="New tag name"
                          className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => setShowNewTagInput(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded-lg text-sm font-semibold">Cancel</button>
                      </div>
                    )}

                    {/* Account selector */}
                    {accounts.length > 0 && (
                      <select value={expAccountId || ''} onChange={(e) => setExpAccountId(e.target.value ? parseInt(e.target.value) : null)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">No account assigned</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    )}

                    <button onClick={addOrUpdateExpense} disabled={!expTitle.trim() || !expAmount} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg py-2.5 font-semibold text-sm">
                      {editingExpenseId ? 'Save Changes' : 'Add Expense'}
                    </button>
                  </div>
                )}

                {expenses.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-2">No expenses added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map(exp => (
                      <div key={exp.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-sm font-semibold text-gray-800">{exp.title}</p>
                              {exp.tag && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{exp.tag}</span>}
                            </div>
                            <p className="text-xs text-gray-500">
                              ${exp.amount.toLocaleString()} {frequencyLabels[exp.frequency]}
                              {getAccountName(exp.accountId) && ` · ${getAccountName(exp.accountId)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => startEditExpense(exp)} className="text-gray-400 hover:text-blue-500 text-xs px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                            <button onClick={() => deleteExpense(exp.id)} className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 my-4"></div>

              {/* Output Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Income per {frequencyLabels[primaryFrequency].toLowerCase()}</span>
                  <span className="font-semibold text-gray-800">${totalIncomePerCycle.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expenses per {frequencyLabels[primaryFrequency].toLowerCase()}</span>
                  <span className="font-semibold text-gray-800">${totalExpensesPerCycle.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg mt-2 ${isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <span className={`font-bold ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                    {isOverBudget ? 'Over budget' : 'Leftover'}
                  </span>
                  <span className={`text-xl font-bold ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                    {isOverBudget ? '-' : ''}${Math.abs(totalIncomePerCycle - totalExpensesPerCycle).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {isOverBudget && (
                  <p className="text-xs text-red-600">Your expenses are higher than your income for this pay cycle. Something will need to change.</p>
                )}
              </div>
            </div>

            {/* ============================================ */}
            {/* BOX 2: ALLOCATE THE LEFTOVER */}
            {/* ============================================ */}
            {!isOverBudget && leftover > 0 && (
              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="font-bold text-gray-800 mb-1">Where should it go?</h3>
                <p className="text-xs text-gray-500 mb-4">Decide how to split your ${leftover.toLocaleString(undefined, { maximumFractionDigits: 2 })} leftover each {frequencyLabels[primaryFrequency].toLowerCase()}.</p>

                {/* Stacked bar showing the split */}
                <div className="mb-4">
                  <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden flex">
                    {allocations.map((alloc, i) => {
                      const pct = leftover > 0 ? ((parseFloat(alloc.amount) || 0) / leftover) * 100 : 0;
                      return (
                        <div
                          key={alloc.id}
                          className={`${segmentColors[i % segmentColors.length]} h-full transition-all`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                          title={`${alloc.title}: $${alloc.amount}`}
                        />
                      );
                    })}
                    {unallocated > 0 && (
                      <div className="bg-gray-300 h-full transition-all" style={{ width: `${(unallocated / leftover) * 100}%` }} title={`Unallocated: $${unallocated.toFixed(2)}`} />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {allocations.map((alloc, i) => (
                      <div key={alloc.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <div className={`w-2.5 h-2.5 rounded-full ${segmentColors[i % segmentColors.length]}`}></div>
                        <span>{alloc.title}</span>
                      </div>
                    ))}
                    {unallocated > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                        <span>Unallocated</span>
                      </div>
                    )}
                  </div>
                </div>

                {isOverAllocated && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-red-700 font-semibold">You've allocated more than your leftover amount. Adjust one of the boxes below.</p>
                  </div>
                )}

                {/* Allocation form */}
                {showAllocationForm && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-3 space-y-2">
                    <input
                      type="text"
                      value={allocTitle}
                      onChange={(e) => setAllocTitle(e.target.value)}
                      placeholder="e.g. Savings, Car fund, Holiday"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2.5 bg-white focus-within:ring-2 focus-within:ring-green-500">
                      <span className="text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={allocAmount}
                        onChange={(e) => setAllocAmount(e.target.value)}
                        placeholder="Amount per pay"
                        className="flex-1 p-2.5 focus:outline-none text-sm bg-transparent"
                      />
                    </div>
                    {accounts.length > 0 && (
                      <select value={allocAccountId || ''} onChange={(e) => setAllocAccountId(e.target.value ? parseInt(e.target.value) : null)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                        <option value="">No account assigned</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    )}
                    <button onClick={addOrUpdateAllocation} disabled={!allocTitle.trim() || !allocAmount} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg py-2.5 font-semibold text-sm">
                      {editingAllocationId ? 'Save Changes' : 'Add Allocation'}
                    </button>
                  </div>
                )}

                {/* Allocation list */}
                <div className="space-y-2 mb-3">
                  {allocations.map((alloc, i) => (
                    <div key={alloc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${segmentColors[i % segmentColors.length]}`}></div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{alloc.title}</p>
                          {getAccountName(alloc.accountId) && <p className="text-xs text-gray-500">{getAccountName(alloc.accountId)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="font-bold text-gray-800">${parseFloat(alloc.amount).toLocaleString()}</p>
                        <button onClick={() => startEditAllocation(alloc)} className="text-gray-400 hover:text-blue-500 text-xs px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                        <button onClick={() => deleteAllocation(alloc.id)} className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => { resetAllocationForm(); setShowAllocationForm(!showAllocationForm); }} className="w-full border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-600 hover:text-green-700 rounded-lg py-2.5 font-semibold text-sm transition-colors mb-3">
                  {showAllocationForm ? 'Cancel' : '+ Add Allocation'}
                </button>

                {/* Unallocated summary */}
                <div className={`flex justify-between items-center p-3 rounded-lg ${unallocated > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <span className="font-semibold text-gray-700">Unallocated</span>
                  <span className={`text-lg font-bold ${unallocated > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
                    ${unallocated.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  });
  const ShopPage = () => {
    // Available interests
    const availableInterests = [
      { id: 'cooking', name: '🍳 Cooking & Food', icon: '🍳' },
      { id: 'music', name: '🎸 Music', icon: '🎸' },
      { id: 'art', name: '🎨 Art & Creativity', icon: '🎨' },
      { id: 'reading', name: '📚 Reading & Writing', icon: '📚' },
      { id: 'diy', name: '🛠️ DIY & Building', icon: '🛠️' },
      { id: 'photography', name: '📷 Photography', icon: '📷' },
      { id: 'gaming', name: '🎮 Gaming', icon: '🎮' },
      { id: 'gardening', name: '🌱 Gardening', icon: '🌱' },
      { id: 'tech', name: '💻 Tech & Coding', icon: '💻' },
      { id: 'fitness', name: '🏋️ Fitness', icon: '🏋️' },
      { id: 'puzzles', name: '🧩 Puzzles & Brain Games', icon: '🧩' },
      { id: 'movies', name: '🎬 Movies & TV', icon: '🎬' },
      { id: 'sports', name: '⚽ Sports', icon: '⚽' },
    ];

    const toggleInterest = (interestId) => {
      const updated = selectedInterests.includes(interestId)
        ? selectedInterests.filter(id => id !== interestId)
        : [...selectedInterests, interestId];
      setSelectedInterests(updated);
      localStorage.setItem('selectedInterests', JSON.stringify(updated));
      if (!selectedInterests.includes(interestId)) {
        addPoints(5, `Added interest: ${availableInterests.find(i => i.id === interestId).name}`);
      }
    };

    // Activity suggestions by interest - EXTENSIVE LIST
    const getActivitySuggestion = () => {
      if (selectedInterests.length === 0) {
        return "Select some interests first to get personalized suggestions!";
      }

      const activities = {
        cooking: [
          "Try making scrambled eggs a new way",
          "Watch a 5-minute cooking tutorial on YouTube",
          "Look up a simple pasta recipe",
          "Make a sandwich with unusual ingredients",
          "Learn to make the perfect cup of coffee",
          "Bake cookies from a simple recipe",
          "Try cooking rice in a different way",
          "Make your own salad dressing",
          "Experiment with spices you don't normally use",
          "Cook an egg three different ways",
          "Make homemade popcorn on the stove",
          "Try a new breakfast idea",
          "Learn to make a simple soup",
          "Create your own pizza at home",
          "Make a smoothie with random ingredients",
          "Try meal prepping for tomorrow",
          "Learn to properly dice an onion",
          "Make homemade garlic bread",
          "Try cooking something you've never made before",
          "Watch a chef demonstrate knife skills",
          "Make a fancy grilled cheese",
          "Learn the perfect way to cook bacon",
          "Try making your own salsa",
          "Experiment with making a stir-fry",
          "Learn to make restaurant-style fried rice",
        ],
        music: [
          "Listen to a new album from an artist you like",
          "Learn 3 basic guitar chords (look up a tutorial)",
          "Create a playlist for your recovery journey",
          "Listen to a genre you've never tried before",
          "Watch a live concert video on YouTube",
          "Learn the lyrics to a song you love",
          "Try humming or singing along to your favorite song",
          "Listen to music from a different decade",
          "Watch a music theory video for beginners",
          "Explore a new artist recommended by Spotify",
          "Listen to a full album start to finish",
          "Create a workout playlist",
          "Find music from another country",
          "Watch a music documentary",
          "Learn about the history of your favorite band",
          "Listen to a podcast about music",
          "Try writing your own simple song lyrics",
          "Learn to clap a rhythm pattern",
          "Discover acoustic versions of songs you know",
          "Find a cover of your favorite song",
          "Listen to a movie soundtrack",
          "Explore lo-fi hip hop or ambient music",
          "Learn what BPM means and test songs",
          "Create a chill-out playlist",
          "Watch musicians react to songs on YouTube",
        ],
        art: [
          "Draw something from your room (5-minute sketch)",
          "Try a simple origami tutorial",
          "Doodle in a journal or on scrap paper",
          "Color in a coloring page (print or digital)",
          "Watch a speed painting video",
          "Draw a self-portrait from memory",
          "Try drawing with your non-dominant hand",
          "Sketch random shapes and turn them into objects",
          "Draw your favorite animal",
          "Try zentangle or mandala drawing",
          "Make abstract art with whatever you have",
          "Draw your dream house or room",
          "Sketch something outside your window",
          "Try drawing in only one continuous line",
          "Color something using only 3 colors",
          "Draw your feelings as shapes and colors",
          "Try finger painting if you have paint",
          "Make a collage from magazine cutouts",
          "Draw your favorite food item",
          "Try drawing optical illusions",
          "Sketch a quick landscape",
          "Draw patterns and fill them in",
          "Try drawing emotions as characters",
          "Make art using only dots",
          "Sketch out a comic strip idea",
        ],
        reading: [
          "Read one chapter of a book",
          "Find a short story online and read it",
          "Browse a topic you're curious about on Wikipedia",
          "Read an article about something interesting",
          "Write a short paragraph about your day",
          "Read poetry for 10 minutes",
          "Explore a new genre you've never tried",
          "Read the first chapter of a free book online",
          "Look up book recommendations on Reddit",
          "Read reviews of books you're interested in",
          "Start a reading list for the next month",
          "Read about a historical event",
          "Explore writing prompts online",
          "Read a celebrity autobiography excerpt",
          "Look up interesting facts about your favorite author",
          "Read a classic you've always meant to read",
          "Write a letter to your future self",
          "Read about a place you'd like to visit",
          "Explore graphic novels online",
          "Read fan theories about your favorite book/movie",
          "Write down 3 things you're grateful for",
          "Read about a scientific discovery",
          "Explore different writing styles",
          "Read book quotes and find your favorite",
          "Write a review of the last book you read",
        ],
        diy: [
          "Organize one drawer or shelf",
          "Fix something small that's broken",
          "Watch a DIY tutorial on YouTube",
          "Clean and organize your workspace",
          "Make a simple paper craft",
          "Rearrange furniture in one room",
          "Create a DIY organizer from recyclables",
          "Learn a simple knot-tying technique",
          "Try folding clothes the KonMari way",
          "Make a bookmark from paper",
          "Create labels for storage containers",
          "Build something with LEGO or blocks",
          "Try basic origami furniture",
          "Organize your cables and chargers",
          "Make a simple phone stand",
          "Create a vision board",
          "Try upcycling an old item",
          "Build a simple paper airplane",
          "Organize your digital files and desktop",
          "Learn basic home maintenance tips",
          "Create a emergency kit checklist",
          "Make DIY air fresheners",
          "Try organizing by color",
          "Create a cleaning schedule",
          "Make a goal-setting board",
        ],
        photography: [
          "Take 10 photos of interesting things around you",
          "Try taking photos from unusual angles",
          "Edit a photo on your phone",
          "Watch a photography tips video",
          "Take a photo walk around your neighborhood",
          "Try macro photography of small objects",
          "Photograph textures around your home",
          "Take photos of the same object in different lighting",
          "Try black and white photography",
          "Photograph shadows and reflections",
          "Take a self-portrait",
          "Create a photo series on one theme",
          "Experiment with phone camera settings",
          "Try food photography",
          "Capture golden hour lighting",
          "Photograph water or liquids",
          "Take photos of nature close-ups",
          "Try motion blur photography",
          "Photograph geometric shapes",
          "Take before and after photos",
          "Try portrait photography",
          "Capture the sky at different times",
          "Photograph your daily routine",
          "Experiment with symmetry",
          "Take photos from a low angle",
        ],
        gaming: [
          "Play a quick puzzle game (Wordle, Sudoku)",
          "Try a new mobile game (non-gambling)",
          "Watch a gaming stream or video",
          "Challenge yourself to beat a personal best",
          "Play a classic retro game online",
          "Try a different game genre than usual",
          "Play a free browser game",
          "Watch a gaming tutorial",
          "Try a logic puzzle game",
          "Play chess or checkers online",
          "Try a rhythm game",
          "Play a word game",
          "Try a relaxing puzzle game",
          "Play a trivia game",
          "Try a mobile strategy game",
          "Play Tetris or similar",
          "Try a hidden object game",
          "Play 2048 or number puzzles",
          "Try a match-3 game",
          "Play online pool or billiards",
          "Try a card game (solitaire, etc.)",
          "Play a typing speed game",
          "Try a memory matching game",
          "Play an educational game",
          "Try a simulation game",
        ],
        gardening: [
          "Water your plants and check their health",
          "Research a new plant you'd like to grow",
          "Clean and organize gardening tools",
          "Watch a gardening tips video",
          "Plan your next planting season",
          "Propagate a plant cutting",
          "Remove dead leaves from plants",
          "Learn about companion planting",
          "Research indoor plant care",
          "Plan a herb garden",
          "Learn about soil types",
          "Watch videos about composting",
          "Research pest control methods",
          "Learn about seasonal vegetables",
          "Plan a flower arrangement",
          "Research native plants in your area",
          "Learn about plant nutrition",
          "Watch garden tour videos",
          "Research vertical gardening",
          "Learn about different grow zones",
          "Plan a container garden",
          "Research drought-resistant plants",
          "Learn about pruning techniques",
          "Watch seed starting tutorials",
          "Research garden layout designs",
        ],
        tech: [
          "Learn a new keyboard shortcut",
          "Customize your phone home screen",
          "Watch a tech review video",
          "Try a coding challenge on a free website",
          "Organize your digital files",
          "Learn about a new app or software",
          "Try a beginner coding tutorial",
          "Organize your browser bookmarks",
          "Learn about keyboard shortcuts",
          "Watch a tutorial on Excel or Sheets",
          "Try building a simple HTML page",
          "Learn about internet privacy",
          "Organize your passwords securely",
          "Try a new productivity app",
          "Learn basic Photoshop skills",
          "Watch videos about new tech",
          "Organize your photo library",
          "Learn about smartphone features",
          "Try automating a simple task",
          "Learn about cloud storage",
          "Watch programming tutorials",
          "Clean up your email inbox",
          "Learn about tech security",
          "Try a new browser extension",
          "Learn about file formats",
        ],
        fitness: [
          "Do 20 jumping jacks",
          "Stretch for 5 minutes",
          "Take a 10-minute walk",
          "Try a quick yoga pose",
          "Dance to one song",
          "Do 10 pushups (or modified)",
          "Try a plank for 30 seconds",
          "Do 15 squats",
          "Stretch your neck and shoulders",
          "Try 10 lunges on each leg",
          "Do arm circles for 1 minute",
          "Try touching your toes",
          "Do calf raises while brushing teeth",
          "Try a wall sit for 30 seconds",
          "Do high knees for 30 seconds",
          "Try leg raises",
          "Do side bends",
          "Try a superman pose",
          "Do mountain climbers",
          "Walk up and down stairs",
          "Try burpees (3-5)",
          "Do standing twists",
          "Try a glute bridge",
          "Shadow box for 2 minutes",
          "Do bicycle crunches",
        ],
        puzzles: [
          "Do a crossword or word puzzle",
          "Play Sudoku",
          "Try a logic puzzle online",
          "Play a brain training game",
          "Solve a riddle or brain teaser",
          "Try a jigsaw puzzle",
          "Play word search",
          "Try a number puzzle",
          "Solve a mystery riddle",
          "Play a pattern recognition game",
          "Try cryptogram puzzles",
          "Do a maze",
          "Try lateral thinking puzzles",
          "Play spot-the-difference",
          "Try a rebus puzzle",
          "Do a KenKen puzzle",
          "Try a picture puzzle",
          "Play memory games",
          "Try logic grid puzzles",
          "Solve math riddles",
          "Try a tangram puzzle",
          "Play trivia questions",
          "Try anagram puzzles",
          "Solve visual puzzles",
          "Try code-breaking puzzles",
        ],
        movies: [
          "Watch a movie trailer for something new",
          "Read about a movie you've been curious about",
          "Make a list of movies you want to watch",
          "Watch a short film on YouTube",
          "Re-watch your favorite scene from a movie",
          "Watch behind-the-scenes footage",
          "Read movie trivia about your favorites",
          "Watch movie reviews on YouTube",
          "Explore different film genres",
          "Watch a classic movie trailer",
          "Read about filmmaking techniques",
          "Watch director commentaries",
          "Explore foreign films",
          "Watch documentary shorts",
          "Read about cinematography",
          "Watch movie analysis videos",
          "Explore film festivals online",
          "Read about your favorite actors",
          "Watch bloopers and outtakes",
          "Learn about movie special effects",
          "Watch animated shorts",
          "Read movie plot summaries",
          "Watch film history videos",
          "Explore indie films",
          "Watch Criterion Collection trailers",
        ],
        sports: [
          "Watch highlights from your favorite sport",
          "Read about your favorite team",
          "Practice a sports skill (dribbling, throwing)",
          "Watch a documentary about an athlete",
          "Play a casual sports game",
          "Learn the rules of a new sport",
          "Watch classic sports moments",
          "Read about sports history",
          "Practice juggling",
          "Try shadow boxing",
          "Watch skill tutorials",
          "Learn about sports strategy",
          "Watch game analysis videos",
          "Read player interviews",
          "Practice ball control",
          "Learn about sports science",
          "Watch training routines",
          "Read about sports psychology",
          "Watch trick shot videos",
          "Learn about sports nutrition",
          "Practice your golf swing",
          "Watch sports technique breakdowns",
          "Read game recaps",
          "Watch inspirational sports stories",
          "Learn sports terminology",
        ],
      };

      const randomInterest = selectedInterests[Math.floor(Math.random() * selectedInterests.length)];
      const activityList = activities[randomInterest];
      const randomActivity = activityList[Math.floor(Math.random() * activityList.length)];
      
      return randomActivity;
    };

    // Interest Selection View
    if (skillBuilderView === 'interests') {
      return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
          <div className="bg-blue-500 text-white p-6">
            <button onClick={() => setSkillBuilderView('main')} className="flex items-center mb-4 hover:opacity-80">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold">Choose Your Interests</h1>
            <p className="text-sm opacity-90">Select all that interest you</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-3">
                {availableInterests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-xl font-semibold transition-all text-left ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{interest.icon}</div>
                    <div className="text-sm">{interest.name.replace(/^.\s/, '')}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
                <p className="text-sm text-gray-600 text-center">
                  {selectedInterests.length === 0 
                    ? "Select at least one interest to get started"
                    : `${selectedInterests.length} interest${selectedInterests.length !== 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // "I'm Bored" Activity Generator View
    if (skillBuilderView === 'bored') {
      // Set initial activity when entering this view
      useEffect(() => {
        if (!currentBoredActivity) {
          setCurrentBoredActivity(getActivitySuggestion());
        }
      }, [currentBoredActivity]);

      return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
          <div className="bg-blue-500 text-white p-6">
            <button onClick={() => setSkillBuilderView('main')} className="flex items-center mb-4 hover:opacity-80">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold">Beat Boredom</h1>
            <p className="text-sm opacity-90">Here's something to do</p>
          </div>

          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="max-w-md mx-auto w-full space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">💡</div>
                <p className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
                  {currentBoredActivity}
                </p>
                <button
                  onClick={() => {
                    setCurrentBoredActivity(getActivitySuggestion());
                    addPoints(2, 'Generated activity suggestion');
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 font-bold transition-colors"
                >
                  Give Me Another Idea
                </button>
              </div>

              {selectedInterests.length === 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Select your interests to get personalized suggestions!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Music Discovery View
    if (skillBuilderView === 'music') {
      const [artistInput, setArtistInput] = useState('');
      const [recommendedArtist, setRecommendedArtist] = useState(null);

      // Simplified music recommendations (in real app, would use Spotify API)
      const musicRecommendations = {
        'kendrick lamar': ['J. Cole', 'JID', 'Denzel Curry', 'Vince Staples', 'Freddie Gibbs'],
        'taylor swift': ['Olivia Rodrigo', 'Gracie Abrams', 'Sabrina Carpenter', 'Conan Gray', 'Phoebe Bridgers'],
        'arctic monkeys': ['The Strokes', 'Franz Ferdinand', 'Interpol', 'The Killers', 'Catfish and the Bottlemen'],
        'drake': ['The Weeknd', 'Post Malone', 'Travis Scott', 'Bryson Tiller', 'PartyNextDoor'],
        'billie eilish': ['Lorde', 'Halsey', 'Melanie Martinez', 'AURORA', 'Lana Del Rey'],
      };

      const getRecommendation = () => {
        const artistLower = artistInput.toLowerCase().trim();
        const recommendations = musicRecommendations[artistLower] || ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd', 'The Rolling Stones'];
        const filtered = recommendations.filter(artist => 
          !favoriteArtists.includes(artist) && artist !== recommendedArtist
        );
        return filtered.length > 0 ? filtered[0] : recommendations[0];
      };

      const handleAlreadyKnow = () => {
        const next = getRecommendation();
        setRecommendedArtist(next);
      };

      const handleLoveThis = () => {
        const updated = [...favoriteArtists, recommendedArtist];
        setFavoriteArtists(updated);
        localStorage.setItem('favoriteArtists', JSON.stringify(updated));
        syncSettingsToSupabase({ favorite_artists: updated }).catch(() => {});
        addPoints(10, `Added artist: ${recommendedArtist}`);
        setRecommendedArtist(null);
        setArtistInput('');
      };

      return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
          <div className="bg-blue-500 text-white p-6">
            <button onClick={() => setSkillBuilderView('main')} className="flex items-center mb-4 hover:opacity-80">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold">Music Discovery</h1>
            <p className="text-sm opacity-90">Find new artists you'll love</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-md mx-auto space-y-6">
              {!recommendedArtist ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Who do you like?</h3>
                  <input
                    type="text"
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    placeholder="Enter an artist name..."
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setRecommendedArtist(getRecommendation())}
                    disabled={!artistInput.trim()}
                    className={`w-full py-3 rounded-lg font-bold transition-colors ${
                      artistInput.trim()
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Get Recommendation
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <div className="text-5xl mb-4">🎵</div>
                  <h3 className="font-bold text-gray-800 mb-2">You might like:</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-6">{recommendedArtist}</p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleAlreadyKnow}
                      className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Already Know
                    </button>
                    <button
                      onClick={handleLoveThis}
                      className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Love This! ❤️
                    </button>
                  </div>
                </div>
              )}

              {favoriteArtists.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-gray-800 mb-3">Your Artists</h3>
                  <div className="flex flex-wrap gap-2">
                    {favoriteArtists.map((artist, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {artist}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Main Skill Builder View
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-blue-500 text-white p-6">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Skill Builder</h1>
              <p className="text-sm opacity-90">Discover new interests</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">
            {/* Interests Button */}
            <button
              onClick={() => setSkillBuilderView('interests')}
              className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">My Interests</h3>
                  <p className="text-gray-600 text-sm">
                    {selectedInterests.length === 0 
                      ? "Choose what you're interested in"
                      : `${selectedInterests.length} interest${selectedInterests.length !== 1 ? 's' : ''} selected`}
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </button>

            {/* I'm Bored Button */}
            <button
              onClick={() => {
                setSkillBuilderView('bored');
                addPoints(5, 'Used I\'m Bored button');
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all text-left text-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2">I'm Bored 😴</h3>
                  <p className="text-sm opacity-90">
                    Get an instant activity suggestion
                  </p>
                </div>
                <div className="text-3xl">💡</div>
              </div>
            </button>

            {/* Coming Soon */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-3">Coming Soon</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Interest-based chat rooms</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Activity tracking & streaks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CommunityChatPage = () => {
    const [newMessage, setNewMessage] = React.useState('');
    const [showUsernameSetup, setShowUsernameSetup] = React.useState(!hasSetUsername);
    const [tempUsername, setTempUsername] = React.useState('');
    const [messages, setMessages] = React.useState([]);
    const [loadingMessages, setLoadingMessages] = React.useState(true);
    const [sending, setSending] = React.useState(false);
    const [lastSentAt, setLastSentAt] = React.useState(0);
    const [reportedIds, setReportedIds] = React.useState(() => {
      const saved = localStorage.getItem('reportedMessageIds');
      return saved ? JSON.parse(saved) : [];
    });
    // Keep a ref in sync so the polling interval (which only re-runs when
    // chatRoom changes) always sees the latest reported IDs, not a stale
    // snapshot from when the interval was first set up.
    const reportedIdsRef = React.useRef(reportedIds);
    React.useEffect(() => { reportedIdsRef.current = reportedIds; }, [reportedIds]);
    const messagesEndRef = React.useRef(null);
    const unsubscribeRef = React.useRef(null);

    // ============================================================
    // MODERATION SYSTEM
    // Three-tier classification with contextual awareness
    // ============================================================

    const MODERATION = {
      critical: {
        operators: [
          "sportsbet", "ladbrokes", "pointsbet", "betfair", "bet365",
          "neds", "bluebet", "betr", "topsport", "unibet", "draftkings",
          "roobet", "stake.com", "bc.game", "shuffle.com", "tab.com"
        ],
        scams: [
          "vip picks", "vip group", "vip betting", "premium picks",
          "pay for picks", "dm for picks", "dm me picks",
          "i have a method", "guaranteed returns", "guaranteed wins",
          "inside info", "fixed match", "bookie exploit",
          "join my group", "join my server", "sports signals",
          "betting signals", "tipster group", "i can help you win",
          "you can beat the system", "easy profit"
        ],
        offplatform: [
          "telegram", "whatsapp", "signal app", "wickr", "wire app",
          "message me privately", "contact me privately",
          "reach out elsewhere", "talk off app", "talk offsite",
          "join my discord", "find me on", "hit me up on"
        ],
        financial: [
          "i can lend you", "i will lend you", "cash advance",
          "ill front you", "i can front you",
          "flip your money", "double your money",
          "investment opportunity", "send me money",
          "recover your losses", "i can help you recover"
        ],
        promotion: [
          "free bet", "free bets", "sign up bonus", "signup bonus",
          "deposit bonus", "welcome bonus", "matched bet", "matched betting",
          "no deposit bonus", "cashback offer", "reload bonus",
          "you should bet", "you should gamble", "try this site",
          "use my code", "referral code"
        ],
      },
      high: {
        glamorizing: [
          "turned $", "won $", "made $", "i won big", "biggest win",
          "easy payout", "massive cashout", "hit huge", "made thousands",
          "made hundreds", "quick win", "won a fortune",
          "came up huge", "cleaned up", "smashed it"
        ],
        activegambling: [
          "my parlay", "my multi", "my accumulator", "my bet slip",
          "cashed out", "boosted odds", "value bet", "the line moved",
          "martingale", "bankroll management", "unit sizing", "units won",
          "ev+", "expected value", "roi on", "profitable strategy",
          "backing", "laying", "arbing", "arbitrage bet"
        ],
        sabotage: [
          "one bet wont hurt", "just gamble responsibly",
          "moderation works", "you can control it",
          "gambling isnt addictive", "casinos are beatable",
          "you just need discipline", "i gamble every day and im fine",
          "youre overreacting", "win your losses back",
          "just win it back", "you can quit later", "everyone gambles",
          "gambling is fine", "its not that bad"
        ],
        toxic: [
          "youre pathetic", "youre weak", "just stop gambling",
          "you deserve it", "its your fault", "youre an addict",
          "youre hopeless", "no one cares"
        ],
        crypto: [
          "crypto casino", "crypto gambling", "bitcoin casino",
          "eth casino", "nft gambling", "web3 casino", "defi gambling"
        ],
      },
      support: {
        crisis: [
          "kill myself", "want to die", "end it all",
          "no reason to live", "ending it tonight",
          "everyone would be better off without me",
          "cant go on", "dont want to be here anymore",
          "goodbye everyone", "this is my last"
        ],
        distress: [
          "i relapsed", "ive relapsed", "just relapsed",
          "i lost everything", "ruined my life", "destroyed my life",
          "cant stop thinking about betting", "urge is strong",
          "really struggling", "about to give in",
          "i want to gamble", "feeling hopeless", "feeling lost",
          "dont know what to do", "need help"
        ],
      },
      recoveryContext: [
        "i relapsed", "trying to quit", "in recovery", "getting help",
        "seeing a counsellor", "seeing a therapist", "gamble free",
        "staying clean", "my sponsor", "ga meeting", "urge is",
        "struggling with", "day clean", "days clean", "im fighting",
        "fighting the urge", "reaching out", "i need support"
      ],
    };
    // Word-boundary aware matching — "bet" won't catch "better"
    const matchesPhrase = (text, phrase) => {
      const lower = text.toLowerCase();
      // For multi-word phrases, just check includes
      if (phrase.includes(' ')) return lower.includes(phrase);
      // For single words, use word boundary check
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(text);
    };

    // Check if message has recovery context (shifts interpretation)
    const hasRecoveryContext = (text) => {
      return MODERATION.recoveryContext.some(phrase => text.toLowerCase().includes(phrase));
    };

    // Main classifier
    const classifyMessage = (text, room = 'general') => {
      if (text.length > 500) return { action: 'block', level: null, reason: 'Message too long (500 chars max).', matched: null, score: 100 };
      if (text.trim().length < 2) return { action: 'block', level: null, reason: 'Message too short.', matched: null, score: 100 };

      const inRecoveryContext = hasRecoveryContext(text);

      // Check CRITICAL tier first
      const criticalCategories = Object.entries(MODERATION.critical);
      for (const [category, phrases] of criticalCategories) {
        for (const phrase of phrases) {
          if (matchesPhrase(text, phrase)) {
            // Recovery context can downgrade some critical matches
            // e.g. "I used to use sportsbet but now I'm clean" — still flag but don't block
            if (inRecoveryContext && category !== 'scams' && category !== 'financial' && category !== 'offplatform') {
              return {
                action: 'flag',
                level: 'high',
                reason: 'Contains gambling platform reference in recovery context.',
                matched: phrase,
                score: 60
              };
            }
            return {
              action: 'hide',
              level: 'critical',
              reason: getCriticalReason(category),
              matched: phrase,
              score: 95
            };
          }
        }
      }

      // Check HIGH RISK tier
      const highCategories = Object.entries(MODERATION.high);
      for (const [category, phrases] of highCategories) {
        for (const phrase of phrases) {
          if (matchesPhrase(text, phrase)) {
            // Recovery context significantly changes interpretation for glamorizing/active gambling
            if (inRecoveryContext && (category === 'glamorizing' || category === 'activegambling')) {
              return {
                action: 'flag',
                level: 'support',
                reason: 'Discusses gambling in recovery context — flagged for support review.',
                matched: phrase,
                score: 40
              };
            }
            return {
              action: 'flag',
              level: 'high',
              reason: getHighReason(category),
              matched: phrase,
              score: 75
            };
          }
        }
      }

      // Check SUPPORT tier — these always go through but enter support queue
      for (const phrase of MODERATION.support.crisis) {
        if (text.toLowerCase().includes(phrase)) {
          return {
            action: 'allow',
            level: 'critical', // Crisis is critical severity but message stays visible
            reason: 'Crisis language detected — escalated to support queue.',
            matched: phrase,
            score: 90,
            isCrisis: true
          };
        }
      }

      for (const phrase of MODERATION.support.distress) {
        if (text.toLowerCase().includes(phrase)) {
          return {
            action: 'allow',
            level: 'support',
            reason: 'Recovery distress detected — entered in support queue.',
            matched: phrase,
            score: 70
          };
        }
      }

      // Interest chat redirection — flag gambling discussion in hobby rooms
      if (room !== 'general' && room !== 'cravings') {
        const gamblingTermsInHobbyChat = ['casino', 'pokies', 'slots', 'roulette', 'blackjack', 'parlay', 'accumulator'];
        for (const term of gamblingTermsInHobbyChat) {
          if (matchesPhrase(text, term) && !inRecoveryContext) {
            return {
              action: 'redirect',
              level: 'high',
              reason: 'Gambling discussion is better suited to the General Support space.',
              matched: term,
              score: 60
            };
          }
        }
      }

      return { action: 'allow', level: null, reason: null, matched: null, score: 0 };
    };

    const getCriticalReason = (category) => {
      const reasons = {
        operators: 'This content references a gambling operator.',
        scams: 'This content appears to be promoting a betting service or scheme.',
        offplatform: "Attempts to move users off this platform aren't allowed in this space.",
        financial: "This content involves financial solicitation, which isn't safe here.",
        promotion: "This content promotes gambling, which goes against this community's purpose.",
      };
      return reasons[category] || 'This content may negatively affect recovery for others in the community.';
    };

    const getHighReason = (category) => {
      const reasons = {
        glamorizing: 'This content glamorizes gambling wins, which can be triggering in a recovery space.',
        activegambling: "This content discusses active gambling, which may affect others' recovery.",
        sabotage: "This content may undermine others' recovery efforts.",
        toxic: 'This content may be harmful to other members of this community.',
        crypto: 'This content references crypto gambling platforms.',
      };
      return reasons[category] || 'This content has been flagged for review.';
    };

    const rooms = [
      { id: 'general', name: 'General', emoji: '💬', description: 'Daily support and wins' },
      { id: 'cravings', name: 'Need Support', emoji: '🆘', description: 'Real-time help during urges' },
      ...(selectedInterests.includes('fitness') ? [{ id: 'fitness', name: 'Fitness', emoji: '🏋️', description: 'Workouts and movement' }] : []),
      ...(selectedInterests.includes('cooking') ? [{ id: 'cooking', name: 'Cooking', emoji: '🍳', description: 'Recipes and healthy eating' }] : []),
      ...(selectedInterests.includes('music') ? [{ id: 'music', name: 'Music', emoji: '🎸', description: 'Share songs and artists' }] : []),
      ...(selectedInterests.includes('gaming') ? [{ id: 'gaming', name: 'Gaming', emoji: '🎮', description: 'Games and healthy gaming' }] : []),
      ...(selectedInterests.includes('art') ? [{ id: 'art', name: 'Art', emoji: '🎨', description: 'Creative projects' }] : []),
      ...(selectedInterests.includes('reading') ? [{ id: 'reading', name: 'Reading', emoji: '📚', description: 'Books and recommendations' }] : []),
    ];

    // Load messages and subscribe to new ones
    React.useEffect(() => {
      setLoadingMessages(true);
      setMessages([]);

      // Unsubscribe from previous room
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Initial load
      const loadMessages = async () => {
        try {
          const session = supabase.getSession();
          const token = session ? session.access_token : SUPABASE_ANON_KEY;
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/messages?room=eq.${encodeURIComponent(chatRoom)}&order=created_at.asc&limit=50`,
            {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (res.ok) {
            const data = await res.json();
            setMessages(data.filter(m => !m.flagged && !reportedIdsRef.current.includes(m.id)));
          }
        } catch (e) {
          console.warn('Failed to load messages:', e);
        }
        setLoadingMessages(false);
      };

      loadMessages();

      // Poll for new messages every 4 seconds
      const interval = setInterval(async () => {
        try {
          const session = supabase.getSession();
          const token = session ? session.access_token : SUPABASE_ANON_KEY;
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/messages?room=eq.${encodeURIComponent(chatRoom)}&order=created_at.asc&limit=50`,
            {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (res.ok) {
            const data = await res.json();
            setMessages(data.filter(m => !m.flagged && !reportedIdsRef.current.includes(m.id)));
          }
        } catch (e) {}
      }, 4000);

      unsubscribeRef.current = () => clearInterval(interval);
      return () => clearInterval(interval);
    }, [chatRoom]);

    // Scroll to bottom when messages change
    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const saveUsername = () => {
      if (tempUsername.trim().length < 2) return;
      setUsername(tempUsername.trim());
      setHasSetUsername(true);
      localStorage.setItem('chatUsername', tempUsername.trim());
      setShowUsernameSetup(false);
    };

    const sendMessage = async () => {
      if (!newMessage.trim() || !username || sending) return;

      // Rate limit: 1 message per 3 seconds
      const now = Date.now();
      if (now - lastSentAt < 3000) {
        showError('Please wait a moment before sending another message.');
        return;
      }

      // Classify message
      const classification = classifyMessage(newMessage.trim(), chatRoom);

      // Block: critical promo/scam/financial — don't send at all
      if (classification.action === 'hide') {
        showError(classification.reason);
        return;
      }

      // Redirect: gambling talk in hobby chat
      if (classification.action === 'redirect') {
        showError(classification.reason);
        return;
      }

      setSending(true);
      setLastSentAt(now);

      const session = supabase.getSession();

      // If no session, user needs to re-login
      if (!session) {
        showError('Your session has expired. Please log out and log back in.');
        setSending(false);
        return;
      }

      const optimisticMsg = {
        id: `temp-${now}`,
        username,
        message: newMessage.trim(),
        room: chatRoom,
        created_at: new Date().toISOString(),
        isOwn: true,
        user_id: session?.user?.id
      };

      setMessages(prev => [...prev, optimisticMsg]);
      setNewMessage('');

      try {
        const token = session ? session.access_token : SUPABASE_ANON_KEY;
        const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: session?.user?.id || null,
            username,
            message: newMessage.trim(),
            room: chatRoom,
            flagged: classification.action === 'flag' || classification.isCrisis || false,
            moderation_level: classification.level || null,
            moderation_reason: classification.reason || null,
            moderation_matched: classification.matched || null,
            moderation_score: classification.score || null,
            reviewed: false
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.message || errData.error || `Error ${res.status}`;
          setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
          showError(`Could not send: ${errMsg}`);
          console.error('Send failed:', res.status, errData);
        }
      } catch (e) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        showError(`Could not send: ${e.message}`);
        console.error('Send error:', e);
      }

      setSending(false);
    };

    const reportMessage = async (msg) => {
      if (reportedIds.includes(msg.id)) return;

      try {
        const session = supabase.getSession();
        if (!session) {
          showError('Please log in to report messages.');
          return;
        }
        const token = session.access_token;

        // Flag the message in Supabase
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/messages?id=eq.${msg.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ flagged: true })
          }
        );

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error('Report failed:', res.status, errBody);
          showError('Could not report message. Please try again.');
          return;
        }

        const updatedRows = await res.json().catch(() => []);
        if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
          // The request succeeded but no row was actually updated - most
          // likely a row-level security restriction silently prevented it.
          console.warn('Report PATCH returned 0 rows updated for message', msg.id);
          showError('Could not report this message right now.');
          return;
        }

        const updated = [...reportedIds, msg.id];
        setReportedIds(updated);
        localStorage.setItem('reportedMessageIds', JSON.stringify(updated));
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        showSuccess('Message reported and removed.');
      } catch (e) {
        showError('Could not report message.');
      }
    };

    const formatTime = (ts) => {
      if (!ts) return '';
      const d = new Date(ts);
      const now = new Date();
      const diffMins = Math.floor((now - d) / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`;
      return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    };

    const session = supabase.getSession();
    const currentUserId = session?.user?.id;

    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-indigo-500 text-white p-6 shadow-lg">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Community Chat</h1>
              <p className="text-sm opacity-90">Anonymous support, 24/7</p>
            </div>
          </div>
        </div>

        {/* Username Setup Modal */}
        {showUsernameSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Choose Your Username</h2>
              <p className="text-gray-600 text-sm mb-4">
                Pick an anonymous username. No real name, no personal info.
              </p>
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveUsername()}
                placeholder="e.g., RecoveryPath, CleanJourney"
                maxLength={20}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
              />
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                <p className="text-xs text-gray-700">Don't use your real name, location, or anything identifying.</p>
              </div>
              <button
                onClick={saveUsername}
                disabled={tempUsername.trim().length < 2}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg py-3 font-bold transition-colors"
              >
                Start Chatting
              </button>
            </div>
          </div>
        )}

        {/* Room Selector */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1" key={selectedInterests.join(',')}>
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setChatRoom(room.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all text-sm ${
                  chatRoom === room.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{room.emoji}</span>
                <span>{room.name}</span>
              </button>
            ))}
          </div>
          {selectedInterests.length === 0 && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-800">
                Set your interests in Skill Builder to unlock more rooms.
              </p>
            </div>
          )}
        </div>

        {/* Room description */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2">
          <p className="text-xs text-indigo-700 font-medium">
            {rooms.find(r => r.id === chatRoom)?.description}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="max-w-2xl mx-auto">
            {loadingMessages && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            )}

            {!loadingMessages && messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 font-semibold mb-1">No messages yet</p>
                <p className="text-sm text-gray-400">Be the first to say something.</p>
              </div>
            )}

            {messages.map(msg => {
              const isOwn = msg.user_id === currentUserId || msg.isOwn;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[80%]`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-xs font-semibold ${isOwn ? 'text-indigo-600' : 'text-gray-600'}`}>
                        {isOwn ? 'You' : msg.username}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isOwn
                            ? 'bg-indigo-500 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                      {!isOwn && (
                        <button
                          onClick={() => reportMessage(msg)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs px-1"
                          title="Report message"
                        >
                          ⚑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={username ? "Type a message..." : "Set a username first..."}
                disabled={!username || sending}
                maxLength={500}
                className="flex-1 p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !username || sending}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-xl px-5 py-3 font-bold transition-colors"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
            {username && (
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>Chatting as <strong className="text-gray-600">{username}</strong></span>
                <button onClick={() => setShowUsernameSetup(true)} className="text-indigo-500 hover:text-indigo-600">
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
          <p className="text-xs text-gray-400 text-center">
            Be kind and supportive. No gambling sites, links, or personal info. Hover a message to report it.
          </p>
        </div>
      </div>
    );
  };

  const NearbyPage = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-orange-500 text-white p-6">
        <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Tools</span>
        </button>
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Activity Challenges</h1>
            <p className="text-sm opacity-90">Move your body, clear your mind</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Coming Soon</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Track your physical activity, complete movement challenges, and replace gambling urges with exercise.
            </p>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">What's coming:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Optional phone health data integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Daily step tracking and goals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Quick challenges: walks, stretching, dancing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Manual activity logging (no health data required)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Music Discovery - Full implementation ready for Spotify/Last.fm API
  const TopTracksDisplay = ({ artist, fetchTracks }) => {
    const [tracks, setTracks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      let cancelled = false;
      setLoading(true);
      fetchTracks(artist).then(t => { if (!cancelled) { setTracks(t); setLoading(false); } });
      return () => { cancelled = true; };
    }, [artist]);
    if (loading) return <p className="text-xs text-gray-400 mb-4">Loading tracks...</p>;
    if (!tracks.length) return null;
    return (
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-1">Top Tracks:</p>
        {tracks.map((t, i) => <p key={i} className="text-sm text-gray-700">• {t}</p>)}
      </div>
    );
  };

  const MusicDiscoveryPage = () => {
    const [seedInput, setSeedInput] = useState('');
    const [generating, setGenerating] = useState(false);
    const [viewMode, setViewMode] = useState('discover');
    
    const LASTFM_KEY = 'bf998e6a6a406abca0544b6d74c51c40';
    const LASTFM = 'https://ws.audioscrobbler.com/2.0/';

    const lastfmSimilar = async (artist) => {
      try {
        const r = await fetch(`${LASTFM}?method=artist.getsimilar&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_KEY}&format=json&limit=20`);
        const d = await r.json();
        return Array.isArray(d?.similarartists?.artist) ? d.similarartists.artist.map(a => a.name) : [];
      } catch (e) { return []; }
    };

    const lastfmTopTracks = async (artist) => {
      try {
        const r = await fetch(`${LASTFM}?method=artist.gettoptracks&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_KEY}&format=json&limit=3`);
        const d = await r.json();
        return Array.isArray(d?.toptracks?.track) ? d.toptracks.track.map(t => t.name) : [];
      } catch (e) { return []; }
    };

    // Track which artists we've already fetched similar artists FROM
    // so we don't re-fetch the same source repeatedly
    const fetchedSources = React.useRef(new Set());

    // Shuffle array helper
    const shuffleArray = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // Interleave recs so each card comes from a different source
    // e.g. [Arctic from Tame, X from Drake, Y from Tame, Z from Drake...]
    // rather than all Tame Impala recs then all Drake recs
    const interleave = (recsBySource) => {
      const sources = Object.keys(recsBySource);
      const result = [];
      let maxLen = Math.max(...sources.map(s => recsBySource[s].length));
      for (let i = 0; i < maxLen; i++) {
        for (const source of sources) {
          if (recsBySource[source][i]) result.push(recsBySource[source][i]);
        }
      }
      return result;
    };

    const fetchSimilarFrom = async (sourceArtists) => {
      const newSources = sourceArtists.filter(a => !fetchedSources.current.has(a.toLowerCase()));
      if (newSources.length === 0) return [];

      const allKnown = new Set([
        ...Object.keys(artistFeedback).map(a => a.toLowerCase()),
        ...seedArtists.map(a => a.toLowerCase()),
        ...recommendedArtists.map(a => a.name.toLowerCase())
      ]);

      // Shuffle sources so rotation order is random each time
      const shuffledSources = shuffleArray(newSources);

      const recsBySource = {};
      await Promise.allSettled(
        shuffledSources.map(async (source) => {
          fetchedSources.current.add(source.toLowerCase());
          const similar = await lastfmSimilar(source);
          recsBySource[source] = similar
            .filter(a => !allKnown.has(a.toLowerCase()))
            .map((artist, i) => ({ name: artist, source, score: 85 - i * 3 }));
        })
      );

      // Interleave so recs rotate through sources
      return interleave(recsBySource);
    };

    const generateRecs = async () => {
      setGenerating(true);
      fetchedSources.current.clear();

      const likedArtists = Object.keys(artistFeedback).filter(a => artistFeedback[a] === 'liked');
      // Shuffle the combined source list for variety
      const allSources = shuffleArray([...new Set([...seedArtists, ...likedArtists])]);

      let recs = await fetchSimilarFrom(allSources);

      if (recs.length === 0) {
        const fallback = shuffleArray(['Arctic Monkeys','Tame Impala','The Strokes','Flume',
          'Kendrick Lamar','Billie Eilish','Mac Miller','The Weeknd','Radiohead','ODESZA',
          'Jungle','Glass Animals','Parcels','Khruangbin','Unknown Mortal Orchestra',
          'Men I Trust','Mild High Club']);
        fallback.forEach((a, i) => {
          if (!artistFeedback[a]) recs.push({ name: a, source: 'Popular', score: 80 - i * 4 });
        });
      }

      // Deduplicate preserving interleaved order
      const seen = new Set();
      const unique = recs.filter(r => {
        const k = r.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      setRecommendedArtists(unique);
      setCurrentRecommendationIndex(0);
      setGenerating(false);
    };

    const fetchMoreRecs = React.useCallback(async () => {
      if (generating) return;
      setGenerating(true);

      const likedArtists = Object.keys(artistFeedback).filter(a => artistFeedback[a] === 'liked');
      const allSources = shuffleArray([...new Set([...seedArtists, ...likedArtists])]);
      const newRecs = await fetchSimilarFrom(allSources);

      if (newRecs.length > 0) {
        const existing = new Set(recommendedArtists.map(r => r.name.toLowerCase()));
        const fresh = newRecs.filter(r => !existing.has(r.name.toLowerCase()));
        if (fresh.length > 0) {
          setRecommendedArtists(prev => [...prev, ...fresh]);
        }
      }
      setGenerating(false);
    }, [generating, artistFeedback, seedArtists, recommendedArtists]);


    const addSeed = () => {
      if (seedInput.trim() && !seedArtists.includes(seedInput.trim())) {
        const updated = [...seedArtists, seedInput.trim()];
        setSeedArtists(updated);
        localStorage.setItem('seedArtists', JSON.stringify(updated));
        syncSettingsToSupabase({ seed_artists: updated }).catch(() => {});
        setSeedInput('');
      }
    };

    const markArtist = (status) => {
      const current = recommendedArtists[currentRecommendationIndex];
      if (!current) return;
      const updated = {...artistFeedback, [current.name]: status};
      setArtistFeedback(updated);
      localStorage.setItem('artistFeedback', JSON.stringify(updated));
      syncSettingsToSupabase({ artist_feedback: updated }).catch(() => {});

      // If liked, immediately fetch from that artist and append to queue
      if (status === 'liked') {
        const updatedLiked = [...favoriteArtists, current.name];
        setFavoriteArtists(updatedLiked);
        localStorage.setItem('favoriteArtists', JSON.stringify(updatedLiked));
        syncSettingsToSupabase({ favorite_artists: updatedLiked }).catch(() => {});

        // Fetch similar artists from the newly liked artist immediately
        // so next cards say "Because you like [this artist]"
        lastfmSimilar(current.name).then(similar => {
          const allKnown = new Set([
            ...Object.keys({...artistFeedback, [current.name]: status}).map(a => a.toLowerCase()),
            ...seedArtists.map(a => a.toLowerCase()),
          ]);
          fetchedSources.current.add(current.name.toLowerCase());
          const newRecs = similar
            .filter(a => !allKnown.has(a.toLowerCase()))
            .map((artist, i) => ({ name: artist, source: current.name, score: 80 - i * 3 }));
          if (newRecs.length > 0) {
            setRecommendedArtists(prev => {
              const existingNames = new Set(prev.map(r => r.name.toLowerCase()));
              const fresh = newRecs.filter(r => !existingNames.has(r.name.toLowerCase()));
              return [...prev, ...fresh];
            });
          }
        }).catch(() => {});
      }

      // Auto-fetch more when running low (5 or fewer left)
      const remaining = recommendedArtists.length - currentRecommendationIndex - 1;
      if (remaining <= 5 && !generating) {
        fetchMoreRecs();
      }

      if (status === 'saved') {
        const saved = [...savedForLater, current];
        setSavedForLater(saved);
        localStorage.setItem('savedForLater', JSON.stringify(saved));
      }
      setCurrentRecommendationIndex(currentRecommendationIndex + 1);
    };

    const current = recommendedArtists[currentRecommendationIndex];
    const liked = Object.keys(artistFeedback).filter(a => artistFeedback[a] === 'liked');

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
          <h1 className="text-2xl font-bold">🎵 Music Discovery</h1>
          <p className="text-sm opacity-90">Healthy dopamine replacement</p>
        </div>

        <div className="bg-white border-b px-4 py-3">
          <div className="flex gap-2">
            <button onClick={() => setViewMode('discover')} className={`flex-1 py-2 rounded-lg font-semibold ${viewMode === 'discover' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Discover
            </button>
            <button onClick={() => setViewMode('liked')} className={`flex-1 py-2 rounded-lg font-semibold ${viewMode === 'liked' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Liked ({liked.length})
            </button>
            <button onClick={() => setViewMode('saved')} className={`flex-1 py-2 rounded-lg font-semibold ${viewMode === 'saved' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Saved ({savedForLater.length})
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {viewMode === 'discover' && (
              <>
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Try one new artist for 10 minutes during an urge. Music releases dopamine naturally.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Artists You Like</h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSeed()}
                      placeholder="Try: Arctic Monkeys, Tame Impala, Drake..."
                      className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <button onClick={addSeed} className="bg-purple-500 text-white px-6 rounded-lg font-semibold">Add</button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3">
                    💡 Add 2+ artists you like, then click "Discover Music" below to get personalized recommendations
                  </p>
                  
                  {seedArtists.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {seedArtists.map(artist => (
                        <div key={artist} className="bg-purple-100 px-3 py-2 rounded-lg flex items-center gap-2">
                          <span className="font-semibold">{artist}</span>
                          <button onClick={() => setSeedArtists(seedArtists.filter(a => a !== artist))} className="text-purple-600">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {seedArtists.length >= 2 && (
                    <button onClick={generateRecs} disabled={generating} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 font-bold">
                      {generating ? 'Finding...' : '🎵 Discover Music'}
                    </button>
                  )}
                </div>

                {current && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                    <div className="text-center mb-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-5xl">🎸</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">{current.name}</h2>
                      <p className="text-sm text-purple-600 mb-4">Because you like {current.source}</p>
                      
                      <TopTracksDisplay artist={current.name} fetchTracks={lastfmTopTracks} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button onClick={() => markArtist('known')} className="bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold">Already Know</button>
                      <button onClick={() => markArtist('liked')} className="bg-green-500 text-white py-3 rounded-lg font-semibold">❤️ Like</button>
                      <button onClick={() => markArtist('disliked')} className="bg-red-100 text-red-700 py-3 rounded-lg font-semibold">Not For Me</button>
                      <button onClick={() => markArtist('saved')} className="bg-blue-500 text-white py-3 rounded-lg font-semibold">💾 Save</button>
                    </div>
                    <button onClick={() => markArtist('skipped')} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-sm">Skip</button>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-500">
                        {currentRecommendationIndex + 1} of {recommendedArtists.length}
                      </p>
                      {generating && (
                        <p className="text-xs text-purple-500 flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse inline-block"></span>
                          Finding more...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!current && recommendedArtists.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    {generating ? (
                      <>
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-500 text-sm">Finding more artists...</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-800 mb-2">Finding more for you...</p>
                        <button onClick={fetchMoreRecs} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold">
                          Load More
                        </button>
                      </>
                    )}
                  </div>
                )}

                {!current && recommendedArtists.length === 0 && !generating && seedArtists.length >= 2 && (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <p className="text-gray-500 mb-3">Ready to discover new music!</p>
                    <p className="text-sm text-gray-400">Click "Discover Music" above to get recommendations</p>
                  </div>
                )}
              </>
            )}

            {viewMode === 'liked' && (
              <div className="space-y-3">
                {liked.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <p className="text-gray-500">No liked artists yet</p>
                  </div>
                ) : (
                  liked.map(artist => (
                    <div key={artist} className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">❤️</span>
                        <p className="font-bold">{artist}</p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = {...artistFeedback};
                          delete updated[artist];
                          setArtistFeedback(updated);
                          localStorage.setItem('artistFeedback', JSON.stringify(updated));
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {viewMode === 'saved' && (
              <div className="space-y-3">
                {savedForLater.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <p className="text-gray-500">No saved artists yet</p>
                    <p className="text-sm text-gray-400 mt-2">Click "Save" on recommendations to add them here</p>
                  </div>
                ) : (
                  savedForLater.map((rec, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{rec.name}</p>
                          <p className="text-xs text-gray-500">{rec.source}</p>
                        </div>
                        <button 
                          onClick={() => {
                            // Move to liked
                            const updated = {...artistFeedback, [rec.name]: 'liked'};
                            setArtistFeedback(updated);
                            localStorage.setItem('artistFeedback', JSON.stringify(updated));
                            // Remove from saved
                            const newSaved = savedForLater.filter((_, i) => i !== idx);
                            setSavedForLater(newSaved);
                            localStorage.setItem('savedForLater', JSON.stringify(newSaved));
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          ❤️ Like
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // First-Time Onboarding Component
  const OnboardingFlow = () => {
    const [tempStartDate, setTempStartDate] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [nearestMeeting, setNearestMeeting] = useState('');
    const [quickWhyReason, setQuickWhyReason] = useState('');

    const completeOnboarding = () => {
      setHasCompletedOnboarding(true);
      localStorage.setItem('hasCompletedOnboarding', 'true');
    };

    const skipOnboarding = () => {
      if (window.confirm('Are you sure? These steps help protect you from relapse.')) {
        completeOnboarding();
      }
    };

    const bankInfo = {
      'commbank': {
        name: 'CommBank',
        steps: [
          'Log in to the CommBank app',
          'Tap Cards on the home screen',
          'Swipe to select the eligible card you want to restrict',
          'Tap Card Settings',
          'Tap Gambling payments (this will take you to NetBank)',
          'Tap Lock on your card'
        ],
        link: 'https://www.commbank.com.au/digital-banking/lock-block-limit-your-credit-card.html'
      },
      'westpac': {
        name: 'Westpac',
        steps: [
          'Sign in to the Westpac App or Online Banking',
          'Navigate to the Card Services menu',
          'Select Gambling Block',
          'Choose the eligible credit or debit card(s) you wish to restrict and activate the block'
        ],
        link: 'https://www.westpac.com.au/personal-banking/credit-cards/manage/gambling-preference/'
      },
      'nab': {
        name: 'NAB',
        steps: [
          'Log into the NAB app on your mobile device',
          'Tap Cards at the bottom of the screen',
          'Select the debit or credit card you want to update',
          'Tap Usage controls',
          'Select Gambling restrictions',
          'Toggle the setting to On (read the notice and tap Confirm)'
        ],
        link: 'https://www.nab.com.au/help-support/extra-care-support/gambling-support'
      },
      'anz': {
        name: 'ANZ',
        steps: [
          'Open the ANZ App and select your eligible card',
          'Tap Manage, then go to Manage Card',
          'Select Card Controls',
          'Toggle on the Gambling Block (may take up to 15 minutes to become fully active)'
        ],
        link: 'https://www.anz.com.au'
      },
      'ing': {
        name: 'ING',
        steps: [
          'ING doesn\'t currently offer a self-service gambling block toggle in the app',
          'Message ING through the app (look for Messages in the left-hand menu) or call 133 464 to ask about gambling support',
          'Their care team can help tailor your account, such as restricting access to savings or other account changes'
        ],
        link: 'https://www.ing.com.au/help-and-support/extra-care-and-support.html'
      },
      'macquarie': {
        name: 'Macquarie',
        steps: [
          'Macquarie credit cards automatically block most gambling transactions — there is nothing you need to set up',
          'Coverage isn\'t complete, so it\'s still worth registering with BetStop for full protection'
        ],
        link: 'https://www.macquarie.com.au'
      }
    };

    const renderStep = () => {
      switch(onboardingStep) {
        case 0: // Welcome
          return (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Beat the Bet</h1>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You've taken the hardest step - deciding to quit. Let's set you up for success.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5 text-left mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  This setup takes 5-10 minutes. We'll help you create barriers that protect you when willpower isn't enough. 
                  <strong> These steps dramatically increase your chance of staying clean.</strong>
                </p>
              </div>
              <button
                onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setTempStartDate(today);
                const d = new Date(today);
                setStartDate(d);
                setProfileLoaded(true);
                localStorage.setItem('startDate', d.toISOString());
                syncProfileToSupabase({ start_date: d.toISOString() }).catch(() => {});
                showSuccess('Your recovery timer has started from today.');
                setOnboardingStep(2);
              }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 font-bold text-lg transition-colors"
              >
                Let's Do This
              </button>
              <button
                onClick={skipOnboarding}
                className="w-full text-gray-500 text-sm mt-3 hover:text-gray-700"
              >
                Skip setup (not recommended)
              </button>
            </div>
          );

        case 2: // BetStop
          return (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Register with BetStop</h2>
              <p className="text-gray-700 mb-6">
                BetStop is Australia's national self-exclusion register. It blocks you from ALL licensed online gambling sites.
              </p>
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">✅ What BetStop Does:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Blocks ALL licensed Australian gambling sites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Free and takes 5 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Minimum 3 months (recommended: permanent)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Works across all devices</span>
                  </li>
                </ul>
              </div>
              <a
                href="https://betstop.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-4 font-bold text-lg text-center transition-colors mb-4"
              >
                Register with BetStop →
              </a>
              <button
                onClick={() => setOnboardingStep(3)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-semibold transition-colors"
              >
                I've Registered (or I'll Do It Later)
              </button>
            </div>
          );

        case 3: // Bank blocks
          return (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2: Block Gambling on Your Cards</h2>
              <p className="text-gray-700 mb-6">
                BetStop blocks sites. Bank blocks stop the money. Both = maximum protection.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Bank</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg"
                >
                  <option value="">Choose your bank...</option>
                  <option value="commbank">CommBank</option>
                  <option value="westpac">Westpac</option>
                  <option value="nab">NAB</option>
                  <option value="anz">ANZ</option>
                  <option value="ing">ING</option>
                  <option value="macquarie">Macquarie</option>
                  <option value="other">Other / Multiple Banks</option>
                </select>
              </div>

              {selectedBank && selectedBank !== 'other' && bankInfo[selectedBank] && (
                <div className="bg-white border-2 border-blue-500 rounded-xl p-5 mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">{bankInfo[selectedBank].name} - How to Block:</h3>
                  <ol className="space-y-2 text-sm text-gray-700 mb-4">
                    {bankInfo[selectedBank].steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a
                    href={bankInfo[selectedBank].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    Go to {bankInfo[selectedBank].name} →
                  </a>
                </div>
              )}

              {selectedBank === 'other' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    Contact your bank's customer service and ask to block gambling transactions on all your cards. 
                    Most banks offer this - it's free and takes minutes.
                  </p>
                </div>
              )}

              <button
                onClick={() => setOnboardingStep(4)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 font-bold text-lg transition-colors"
              >
                Continue
              </button>
            </div>
          );

        case 4: // GA Meetings
          return (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 3: Find Your Local GA Meeting</h2>
              <p className="text-gray-700 mb-6">
                Gamblers Anonymous meetings are free, anonymous, and proven to work. You're not alone in this.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5 mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Why GA works:</strong> You'll meet people who understand exactly what you're going through. 
                  No judgment. No shame. Just support from people who've been there.
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Location (optional)</label>
                <input
                  type="text"
                  value={nearestMeeting}
                  onChange={(e) => setNearestMeeting(e.target.value)}
                  placeholder="e.g., Sydney, Melbourne, Brisbane..."
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <a
                href={`https://gaaustralia.org.au/meetings/?tsml-query=${encodeURIComponent(userCity || '')}&tsml-view=map`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-4 font-bold text-lg text-center transition-colors mb-4"
              >
                Find GA Meetings Near Me →
              </a>
              <button
                onClick={() => setOnboardingStep(5)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          );

        case 5: // Why I'm Quitting
          return (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 4: Why Are You Quitting?</h2>
              <p className="text-gray-700 mb-6">
                When urges hit, we'll remind you of this. Make it count.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Main Reason (one sentence)
                </label>
                <textarea
                  value={quickWhyReason}
                  onChange={(e) => setQuickWhyReason(e.target.value)}
                  placeholder="e.g., I want to be there for my kids... I want to buy a house... I want my life back..."
                  className="w-full h-32 p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                onClick={() => {
                  if (quickWhyReason.trim()) {
                    const updated = {
                      ...whyImQuitting,
                      primaryReason: quickWhyReason.trim()
                    };
                    setWhyImQuitting(updated);
                    localStorage.setItem('whyImQuitting', JSON.stringify(updated));
                  }
                  setOnboardingStep(6);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 font-bold text-lg transition-colors"
              >
                {quickWhyReason.trim() ? 'Save & Continue' : 'Skip This Step'}
              </button>
            </div>
          );

        case 6: // Complete
          return (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h1>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You've built your safety net. Now let's keep you clean.
              </p>
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-5 text-left mb-6">
                <h3 className="font-bold text-gray-800 mb-3">What's Next:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Your timer is running - every second counts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Hit the panic button when urges strike</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Journal daily to process triggers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Complete challenges to build healthy habits</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={completeOnboarding}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-4 font-bold text-lg transition-colors"
              >
                Start My Recovery Journey
              </button>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            {/* Progress Bar */}
            {onboardingStep > 0 && onboardingStep < 6 && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Step {[0,2,3,4,5].indexOf(onboardingStep)+1} of 5</span>
                  <span>{Math.round(([0,2,3,4,5].indexOf(onboardingStep)+1)/5*100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(onboardingStep / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {renderStep()}

            {/* Back Button */}
            {onboardingStep > 0 && onboardingStep < 6 && (
              <button
                onClick={() => { const steps=[0,2,3,4,5,6]; const i=steps.indexOf(onboardingStep); setOnboardingStep(i>0?steps[i-1]:0); }}
                className="w-full text-gray-500 text-sm mt-4 hover:text-gray-700"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Why I'm Quitting Page
  const WhyImQuittingPage = () => {
    const [newReasonText, setNewReasonText] = useState('');
    const [editingPrimary, setEditingPrimary] = useState(false);
    const [primaryText, setPrimaryText] = useState(whyImQuitting.primaryReason || '');

    const addTextReason = () => {
      if (!newReasonText.trim()) return;

      const newReason = {
        id: Date.now(),
        type: 'text',
        content: newReasonText.trim(),
        timestamp: new Date().toISOString()
      };

      const updated = {
        ...whyImQuitting,
        reasons: [...whyImQuitting.reasons, newReason]
      };

      setWhyImQuitting(updated);
      localStorage.setItem('whyImQuitting', JSON.stringify(updated));
      setNewReasonText('');
      // Sync to Supabase
      const session = supabase.getSession();
      if (session) {
        supabase.from('why_quitting').upsert({
          user_id: session.user.id,
          primary_reason: updated.primaryReason,
          reasons: updated.reasons,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      }
    };

    const savePrimaryReason = () => {
      const updated = {
        ...whyImQuitting,
        primaryReason: primaryText.trim()
      };
      setWhyImQuitting(updated);
      localStorage.setItem('whyImQuitting', JSON.stringify(updated));
      setEditingPrimary(false);
      // Sync to Supabase
      const session = supabase.getSession();
      if (session) {
        supabase.from('why_quitting').upsert({
          user_id: session.user.id,
          primary_reason: primaryText.trim(),
          reasons: updated.reasons,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      }
    };

    const deleteReason = (id) => {
      const updated = {
        ...whyImQuitting,
        reasons: whyImQuitting.reasons.filter(r => r.id !== id)
      };
      setWhyImQuitting(updated);
      localStorage.setItem('whyImQuitting', JSON.stringify(updated));
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-br from-red-500 to-pink-500 text-white p-6">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <span className="text-3xl">❤️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Why I'm Quitting</h1>
              <p className="text-sm opacity-90">Your reasons, your strength</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                When urges hit, we'll show you these reminders. Make them honest. This is what you're fighting for.
              </p>
            </div>

            {/* Primary Reason */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-3">Your Main Reason</h3>
              <p className="text-sm text-gray-600 mb-4">
                One sentence. What's the biggest reason you're quitting?
              </p>
              
              {!editingPrimary && whyImQuitting.primaryReason ? (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4 mb-3">
                  <p className="text-gray-800 font-semibold italic text-center">
                    "{whyImQuitting.primaryReason}"
                  </p>
                </div>
              ) : (
                <textarea
                  value={primaryText}
                  onChange={(e) => setPrimaryText(e.target.value)}
                  placeholder="e.g., I want to be there for my kids... I want to buy a house... I want my life back..."
                  className="w-full h-24 p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-3"
                />
              )}
              
              {editingPrimary || !whyImQuitting.primaryReason ? (
                <button
                  onClick={savePrimaryReason}
                  disabled={!primaryText.trim()}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg py-3 font-bold transition-colors"
                >
                  Save Main Reason
                </button>
              ) : (
                <button
                  onClick={() => setEditingPrimary(true)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg py-2 font-semibold transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Additional Reasons */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-3">More Reasons</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add as many as you need. Photos, notes, anything that reminds you why.
              </p>
              
              {/* Add Text Reason */}
              <div className="mb-4">
                <textarea
                  value={newReasonText}
                  onChange={(e) => setNewReasonText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addTextReason())}
                  placeholder="Add another reason..."
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-2"
                />
                <button
                  onClick={addTextReason}
                  disabled={!newReasonText.trim()}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg py-2 font-semibold transition-colors"
                >
                  + Add Reason
                </button>
              </div>

              {/* Photo Upload */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Add a Photo</label>
                <label className="block w-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg p-6 text-center cursor-pointer transition-colors">
                  <span className="text-4xl block mb-2">📷</span>
                  <p className="text-sm text-gray-600 mb-1">Tap to choose a photo</p>
                  <p className="text-xs text-gray-500">Family, goals, dreams - anything that reminds you why</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      // Require login for photo uploads
                      const session = supabase.getSession();
                      if (!session) {
                        showError('Please log in to upload photos. Your photos are saved securely to your account.');
                        return;
                      }

                      if (session) {
                        try {
                          showSuccess('Uploading photo...');
                          const uid = session.user.id;
                          const path = `${uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                          const { data, error } = await supabase.storage
                            .from('why-quitting-photos')
                            .upload(path, file);

                          if (!error) {
                            const { data: urlData } = await supabase.storage
                              .from('why-quitting-photos')
                              .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

                            const newReason = {
                              id: Date.now(),
                              type: 'photo',
                              content: urlData.signedUrl,
                              storagePath: path,
                              filename: file.name,
                              timestamp: new Date().toISOString()
                            };
                            const updated = { ...whyImQuitting, reasons: [...whyImQuitting.reasons, newReason] };
                            setWhyImQuitting(updated);
                            localStorage.setItem('whyImQuitting', JSON.stringify(updated));

                            // Also save to Supabase
                            await supabase.from('why_quitting').upsert({
                              user_id: uid,
                              primary_reason: whyImQuitting.primaryReason,
                              reasons: updated.reasons.map(r => ({...r, content: r.storagePath || r.content})),
                              updated_at: new Date().toISOString()
                            });

                            showSuccess('Photo added!');
                            return;
                          }
                        } catch (err) {
                          console.warn('Storage upload failed, falling back to base64:', err);
                        }
                      }

                      // No fallback - require login for photo uploads
                      showError('Please log in to upload photos. Your photos are saved to your account.');
                    }}
                  />
                </label>
              </div>

              {/* Voice Memo Placeholder */}
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <span className="text-4xl block mb-2">🎤</span>
                <p className="text-sm text-gray-600 mb-2">Voice memos coming soon</p>
                <p className="text-xs text-gray-500">
                  Record a message to your future self during weak moments
                </p>
              </div>
            </div>

            {/* Existing Reasons */}
            {whyImQuitting.reasons.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-800 mb-4">Your Reasons ({whyImQuitting.reasons.length})</h3>
                <div className="space-y-3">
                  {whyImQuitting.reasons.map((reason) => (
                    <div key={reason.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                      <div className="flex-1">
                        {reason.type === 'text' && (
                          <p className="text-gray-800">{reason.content}</p>
                        )}
                        {reason.type === 'photo' && (
                          <div>
                            <img src={reason.content} alt="Reminder" className="w-full rounded-lg max-h-40 object-cover" />
                            {reason.filename && <p className="text-xs text-gray-500 mt-1">{reason.filename}</p>}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteReason(reason.id)}
                        className="text-red-500 hover:text-red-700 ml-3 flex-shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  const MindfulnessPage = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-purple-500 text-white p-6">
        <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Tools</span>
        </button>
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Private Journal & Mindfulness</h1>
            <p className="text-sm opacity-90">Your private recovery space</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          {/* Journal Access Button */}
          <button
            onClick={() => {
              setShowJournalCalendar(true);
              addPoints(5, 'Opened journal');
            }}
            className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 mb-2">Private Journal</h3>
                <p className="text-gray-600 text-sm mb-3">
                  {journalEntries.length} entries written
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {journalMode === 'structured' ? '⚡ Structured' : '📝 Open'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </button>

          {/* Coming Soon: Other Mindfulness Tools */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-gray-800 mb-3">More Tools Coming Soon</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                <span>Breathing exercises</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                <span>Guided meditations</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                <span>Quick dopamine boosters</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Journal Calendar & Entry Components
  const JournalCalendarView = React.memo(() => {
    const [currentMonth, setCurrentMonth] = useState(() => {
      const saved = localStorage.getItem('journalCalendarMonth');
      return saved ? new Date(saved) : new Date();
    });
    const [viewingEntry, setViewingEntry] = useState(null);
    const [writingForDate, setWritingForDate] = useState(null);
    const [selectedJournalDate, setSelectedJournalDate] = useState(null); // Local state for multiple entries modal

    // Save month when it changes
    React.useEffect(() => {
      localStorage.setItem('journalCalendarMonth', currentMonth.toISOString());
    }, [currentMonth]);

    if (viewingEntry) {
      return <JournalEntryView entry={viewingEntry} onBack={() => setViewingEntry(null)} />;
    }

    if (writingForDate) {
      return <JournalEntryForm date={writingForDate} onBack={() => setWritingForDate(null)} onSave={(entry) => {
        saveJournalEntry(entry);
        setWritingForDate(null);
      }} />;
    }

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      return { daysInMonth, startingDayOfWeek, year, month };
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const handleDayClick = (day) => {
      if (!day) return;
      const clickedDate = new Date(year, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (clickedDate > today) return; // Can't journal in the future
      
      const entries = getEntriesForDate(clickedDate);
      if (entries.length > 0) {
        setSelectedJournalDate({ date: clickedDate, entries });
      } else {
        setWritingForDate(clickedDate);
      }
    };

    const prevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
      const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      if (next <= new Date()) {
        setCurrentMonth(next);
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-purple-500 text-white p-6">
          <button onClick={() => setShowJournalCalendar(false)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Mindfulness</span>
          </button>
          <h1 className="text-2xl font-bold">Journal Calendar</h1>
          <p className="text-sm opacity-90">{journalEntries.length} total entries</p>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-md mx-auto">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-lg">{monthName}</h2>
              <button 
                onClick={nextMonth} 
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1) > new Date()}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="aspect-square" />;
                  }
                  
                  const date = new Date(year, month, day);
                  const hasEntry = hasEntryOnDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isFuture = date > new Date();
                  const entries = getEntriesForDate(date);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDayClick(day)}
                      disabled={isFuture}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-semibold transition-all ${
                        hasEntry 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } ${isToday ? 'ring-2 ring-purple-500' : ''} ${
                        isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <span>{day}</span>
                      {entries.length > 1 && (
                        <span className="text-xs mt-1">•{entries.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today Quick Entry Button */}
            <button
              onClick={() => setWritingForDate(new Date())}
              className="w-full mt-6 bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-4 font-bold transition-colors"
            >
              ✍️ Write Entry for Today
            </button>

            {/* Mode Toggle */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Journal Mode</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setJournalMode('structured');
                    localStorage.setItem('journalMode', 'structured');
                    syncSettingsToSupabase({ journal_mode: 'structured' }).catch(() => {});
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    journalMode === 'structured'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚡ Structured
                </button>
                <button
                  onClick={() => {
                    setJournalMode('open');
                    localStorage.setItem('journalMode', 'open');
                    syncSettingsToSupabase({ journal_mode: 'open' }).catch(() => {});
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    journalMode === 'open'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📝 Open
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Day Entries Modal */}
        {selectedJournalDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedJournalDate.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <button onClick={() => setSelectedJournalDate(null)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {selectedJournalDate.entries.map((entry, idx) => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setViewingEntry(entry);
                        setSelectedJournalDate(null);
                      }}
                      className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          {new Date(entry.date).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {entry.mood && <span className="text-xl">{entry.mood}</span>}
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {entry.content || entry.responses?.feeling || 'Entry...'}
                      </p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setWritingForDate(selectedJournalDate.date);
                    setSelectedJournalDate(null);
                  }}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-lg py-3 font-semibold"
                >
                  + New Entry for This Day
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

  const JournalEntryForm = React.memo(({ date, onBack, onSave }) => {
    const [mood, setMood] = useState('');
    const [content, setContent] = useState('');
    const [responses, setResponses] = useState({});
    
    // Local copy of favorites to prevent parent re-renders
    const [localFavorites, setLocalFavorites] = useState(() => {
      const saved = localStorage.getItem('favoritePrompts');
      return saved ? JSON.parse(saved) : [];
    });
    
    const moods = ['😊', '😐', '😔', '😡', '😰', '😌'];
    
    const allStructuredPrompts = [
      { id: 'feeling', question: 'How are you feeling right now?', placeholder: 'Describe your emotions...', category: 'core' },
      { id: 'trigger', question: 'Did anything trigger an urge today?', placeholder: 'What happened today...', category: 'core' },
      { id: 'instead', question: 'What did you do instead of gambling?', placeholder: 'Actions you took...', category: 'core' },
      { id: 'grateful', question: 'What are you grateful for today?', placeholder: 'List 1-3 things...', category: 'core' },
      { id: 'proud', question: 'What are you proud of today?', placeholder: 'Even small wins count...', category: 'reflection' },
      { id: 'future_goal', question: 'What\'s a goal you\'re working toward?', placeholder: 'Short or long-term...', category: 'future' },
      { id: 'tomorrow_plan', question: 'What will you do tomorrow to stay strong?', placeholder: 'Plan your day...', category: 'future' },
      { id: 'support', question: 'Who or what supported you today?', placeholder: 'People, activities, tools...', category: 'reflection' },
      { id: 'challenge', question: 'What was challenging today?', placeholder: 'Difficult moments...', category: 'reflection' },
      { id: 'lesson', question: 'What did you learn about yourself today?', placeholder: 'New insights...', category: 'reflection' },
    ];

    const toggleFavorite = (promptId) => {
      const updated = localFavorites.includes(promptId)
        ? localFavorites.filter(id => id !== promptId)
        : [...localFavorites, promptId];
      setLocalFavorites(updated);
      localStorage.setItem('favoritePrompts', JSON.stringify(updated));
      // Parent will read from localStorage on next mount
    };

    // Sort prompts: favorites first, then the rest
    const sortedPrompts = [
      ...allStructuredPrompts.filter(p => localFavorites.includes(p.id)),
      ...allStructuredPrompts.filter(p => !localFavorites.includes(p.id))
    ];

    const handleSave = () => {
      if (journalMode === 'open' && !content.trim()) {
        return;
      }
      if (journalMode === 'structured' && Object.keys(responses).length === 0) {
        return;
      }

      onSave({
        mode: journalMode,
        mood,
        content: journalMode === 'open' ? content : null,
        responses: journalMode === 'structured' ? responses : null,
        date: date.toISOString(),
      });
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-purple-500 text-white p-6">
          <button onClick={onBack} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold">New Journal Entry</h1>
          <p className="text-sm opacity-90">
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            {/* Mood Selector */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3">How are you feeling?</h3>
              <div className="flex gap-2 justify-between">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`text-3xl p-3 rounded-lg transition-all ${
                      mood === m ? 'bg-purple-100 scale-110' : 'hover:bg-gray-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Content */}
            {journalMode === 'open' ? (
              <div className="bg-white rounded-xl shadow-md p-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write whatever comes to mind..."
                  className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {sortedPrompts.map((prompt) => (
                  <div key={prompt.id} className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex items-start justify-between mb-2">
                      <label className="block font-semibold text-gray-800">
                        {prompt.question}
                      </label>
                      <button
                        onClick={() => toggleFavorite(prompt.id)}
                        className="text-2xl hover:scale-110 transition-transform flex-shrink-0 ml-2"
                      >
                        {localFavorites.includes(prompt.id) ? '⭐' : '☆'}
                      </button>
                    </div>
                    {localFavorites.includes(prompt.id) && (
                      <p className="text-xs text-purple-600 mb-2">📌 Pinned to top</p>
                    )}
                    <textarea
                      value={responses[prompt.id] || ''}
                      onChange={(e) => setResponses({ ...responses, [prompt.id]: e.target.value })}
                      placeholder={prompt.placeholder}
                      className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-4 font-bold transition-colors"
            >
              Save Entry
            </button>
          </div>
        </div>
      </div>
    );
  });

  const JournalEntryView = ({ entry, onBack }) => {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-purple-500 text-white p-6">
          <button onClick={onBack} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Journal Entry</h1>
              <p className="text-sm opacity-90">{entry.timestamp}</p>
            </div>
            {entry.mood && <span className="text-4xl">{entry.mood}</span>}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6">
              {entry.mode === 'open' ? (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </p>
              ) : (
                <div className="space-y-4">
                  {entry.responses && Object.entries(entry.responses).map(([key, value]) => (
                    <div key={key}>
                      <h3 className="font-semibold text-gray-800 mb-2 capitalize">
                        {key.replace('_', ' ')}:
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StreakAnalyticsPage = () => {
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'patterns', 'stats'
    
    // Pattern Analysis Functions
    const analyzePatterns = () => {
      const patterns = {
        totalAppOpens: appOpenTimestamps.length,
        totalPanicButtonUses: panicButtonTimestamps.length,
        riskiestDayOfWeek: null,
        riskiestHourOfDay: null,
        averageUrgeDuration: null,
        thisWeekOpens: 0
      };

      // Analyze panic button usage (triggers/urges)
      if (panicButtonTimestamps.length > 0) {
        const dayCount = {};
        const hourCount = {};
        
        panicButtonTimestamps.forEach(timestamp => {
          const date = new Date(timestamp);
          const day = date.toLocaleDateString('en-US', { weekday: 'long' });
          const hour = date.getHours();
          
          dayCount[day] = (dayCount[day] || 0) + 1;
          hourCount[hour] = (hourCount[hour] || 0) + 1;
        });
        
        // Find riskiest day
        const maxDay = Object.entries(dayCount).reduce((a, b) => b[1] > a[1] ? b : a);
        patterns.riskiestDayOfWeek = maxDay[0];
        
        // Find riskiest hour range
        const maxHour = Object.entries(hourCount).reduce((a, b) => b[1] > a[1] ? b : a);
        const hour = parseInt(maxHour[0]);
        if (hour >= 6 && hour < 12) patterns.riskiestHourOfDay = 'Morning (6am-12pm)';
        else if (hour >= 12 && hour < 18) patterns.riskiestHourOfDay = 'Afternoon (12pm-6pm)';
        else if (hour >= 18 && hour < 24) patterns.riskiestHourOfDay = 'Evening (6pm-12am)';
        else patterns.riskiestHourOfDay = 'Night (12am-6am)';
      }

      // Count this week's app opens
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      patterns.thisWeekOpens = appOpenTimestamps.filter(t => new Date(t) > oneWeekAgo).length;

      return patterns;
    };

    const getProactiveLiveWarning = () => {
      // Check if current time matches risky pattern
      const patterns = analyzePatterns();
      if (!patterns.riskiestHourOfDay || !patterns.riskiestDayOfWeek) return null;

      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentHour = now.getHours();
      
      let isRiskyTime = false;
      let riskyPeriod = '';

      // Check if current time matches risky pattern
      if (currentDay === patterns.riskiestDayOfWeek) {
        if (patterns.riskiestHourOfDay === 'Morning (6am-12pm)' && currentHour >= 6 && currentHour < 12) {
          isRiskyTime = true;
          riskyPeriod = 'morning';
        } else if (patterns.riskiestHourOfDay === 'Afternoon (12pm-6pm)' && currentHour >= 12 && currentHour < 18) {
          isRiskyTime = true;
          riskyPeriod = 'afternoon';
        } else if (patterns.riskiestHourOfDay === 'Evening (6pm-12am)' && currentHour >= 18 && currentHour < 24) {
          isRiskyTime = true;
          riskyPeriod = 'evening';
        } else if (patterns.riskiestHourOfDay === 'Night (12am-6am)' && currentHour >= 0 && currentHour < 6) {
          isRiskyTime = true;
          riskyPeriod = 'night';
        }
      }

      if (isRiskyTime) {
        return {
          show: true,
          day: currentDay,
          period: riskyPeriod,
          message: `Heads up - you typically get triggered on ${currentDay} ${riskyPeriod}s. The urge will pass in 15-20 minutes. Stay strong.`
        };
      }

      return null;
    };
    
    // Calculate streak stats
    const currentStreak = getDaysClean();
    const longestStreak = Math.max(currentStreak, ...streakData.relapses.map((relapse, idx) => {
      if (idx === 0) return Math.floor((new Date(relapse) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      return Math.floor((new Date(relapse) - new Date(streakData.relapses[idx - 1])) / (1000 * 60 * 60 * 24));
    }));

    // Generate calendar data for current month
    const generateCalendarDays = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // Empty cells for days before month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push({ date: null, isEmpty: true });
      }
      
      // Actual days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isClean = date >= new Date(startDate) && date <= now;
        const isToday = date.toDateString() === now.toDateString();
        const hasJournal = journalEntries.some(e => new Date(e.date).toDateString() === date.toDateString());
        const hasActivity = activityLog.some(a => new Date(a.date).toDateString() === date.toDateString());
        
        days.push({
          date: day,
          fullDate: date,
          isClean,
          isToday,
          hasJournal,
          hasActivity,
          isEmpty: false
        });
      }
      
      return days;
    };

    // Get weekly data for progress chart
    const getWeeklyData = () => {
      const weeks = [];
      const today = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        
        const cleanDays = 7; // In real app, calculate based on relapses
        const journalDays = journalEntries.filter(e => {
          const entryDate = new Date(e.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        }).length;
        const activeDays = new Set(
          activityLog.filter(a => {
            const activityDate = new Date(a.date);
            return activityDate >= weekStart && activityDate <= weekEnd;
          }).map(a => new Date(a.date).toDateString())
        ).size;
        
        weeks.push({
          week: `Week ${12 - i}`,
          cleanDays,
          journalDays,
          activeDays
        });
      }
      
      return weeks;
    };

    const calendarDays = generateCalendarDays();
    const weeklyData = getWeeklyData();
    const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-indigo-500 text-white p-6">
          <button onClick={() => setActiveTool(null)} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Streak Analytics</h1>
              <p className="text-sm opacity-90">Track patterns and progress</p>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'calendar' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'stats' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              📊 Stats
            </button>
            <button
              onClick={() => setViewMode('patterns')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'patterns' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              🔍 Patterns
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <>
                {/* Streak Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-sm opacity-90 mb-1">Current Streak</p>
                    <p className="text-4xl font-bold">{currentStreak}</p>
                    <p className="text-sm opacity-90">days</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-sm opacity-90 mb-1">Longest Streak</p>
                    <p className="text-4xl font-bold">{longestStreak}</p>
                    <p className="text-sm opacity-90">days</p>
                  </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-gray-800 mb-4">{monthName}</h3>
                  
                  {/* Day labels */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      if (day.isEmpty) {
                        return <div key={idx} className="aspect-square" />;
                      }
                      
                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${
                            day.isToday
                              ? 'bg-indigo-500 text-white font-bold ring-2 ring-indigo-300'
                              : day.isClean
                              ? 'bg-green-100 text-green-800 font-semibold'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <span>{day.date}</span>
                          {day.isClean && (
                            <div className="flex gap-0.5 mt-0.5">
                              {day.hasJournal && <div className="w-1 h-1 bg-purple-500 rounded-full" />}
                              {day.hasActivity && <div className="w-1 h-1 bg-orange-500 rounded-full" />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 rounded" />
                      <span className="text-gray-600">Clean day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-purple-500 rounded-full" />
                      <span className="text-gray-600">Journal entry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full" />
                      <span className="text-gray-600">Activity logged</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Stats View */}
            {viewMode === 'stats' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl shadow-md p-5">
                    <p className="text-sm text-gray-600 mb-1">Total Clean Days</p>
                    <p className="text-3xl font-bold text-gray-800">{currentStreak}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-5">
                    <p className="text-sm text-gray-600 mb-1">Journal Entries</p>
                    <p className="text-3xl font-bold text-gray-800">{journalEntries.length}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-5">
                    <p className="text-sm text-gray-600 mb-1">Activities Logged</p>
                    <p className="text-3xl font-bold text-gray-800">{activityLog.length}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-5">
                    <p className="text-sm text-gray-600 mb-1">Badges Earned</p>
                    <p className="text-3xl font-bold text-gray-800">{earnedBadges.length}</p>
                  </div>
                </div>

                {/* Weekly Progress Chart */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-gray-800 mb-4">12-Week Trend</h3>
                  <div className="space-y-3">
                    {weeklyData.slice(-4).map((week, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-semibold text-gray-700">{week.week}</span>
                          <span className="text-gray-600">
                            {week.cleanDays} clean • {week.journalDays} journal • {week.activeDays} active
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <div 
                            className="bg-green-500 h-2 rounded-l"
                            style={{ width: `${(week.cleanDays / 7) * 100}%` }}
                          />
                          <div 
                            className="bg-purple-500 h-2"
                            style={{ width: `${(week.journalDays / 7) * 100}%` }}
                          />
                          <div 
                            className="bg-orange-500 h-2 rounded-r"
                            style={{ width: `${(week.activeDays / 7) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span>Clean days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded" />
                      <span>Journal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded" />
                      <span>Activity</span>
                    </div>
                  </div>
                </div>

                {/* Money Saved */}
                {dailyGamblingSpend > 0 && (
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-sm opacity-90 mb-2">Days Gamble-Free</p>
                    <p className="text-5xl font-bold mb-1">${(dailyGamblingSpend * currentStreak).toLocaleString()}</p>
                    <p className="text-sm opacity-90">in {currentStreak} days</p>
                  </div>
                )}
              </>
            )}

            {/* Patterns View */}
            {viewMode === 'patterns' && (
              <>
                {(() => {
                  const patterns = analyzePatterns();
                  const liveWarning = getProactiveLiveWarning();
                  
                  if (!patterns) {
                    return (
                      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5">
                        <h3 className="font-bold text-gray-800 mb-2">🔍 Pattern Detection</h3>
                        <p className="text-sm text-gray-700">
                          Keep using the app and we'll detect your patterns. Understanding your triggers helps you stay ahead of them.
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {/* Live Warning Banner */}
                      {liveWarning && (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-5 mb-4">
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">⚠️</span>
                            <div>
                              <p className="font-bold text-gray-900 mb-1">Pattern Alert</p>
                              <p className="text-sm text-gray-800">{liveWarning.message}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5 mb-4">
                        <h3 className="font-bold text-gray-800 mb-2">🔍 Pattern Detection</h3>
                        <p className="text-sm text-gray-700">
                          Understanding your patterns helps you stay ahead of triggers. The app learns when you're most vulnerable.
                        </p>
                      </div>

                      {/* Usage Stats */}
                      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                        <h3 className="font-bold text-gray-800 mb-4">Your Activity</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-2xl font-bold text-blue-600">{patterns.totalOpens}</p>
                            <p className="text-xs text-gray-600 mt-1">Total app opens</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-2xl font-bold text-red-600">{patterns.panicButtonUses}</p>
                            <p className="text-xs text-gray-600 mt-1">Panic button uses</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-2xl font-bold text-green-600">{patterns.thisWeekOpens}</p>
                            <p className="text-xs text-gray-600 mt-1">Opens this week</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-2xl font-bold text-purple-600">{patterns.averagePerDay}</p>
                            <p className="text-xs text-gray-600 mt-1">Average per day</p>
                          </div>
                        </div>
                      </div>

                      {/* Pattern Insights */}
                      {patterns.totalOpens >= 5 && (
                        <>
                          <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                            <h3 className="font-bold text-gray-800 mb-4">What Your Data Shows</h3>
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="bg-red-100 p-2 rounded-lg">
                                  <span className="text-xl">⏰</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">Riskiest Time</p>
                                  <p className="text-sm text-gray-600">{patterns.riskiestTimeCategory}</p>
                                  <p className="text-xs text-gray-500 mt-1">Plan activities during this window</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <span className="text-xl">📅</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">Challenging Day</p>
                                  <p className="text-sm text-gray-600">{patterns.riskiestDay}s ({patterns.riskiestDayCount} times)</p>
                                  <p className="text-xs text-gray-500 mt-1">Extra support recommended on this day</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <span className="text-xl">💪</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">Best Support Tool</p>
                                  <p className="text-sm text-gray-600">
                                    {patterns.panicButtonUses > journalEntries.length 
                                      ? 'Panic Button' 
                                      : journalEntries.length > 0 ? 'Journal' : 'Just getting started'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Keep using what works for you</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="font-bold text-gray-800 mb-4">💡 Personalized Tips</h3>
                            <ul className="space-y-3 text-sm text-gray-700">
                              <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>You're most vulnerable during {patterns.riskiestTimeCategory} on {patterns.riskiestDay}s. Plan activities in advance for this window.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Urges typically last 15-20 minutes. When you feel triggered, set a timer and wait it out.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>You've used the panic button {patterns.panicButtonUses} time{patterns.panicButtonUses !== 1 ? 's' : ''} - that's {patterns.panicButtonUses} urge{patterns.panicButtonUses !== 1 ? 's' : ''} you've beaten.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Journal more on your challenging days. Writing helps process the urge.</span>
                              </li>
                            </ul>
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}

          </div>
        </div>
      </div>
    );
  };

  const ProfileTab = React.memo(() => {
    const allBadges = [
      { id: 'first_week', name: 'Week Warrior', icon: '🔥', description: '7 days gamble-free', requirement: 7 },
      { id: 'first_month', name: 'Month Master', icon: '💪', description: '30 days gamble-free', requirement: 30 },
      { id: 'quarter_champ', name: 'Quarter Champion', icon: '⭐', description: '90 days gamble-free', requirement: 90 },
      { id: 'first_call', name: 'Reached Out', icon: '📞', description: 'Called the helpline', requirement: 'helpline' },
      { id: 'first_meeting', name: 'Connected', icon: '👥', description: 'Attended GA meeting', requirement: 'meeting' },
      { id: 'journal_7', name: 'Reflective Writer', icon: '✍️', description: '7 journal entries', requirement: 7 },
      { id: 'journal_30', name: 'Committed Chronicler', icon: '📖', description: '30 journal entries', requirement: 30 },
    ];

    const checkBadges = () => {
      const daysClean = getDaysClean();
      const newBadges = [];
      if (daysClean >= 7 && !earnedBadges.includes('first_week')) newBadges.push('first_week');
      if (daysClean >= 30 && !earnedBadges.includes('first_month')) newBadges.push('first_month');
      if (daysClean >= 90 && !earnedBadges.includes('quarter_champ')) newBadges.push('quarter_champ');
      if (journalEntries.length >= 7 && !earnedBadges.includes('journal_7')) newBadges.push('journal_7');
      if (journalEntries.length >= 30 && !earnedBadges.includes('journal_30')) newBadges.push('journal_30');
      
      if (newBadges.length > 0) {
        const updated = [...earnedBadges, ...newBadges];
        setEarnedBadges(updated);
        localStorage.setItem('earnedBadges', JSON.stringify(updated));
        // Sync new badges to Supabase
        const session = supabase.getSession();
        if (session) {
          newBadges.forEach(badgeId => {
            supabase.from('earned_badges').upsert({
              user_id: session.user.id,
              badge_id: badgeId,
              earned_at: new Date().toISOString()
            }).catch(() => {});
          });
        }
      }
    };

    useEffect(() => {
      checkBadges();
    }, [startDate, journalEntries.length]);

    // Interests Selection View
    if (showInterests) {
      const availableInterests = [
        { id: 'cooking', name: '🍳 Cooking & Food', icon: '🍳' },
        { id: 'music', name: '🎸 Music', icon: '🎸' },
        { id: 'art', name: '🎨 Art & Creativity', icon: '🎨' },
        { id: 'reading', name: '📚 Reading & Writing', icon: '📚' },
        { id: 'diy', name: '🛠️ DIY & Building', icon: '🛠️' },
        { id: 'photography', name: '📷 Photography', icon: '📷' },
        { id: 'gaming', name: '🎮 Gaming', icon: '🎮' },
        { id: 'gardening', name: '🌱 Gardening', icon: '🌱' },
        { id: 'tech', name: '💻 Tech & Coding', icon: '💻' },
        { id: 'fitness', name: '🏋️ Fitness', icon: '🏋️' },
        { id: 'puzzles', name: '🧩 Puzzles & Brain Games', icon: '🧩' },
        { id: 'movies', name: '🎬 Movies & TV', icon: '🎬' },
        { id: 'sports', name: '⚽ Sports', icon: '⚽' },
      ];

      const toggleInterest = (interestId) => {
        const updated = selectedInterests.includes(interestId)
          ? selectedInterests.filter(id => id !== interestId)
          : [...selectedInterests, interestId];
        setSelectedInterests(updated);
        localStorage.setItem('selectedInterests', JSON.stringify(updated));
        syncSettingsToSupabase({ selected_interests: updated }).catch(() => {});
        if (!selectedInterests.includes(interestId)) {
          addPoints(5, `Added interest: ${availableInterests.find(i => i.id === interestId).name}`);
        }
      };

      return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
          <div className="bg-purple-500 text-white p-6">
            <button onClick={() => setShowInterests(false)} className="flex items-center mb-4 hover:opacity-80">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back to Profile</span>
            </button>
            <h1 className="text-2xl font-bold">My Interests</h1>
            <p className="text-sm opacity-90">Used across all tools</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-3">
                {availableInterests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-xl font-semibold transition-all text-left ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{interest.icon}</div>
                    <div className="text-sm">{interest.name.replace(/^.\s/, '')}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
                <p className="text-sm text-gray-600 text-center">
                  {selectedInterests.length === 0 
                    ? "Select interests to personalize your experience"
                    : `${selectedInterests.length} interest${selectedInterests.length !== 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Main Profile View
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">My Profile</h1>
            {isAdmin() && (
              <button onClick={() => { setActiveTab('resources'); setActiveTool('admin'); }} className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                Admin Panel
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold">
              {(username || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold">{username || 'Anonymous'}</p>
              <p className="text-sm opacity-75">{currentUser?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`${getLevelTier(level).bg} ${getLevelTier(level).color} px-2 py-0.5 rounded-full text-xs font-bold`}>{getLevelTier(level).icon} Level {level}</span>
                <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs font-bold">{points} pts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-blue-600">{getDaysClean()}</p><p className="text-xs text-gray-500">Days clean</p></div>
            <div><p className="text-2xl font-bold text-purple-600">{journalEntries.length}</p><p className="text-xs text-gray-500">Journal entries</p></div>
            <div><p className="text-2xl font-bold text-yellow-600">{earnedBadges.length}</p><p className="text-xs text-gray-500">Badges</p></div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-5">

            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold text-gray-800 mb-3">Recovery Timer</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{getDaysClean()} days</p>
                  <p className="text-sm text-gray-500">Since {new Date(startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setShowResetModal(true)} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-2">Reset</button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Badges</h3>
                <span className="text-sm text-gray-500">{earnedBadges.length}/{allBadges.length} earned</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {allBadges.map((badge) => {
                  const earned = earnedBadges.includes(badge.id);
                  return (
                    <div key={badge.id} className={`rounded-xl p-3 text-center ${earned ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50 opacity-40'}`} title={badge.description}>
                      <div className="text-2xl mb-1">{earned ? badge.icon : '—'}</div>
                      <div className="text-xs font-semibold text-gray-700 leading-tight">{badge.name}</div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const daysClean = getDaysClean();
                const next = allBadges.find(b => !earnedBadges.includes(b.id) && typeof b.requirement === 'number');
                if (!next) return null;
                const isJournal = next.id.startsWith('journal_');
                const current = isJournal ? journalEntries.length : daysClean;
                const remaining = next.requirement - current;
                if (remaining <= 0) return null;
                return (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700"><strong>{next.name}</strong> — {remaining} more {isJournal ? 'journal entries' : 'days'} to go</p>
                  </div>
                );
              })()}
            </div>

            <button onClick={() => setShowInterests(true)} className="w-full bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">My Interests</h3>
                  <p className="text-sm text-gray-500">{selectedInterests.length === 0 ? 'None selected — tap to add' : selectedInterests.length + ' selected'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            <button onClick={() => { trackToolUsage('why-quitting'); setActiveTab('resources'); setActiveTool('why-quitting'); }} className="w-full bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Why I'm Quitting</h3>
                  <p className="text-sm text-gray-500">{whyImQuitting.primaryReason ? `"${whyImQuitting.primaryReason.slice(0, 50)}${whyImQuitting.primaryReason.length > 50 ? '...' : ''}"` : 'Add your reasons — tap to open'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <button onClick={() => { setActiveTab('resources'); setActiveTool('settings'); }} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <span className="font-semibold text-gray-800">Settings</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button onClick={logout} className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors">
                <span className="font-semibold text-red-600">Log Out</span>
                <ChevronRight className="w-5 h-5 text-red-300" />
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  });

  // Settings Page
  const SettingsPage = () => {
    const [editingUsername, setEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState(username);
    const [tempAge, setTempAge] = useState(userAgeRange);
    const [tempCity, setTempCity] = useState(userCity);
    const [editingTimer, setEditingTimer] = useState(false);
    const [tempTimerDate, setTempTimerDate] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);

    const saveUsername = () => {
      const trimmed = tempUsername.trim();
      if (!trimmed || trimmed.length < 2) {
        showError('Username must be at least 2 characters');
        return;
      }
      setUsername(trimmed);
      localStorage.setItem('username', trimmed);
      localStorage.setItem('chatUsername', trimmed);
      setHasSetUsername(true);
      // Also update currentUser
      const updatedUser = { ...currentUser, username: trimmed };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      syncProfileToSupabase({ username: trimmed }).catch(() => {});
      showSuccess('Username updated!');
      setEditingUsername(false);
    };

    const saveAge = (age) => {
      setUserAgeRange(age);
      setTempAge(age);
      localStorage.setItem('userAgeRange', age);
      showSuccess('Age range updated!');
    };

    const saveCity = (city) => {
      setUserCity(city.trim());
      setTempCity(city.trim());
      localStorage.setItem('userCity', city.trim());
      showSuccess('City updated!');
    };

    const saveTimerDate = () => {
      if (tempTimerDate) {
        const newDate = new Date(tempTimerDate);
        setStartDate(newDate);
        localStorage.setItem('startDate', newDate.toISOString());
        syncProfileToSupabase({ start_date: newDate.toISOString() }).catch(() => {});
        setEditingTimer(false);
        showSuccess('Timer date updated!');
      }
    };

    const exportData = () => {
      const daysClean = getDaysClean();
      const totalSaved = (dailyGamblingSpend * daysClean).toFixed(2);
      
      const data = {
        // Profile
        profile: {
          username,
          ageRange: userAgeRange,
          city: userCity,
          startDate: startDate.toISOString(),
          daysClean: daysClean,
          level,
          points
        },
        
        // Summary Stats
        summary: {
          totalDaysClean: daysClean,
          totalMoneySaved: parseFloat(totalSaved),
          dailySpend: dailyGamblingSpend,
          journalEntries: journalEntries.length,
          badgesEarned: earnedBadges.length,
          currentLevel: level,
          totalPoints: points
        },

        // Detailed Data
        journalEntries: journalEntries.map(entry => ({
          date: entry.date,
          mode: entry.mode,
          mood: entry.mood,
          content: entry.content,
          responses: entry.responses
        })),

        earnedBadges: earnedBadges,

        activityLog: activityLog.map(a => ({
          type: a.type,
          duration: a.duration,
          date: a.date
        })),
        
        whyImQuitting: whyImQuitting,
        
        // Analytics
        analytics: {
          toolUsage,
          appOpenTimestamps,
          panicButtonTimestamps,
          paydaySettings
        },
        
        // Music preferences
        musicPreferences: {
          seedArtists,
          artistFeedback
        },
        
        // Metadata
        exportInfo: {
          exportDate: new Date().toISOString(),
          appVersion: '1.0.0',
          dataFormat: 'beat-the-bet-backup'
        }
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `beat-the-bet-backup-${username || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess('Data exported successfully! 📥');
    };

    const exportSummaryReport = () => {
      const daysClean = getDaysClean();
      const totalSaved = (dailyGamblingSpend * daysClean).toFixed(2);
      const weeksSinceStart = Math.floor(daysClean / 7);
      
      const report = `
╔═══════════════════════════════════════════════════════╗
║          BEAT THE BET - RECOVERY REPORT              ║
╚═══════════════════════════════════════════════════════╝

📊 RECOVERY SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Profile
   Username: ${username || 'Not set'}
   Age Range: ${userAgeRange || 'Not set'}
   City: ${userCity || 'Not set'}

⏱️  Recovery Progress
   Start Date: ${new Date(startDate).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
   Days Clean: ${daysClean} days (${weeksSinceStart} weeks)
   Current Level: Level ${level}
   Total Points: ${points}

💰 Financial Impact
   Daily Gambling Spend: $${dailyGamblingSpend}
   Total Money Saved: $${totalSaved}
   Average Per Week: $${(dailyGamblingSpend * 7).toFixed(2)}

🏆 Achievements
   Badges Earned: ${earnedBadges.length}
   Journal Entries: ${journalEntries.length}
   Activities Completed: ${activityLog.length}
   Savings Goals: ${savingsGoals.length}

📝 Journal Activity
   Total Entries: ${journalEntries.length}
   Favorite Entries: ${journalEntries.filter(e => e.isFavorite).length}
   Most Recent: ${journalEntries.length > 0 ? new Date(journalEntries[journalEntries.length - 1].date).toLocaleDateString('en-AU') : 'None'}

🎯 Goals
   ${savingsGoals.length > 0 ? savingsGoals.map(g => `• ${g.icon} ${g.name}: $${g.amount}`).join('\n   ') : 'No goals set'}

❤️  Why I'm Quitting
   ${whyImQuitting.length > 0 ? whyImQuitting.map((r, i) => `${i + 1}. ${r.text || r.type}`).join('\n   ') : 'Not set'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Report Generated: ${new Date().toLocaleDateString('en-AU', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

Keep going! Every day counts. 💪
`;

      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `recovery-report-${username || 'user'}-${new Date().toISOString().split('T')[0]}.txt`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess('Summary report exported! 📄');
    };

    const deleteAllData = () => {
      localStorage.clear();
      window.location.reload();
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white p-6">
          <button onClick={() => setActiveTab('info')} className="flex items-center mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back</span>
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <span className="text-3xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm opacity-90">Manage your account</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">

            {/* Account Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Account</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  {editingUsername ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter username"
                      />
                      <button
                        onClick={saveUsername}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setTempUsername(username);
                          setEditingUsername(false);
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-medium">{username}</span>
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>


              </div>
            </div>

            {/* Timer Settings */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Timer</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recovery Timer
                  </label>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-900 font-medium">
                      {new Date(startDate).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-blue-600 font-bold text-sm">{getDaysClean()} days</span>
                  </div>
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="w-full border border-red-300 text-red-500 hover:bg-red-50 rounded-lg py-2 text-sm font-semibold transition-colors"
                  >
                    Reset timer to today
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Only use this if you gambled today and need to start fresh.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Notifications</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Daily Check-In Reminder</p>
                    <p className="text-xs text-gray-600">Remind me to journal daily</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Payday Alerts</p>
                    <p className="text-xs text-gray-600">Alert me on payday</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Pattern Alerts</p>
                    <p className="text-xs text-gray-600">Warn me during risky times</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Note: Push notifications require app installation. These toggles will be functional after backend setup.
                </p>
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Data & Privacy</h3>
              </div>
              <div className="p-5 space-y-3">
                <button
                  onClick={exportData}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export Full Backup
                </button>
                <p className="text-xs text-gray-600">
                  Download all your data as JSON for complete backup
                </p>

                <button
                  onClick={exportSummaryReport}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export Summary Report
                </button>
                <p className="text-xs text-gray-600">
                  Download a formatted text report of your recovery progress
                </p>

                {/* Account Deletion */}
                <div className="border-t border-red-100 pt-4 mt-2">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full border-2 border-red-300 text-red-500 hover:bg-red-50 rounded-lg py-3 font-semibold transition-colors"
                    >
                      Delete My Account
                    </button>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                      <p className="font-bold text-red-800 mb-1">Are you absolutely sure?</p>
                      <p className="text-sm text-red-700 mb-4">
                        This permanently deletes your account, all journal entries, badges, activity history, and recovery data. <strong>This cannot be undone.</strong>
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder='Type DELETE to confirm'
                        className="w-full p-3 border-2 border-red-300 rounded-lg mb-3 text-sm focus:outline-none focus:border-red-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg py-2 font-semibold text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (deleteConfirmText !== 'DELETE') { showError('Type DELETE to confirm'); return; }
                            setDeletingAccount(true);
                            await deleteAccount();
                            setDeletingAccount(false);
                          }}
                          disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg py-2 font-semibold text-sm"
                        >
                          {deletingAccount ? 'Deleting...' : 'Delete Forever'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setHasCompletedOnboarding(false);
                    setOnboardingStep(0);
                    localStorage.removeItem('hasCompletedOnboarding');
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg py-3 font-semibold transition-colors"
                >
                  Restart Setup Guide
                </button>

              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-red-200">
              <div className="bg-red-50 px-5 py-3 border-b border-red-200">
                <h3 className="font-bold text-red-800">Danger Zone</h3>
              </div>
              <div className="p-5">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 font-semibold transition-colors"
                  >
                    Delete All Data
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 font-semibold">
                      ⚠️ This will permanently delete ALL your data:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• Your timer and streak ({getDaysClean()} days)</li>
                      <li>• All journal entries ({journalEntries.length} entries)</li>
                      <li>• Badges and progress (Level {level})</li>
                      <li>• All settings and preferences</li>
                    </ul>
                    <p className="text-xs text-red-600 font-semibold">
                      This action cannot be undone!
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={deleteAllData}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-bold transition-colors"
                      >
                        Yes, Delete Everything
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg py-3 font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">About</h3>
              </div>
              <div className="p-5 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="font-semibold text-gray-900">1.0.0 Beta</span>
                </div>
                <div className="flex justify-between">
                  <span>Build</span>
                  <span className="font-semibold text-gray-900">2026.05.22</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform</span>
                  <span className="font-semibold text-gray-900">Web (Mobile coming soon)</span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left text-blue-600 hover:text-blue-800 font-medium py-1"
                  >
                    Privacy Policy →
                  </a>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left text-blue-600 hover:text-blue-800 font-medium py-1"
                  >
                    Terms of Service →
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const InfoTab = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">About</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Our approach to recovery</p>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Our Philosophy</h2>
            <p className="text-gray-700 mb-4 font-semibold text-lg text-center italic">
              "Every bet you don't place is a win."
            </p>
            <p className="text-gray-600 leading-relaxed">
              Beat the Bet is designed to support your recovery journey without judgment, 
              shame, or punishment. We focus on time away from gambling, not money lost. 
              We provide immediate help during urges, not just analysis after relapse.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-3">What Makes Us Different</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">We don't just block — we replace. Gambling chases a dopamine hit, so we point you toward real ones: movement, music, connection, achievement.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">Support during urges, not just after setbacks</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">Ongoing support, not a one-time fix — recovery is something we help you build daily, not something we assume is solved by a single block</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">Time-based progress that builds momentum</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">Recovery-safe design with no triggers</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">Always free core features with no ads</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-3">Settings & Account</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Manage your account, export your data, change your timer, or restart the setup guide.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('resources');
                  setActiveTool('settings');
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 font-semibold transition-colors"
              >
                Open Settings
              </button>

            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <strong>Premium features coming soon:</strong> Additional tools to support your recovery 
              journey. A portion of all premium revenue will be donated to Lifeline Australia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const PremiumTab = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Premium Tools</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Coming soon</p>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto">
          {/* Premium Banner */}
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center mb-3">
              <Sparkles className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-bold">Beat the Bet Premium</h2>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Advanced tools to strengthen your recovery, give you healthy outlets, and help you build a better life.
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-sm">
              <strong>Our commitment:</strong> A portion of all premium revenue supports Lifeline Australia.
            </div>
          </div>

          {/* Premium Features */}
          <div className="space-y-4">
            {/* Fake Betting Polls */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
              <div className="flex items-start mb-3">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-bold text-lg text-gray-800">Urge Outlet Polls</h3>
                    <Lock className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Harmless prediction polls about sports, weather, and events. Scratch the itch without any risk or money involved.
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-xs text-gray-700">
                Safe outlet for gambling urges • No real money • No consequences
              </div>
            </div>

            {/* Money Saved Visualisations */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
              <div className="flex items-start mb-3">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-bold text-lg text-gray-800">Money Saved Tracker</h3>
                    <Lock className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Set your average daily gambling spend and watch your savings grow. Visual charts show what recovery means for your wallet.
                  </p>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-xs text-gray-700">
                Track your financial recovery • Motivating visualizations • Set savings goals
              </div>
            </div>

            {/* Interest-Based Shopfront */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
              <div className="flex items-start mb-3">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-bold text-lg text-gray-800">Reward Yourself Shop</h3>
                    <Lock className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Browse meaningful purchases based on your interests. See what your saved money could buy instead. Includes charity donation options.
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-700">
                Personalized suggestions • Charity donations • Replace gambling with meaning
              </div>
            </div>

            {/* Location-Based Alternatives */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500">
              <div className="flex items-start mb-3">
                <div className="bg-orange-100 p-3 rounded-full mr-4">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-bold text-lg text-gray-800">Nearby Activities</h3>
                    <Lock className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Discover local alternatives when you're tempted to gamble. Parks, cafes, gyms, and activities near you right now.
                  </p>
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-xs text-gray-700">
                Location-based suggestions • Healthy alternatives • Break the habit loop
              </div>
            </div>

            {/* Advanced Insights */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500">
              <div className="flex items-start mb-3">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-bold text-lg text-gray-800">Streak Analytics</h3>
                    <Lock className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Detailed insights into your recovery patterns. Track longest streaks, identify trigger times, and celebrate milestones.
                  </p>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-xs text-gray-700">
                Pattern recognition • Milestone tracking • Recovery insights
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-6 border-2 border-dashed border-gray-300">
            <h3 className="font-bold text-gray-800 mb-2 text-center">Premium Launching Soon</h3>
            <p className="text-sm text-gray-600 text-center">
              We're building these tools carefully to ensure they support recovery without adding pressure or triggers. 
              Stay tuned for updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Authentication Screens
  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Beat the Bet</h1>
          <p className="text-gray-600">Take back control of your life</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => setAuthScreen('signup')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
          >
            Sign Up with Email
          </button>
          
          <button
            onClick={() => setAuthScreen('login')}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 py-4 rounded-xl font-bold text-lg transition-colors shadow-md border-2 border-gray-200"
          >
            Log In
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );

  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState('');

    const handleLogin = async () => {
      setErrors({});
      setLoginError('');

      const validationErrors = validateForm({
        email: { value: email, rules: ['required', 'email'] },
        password: { value: password, rules: ['required'] }
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setLoading(true);
      try {
        await realLogin(email, password);
        showSuccess('Welcome back!');
      } catch (error) {
        // Show inline error - keep email in box, clear password only
        setPassword('');
        setLoginError(error.message || 'Incorrect email or password. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // No full-screen loading swap - keeps email visible if login fails

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <button
          onClick={() => setAuthScreen('welcome')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 mb-8">Sign in to continue your recovery journey</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setAuthScreen('forgot')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Inline error message */}
              {loginError && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                  <p className="text-sm text-red-700 font-medium">{loginError}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : 'Log In'}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthScreen('signup')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SignUpScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const getPasswordStrength = () => {
      if (!password) return null;
      const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
      };
      return checks;
    };

    const passwordChecks = getPasswordStrength();

    const [signupError, setSignupError] = React.useState('');

    const handleSignUp = async () => {
      setErrors({});
      setSignupError('');

      const validationErrors = validateForm({
        email: { value: email, rules: ['required', 'email'] },
        password: { value: password, rules: ['required', 'password'] }
      });

      if (password !== confirmPassword) {
        validationErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setLoading(true);
      try {
        const result = await realSignup(email, password, confirmPassword);
        if (result && result.needsEmailConfirmation) {
          showSuccess('Check your email to confirm your account, then log in.');
          setAuthScreen('login');
        } else {
          showSuccess('Account created successfully!');
        }
      } catch (error) {
        setSignupError(error.message || 'Could not create account. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // No full-screen loading swap

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <button
          onClick={() => setAuthScreen('welcome')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600 mb-8">Start your recovery journey today</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {passwordChecks && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs">
                      <span className={passwordChecks.length ? 'text-green-600' : 'text-gray-400'}>
                        {passwordChecks.length ? '✓' : '○'} 8+ characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'}>
                        {passwordChecks.uppercase ? '✓' : '○'} 1 uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={passwordChecks.number ? 'text-green-600' : 'text-gray-400'}>
                        {passwordChecks.number ? '✓' : '○'} 1 number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {signupError && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                  <p className="text-sm text-red-700 font-medium">{signupError}</p>
                </div>
              )}

              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthScreen('login')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile Setup Screen
  const ProfileSetupScreen = () => {
    // Use separate local state for each field to prevent re-render resets
    const [usernameValue, setUsernameValue] = React.useState('');
    const [usernameError, setUsernameError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleComplete = async () => {
      setUsernameError('');

      const trimmed = usernameValue.trim();
      if (!trimmed || trimmed.length < 2) {
        setUsernameError('Username must be at least 2 characters');
        return;
      }
      if (trimmed.length > 30) {
        setUsernameError('Username must be 30 characters or less');
        return;
      }

      setLoading(true);

      // Update user profile
      const updatedUser = {
        ...currentUser,
        username: trimmed,
        profileComplete: true
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Update global username state
      setUsername(trimmed);
      localStorage.setItem('username', trimmed);

      // Sync to Supabase
      try {
        await syncProfileToSupabase({ username: trimmed });
      } catch (e) {
        console.warn('Profile sync failed:', e);
      }

      setLoading(false);
      showSuccess('Welcome to Beat the Bet!');
      // Now safe to check admin (profile is complete, no more remount risk)
      checkAdminStatus();
    };

    if (loading) {
      return <LoadingScreen message="Setting up your profile..." />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">One last thing</h1>
            <p className="text-gray-600">Choose a username for your profile and the community chat</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="profile-username" className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                id="profile-username"
                name="username"
                type="text"
                autoComplete="username"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComplete()}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  usernameError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. RecoveryRoad, CleanSlate..."
                maxLength={30}
              />
              {usernameError && (
                <p className="text-red-500 text-xs mt-1">{usernameError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                This will be visible in community chat. Don't use your real name.
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Be honest.</strong> You'll set your recovery start date in the next step. Your timer is a source of pride, not shame — every journey starts somewhere.
              </p>
            </div>

            <button
              onClick={handleComplete}
              disabled={loading || usernameValue.trim().length < 2}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg mt-2"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
      if (!validators.email(email)) {
        showError('Please enter a valid email address');
        return;
      }

      setLoading(true);
      
      // Simulate sending reset email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSent(true);
      setLoading(false);
      showSuccess('Password reset link sent! Check your email.');
    };

    if (loading) {
      return <LoadingScreen message="Sending reset link..." />;
    }

    if (sent) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
            <button
              onClick={() => setAuthScreen('login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <button
          onClick={() => setAuthScreen('login')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600">
                Enter your email and we'll send you a link to reset your password
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
              >
                Send Reset Link
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <button
                    onClick={() => setAuthScreen('login')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResetPasswordScreen = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const getPasswordStrength = () => {
      if (!password) return null;
      const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
      };
      return checks;
    };

    const passwordChecks = getPasswordStrength();

    const handleSubmit = async () => {
      setErrors({});

      const validationErrors = validateForm({
        password: { value: password, rules: ['required', 'password'] }
      });

      if (password !== confirmPassword) {
        validationErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        showError(Object.values(validationErrors)[0]);
        return;
      }

      setLoading(true);
      
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setLoading(false);
      showSuccess('Password updated successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setAuthScreen('login');
      }, 2000);
    };

    if (loading) {
      return <LoadingScreen message="Updating password..." />;
    }

    if (success) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Password Updated!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
              <p className="text-gray-600">Choose a strong password for your account</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="reset-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="reset-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {passwordChecks && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs">
                      <span className={passwordChecks.length ? 'text-green-600' : 'text-gray-400'}>
                        {passwordChecks.length ? '✓' : '○'} 8+ characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'}>
                        {passwordChecks.uppercase ? '✓' : '○'} 1 uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={passwordChecks.number ? 'text-green-600' : 'text-gray-400'}>
                        {passwordChecks.number ? '✓' : '○'} 1 number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };





  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authScreen === 'welcome') return <WelcomeScreen />;
    if (authScreen === 'login') return <LoginScreen />;
    if (authScreen === 'signup') return <SignUpScreen />;
    if (authScreen === 'forgot') return <ForgotPasswordScreen />;
    if (authScreen === 'reset') return <ResetPasswordScreen />;
  }

  // Show profile setup if authenticated but profile incomplete
  if (isAuthenticated && currentUser && !currentUser.profileComplete) {
    return <ProfileSetupScreen />;
  }


  return (
    <div className="relative min-h-screen">
      {/* Show onboarding if not completed */}
      {!hasCompletedOnboarding && <OnboardingFlow />}
      
      {activeTab === 'home' && <HomeTab />}
      {activeTab === 'resources' && <ResourcesTab />}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'info' && <InfoTab />}
      
      {showResetModal && <ResetModal />}
      {showPanicModal && <PanicModal />}

      {/* Success Toast */}
      {showSuccessToast && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
          style={{
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
          style={{
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
          style={{
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {isLoading && <LoadingOverlay message="Please wait..." />}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'home' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('resources');
              setActiveTool(null); // Close any open tool to return to tools home
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'resources' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <LifeBuoy className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Tools</span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </button>
          
          <button
            onClick={() => setActiveTab('info')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'info' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <Info className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">About</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, sendPasswordResetEmail, signOut, updateProfile, type User } from 'firebase/auth';
import { Menu, Save, ShieldAlert, SlidersHorizontal, UserCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { auth } from '@/lib/firebase';
import { useProjects } from '@/context/ProjectsContext';
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  resetUserSettings,
  saveUserSettings,
  type UserSettings,
} from '@/lib/userSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { projects } = useProjects();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!nextUser) {
        router.push('/login');
        setCheckingAuth(false);
        return;
      }

      setUser(nextUser);
      setDisplayName(nextUser.displayName ?? '');
      setSettings(loadUserSettings(nextUser.uid));
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const estimatedWeeklyHours = useMemo(() => {
    return ((settings.smartPlannerDurationMinutes * 5) / 60).toFixed(1);
  }, [settings.smartPlannerDurationMinutes]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (displayName.trim() !== (user.displayName ?? '')) {
        await updateProfile(user, { displayName: displayName.trim() });
      }
      const normalized = saveUserSettings(user.uid, settings);
      setSettings(normalized);
      setMessage('Settings saved.');
    } catch (e) {
      console.error(e);
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!user) return;
    const defaults = resetUserSettings(user.uid);
    setSettings(defaults);
    setMessage('Settings reset to defaults.');
    setError('');
  };

  const handleExportData = () => {
    if (!user) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
      stats: {
        totalProjects: projects.length,
        totalEvents: projects.reduce((sum, project) => sum + (project.calendarEvents?.length ?? 0), 0),
      },
      projects,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notium-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Data export started.');
    setError('');
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setMessage('');
    setError('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage('Password reset email sent.');
    } catch (e) {
      console.error(e);
      setError('Failed to send password reset email.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div role="status">
          <svg aria-hidden="true" className="h-8 w-8 animate-spin fill-blue-600 text-gray-200" viewBox="0 0 100 101">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      <div className="absolute left-4 top-4 z-50 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white lg:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-800">
          <Menu size={24} />
        </button>
      </div>

      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex min-h-screen flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h1 className="text-2xl font-bold text-black">Settings</h1>
          <p className="text-sm text-gray-500">Tune behavior across dashboard, calendar, and account actions.</p>
        </div>

        {message && <div className="rounded-md bg-[#F2F0FF] px-3 py-2 text-sm text-[#2D1FA8]">{message}</div>}
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserCircle2 size={18} className="text-[#4D3BED]" />
            <h2 className="text-lg font-semibold text-black">Account</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
              <input value={user.email ?? ''} disabled className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
                placeholder="Your name"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={handlePasswordReset} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Send Password Reset
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-[#4D3BED]" />
            <h2 className="text-lg font-semibold text-black">Productivity Defaults</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Dashboard Search Limit</label>
              <input
                type="number"
                min={3}
                max={20}
                value={settings.dashboardSearchLimit}
                onChange={(e) => setSettings((prev) => ({ ...prev, dashboardSearchLimit: Number(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Default Event Start</label>
              <input
                type="time"
                value={settings.defaultEventStartTime}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultEventStartTime: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Default Event Duration (min)</label>
              <input
                type="number"
                min={15}
                step={15}
                max={480}
                value={settings.defaultEventDurationMinutes}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultEventDurationMinutes: Number(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Smart Planner Start</label>
              <input
                type="time"
                value={settings.smartPlannerStartTime}
                onChange={(e) => setSettings((prev) => ({ ...prev, smartPlannerStartTime: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Smart Planner Duration (min)</label>
              <input
                type="number"
                min={15}
                step={15}
                max={480}
                value={settings.smartPlannerDurationMinutes}
                onChange={(e) => setSettings((prev) => ({ ...prev, smartPlannerDurationMinutes: Number(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Default Event Color</label>
              <input
                type="color"
                value={settings.defaultEventColor}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultEventColor: e.target.value }))}
                className="h-10 w-20 rounded border border-gray-300"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="confirm-delete"
              type="checkbox"
              checked={settings.confirmBeforeDelete}
              onChange={(e) => setSettings((prev) => ({ ...prev, confirmBeforeDelete: e.target.checked }))}
            />
            <label htmlFor="confirm-delete" className="text-sm text-gray-700">
              Confirm before deleting calendar events
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">Estimated smart-planned focus time per week: {estimatedWeeklyHours}h</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-[#4D3BED] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button onClick={handleResetDefaults} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Reset Defaults
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#4D3BED]" />
            <h2 className="text-lg font-semibold text-black">Data and Session</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportData} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Export Workspace JSON
            </button>
            <button onClick={handleSignOut} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Sign Out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

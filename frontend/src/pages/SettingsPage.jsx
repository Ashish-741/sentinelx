import { useState } from 'react';
import { changePassword, generateApiKey, revokeApiKey } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, KeyRound, AlertTriangle, Plus, Trash2, Terminal } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match!');
    }

    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    try {
      const res = await generateApiKey(newKeyName);
      setNewlyGeneratedKey(res.data.data.key);
      toast.success('API Key generated successfully! Please copy it now.');
      setNewKeyName('');
      // Force refresh user to get new key list without page reload
      if (typeof refreshUser === 'function') {
        refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate API Key');
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await revokeApiKey(keyId);
      toast.success('API Key revoked');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke API Key');
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-neon" />
          Account Settings
        </h1>
        <p className="text-slate-400 mt-2">Manage your security preferences and profile details.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Username</label>
              <p className="text-slate-200 font-medium">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Email Address</label>
              <p className="text-slate-200 font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Role</label>
              <p className="text-neon font-medium uppercase text-sm tracking-wider mt-1">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-electric" />
            Change Password
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-electric hover:bg-electric/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
            
            <div className="flex items-start gap-2 mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                Changing your password will automatically log you out of all other active sessions across your devices.
              </p>
            </div>
          </form>
        </div>

        {/* API Keys Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 md:col-span-2">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-neon" />
            API Keys
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Use API keys to authenticate scripts and third-party tools. Do not share your API keys.
          </p>

          {newlyGeneratedKey && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-400 text-sm font-semibold mb-2">New API Key Generated! Copy it now, you won't be able to see it again:</p>
              <code className="block p-3 bg-slate-900 rounded text-emerald-300 break-all select-all">{newlyGeneratedKey}</code>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {(user?.apiKeys || []).map(k => (
              <div key={k._id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                <div>
                  <div className="text-slate-200 font-medium">{k.name}</div>
                  <div className="text-xs text-slate-400 mt-1">Created: {new Date(k.createdAt).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => handleRevokeKey(k._id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Revoke Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(user?.apiKeys || []).length === 0 && (
              <p className="text-sm text-slate-500 italic">No API keys generated yet.</p>
            )}
          </div>

          <form onSubmit={handleGenerateKey} className="flex gap-3">
            <input
              type="text"
              placeholder="Key Name (e.g. Jenkins CI)"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon"
            />
            <button
              type="submit"
              className="bg-neon/20 text-neon hover:bg-neon hover:text-slate-900 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Generate Key
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

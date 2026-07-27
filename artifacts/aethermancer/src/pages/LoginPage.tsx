import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { useAccount } from '../context/AccountContext';
import { sounds } from '../lib/sounds';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, register } = useAccount();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    sounds.play('uiClick');
    const err = mode === 'login'
      ? await login(username.trim(), password)
      : await register(username.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => { sounds.play('uiClick'); setLocation('/'); }}
            className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-display text-primary tracking-widest">
            {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </h1>
        </div>

        <div className="bg-card border border-border p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="bg-background border border-border px-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                placeholder="e.g. arcane_hero"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-background border border-border px-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm border border-destructive/30 bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full py-3 bg-primary text-primary-foreground font-bold tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            {mode === 'login' ? (
              <p className="text-sm text-muted-foreground">
                No account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); sounds.play('uiClick'); }}
                  className="text-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Already have one?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); sounds.play('uiClick'); }}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-muted-foreground/50 text-xs mt-4">
          Your Arcane Shards, challengers, and match history sync to your account.
        </p>
      </div>
    </div>
  );
}

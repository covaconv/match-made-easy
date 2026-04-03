import { useState } from 'react';
import { signUpWithEmail, signInWithEmail } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ScreenShell from '@/components/ScreenShell';

interface LoginRegisterProps {
  onAuthSuccess: () => void | Promise<void>;
  onSkip?: () => void;
}

const LoginRegister = ({ onAuthSuccess, onSkip }: LoginRegisterProps) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const { error: err } = await signInWithEmail(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onAuthSuccess();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // Cast explicitly to the expected UserRole type using unknown as a bridge
      const { data, error: err } = await signUpWithEmail(email, password, null as unknown as "founder" | "mentor");

      if (err) {
        setError(err.message);
        return;
      }

      const identityEmail = data.user?.email ?? email;
      const signedInNow = Boolean(data.session) || Boolean(data.user?.email_confirmed_at);

      if (signedInNow) {
        setSuccess(`Account created for ${identityEmail}. Signing you in…`);
        onAuthSuccess();
        return;
      }

      setSuccess(`Account created for ${identityEmail}. Check your email for a confirmation link.`);
    } catch (networkErr: unknown) {
      console.error('Signup network error:', networkErr);
      const err = networkErr as { message?: string };
      setError(err?.message ?? 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">EPIC Match</h1>
          <p className="text-sm text-muted-foreground">Sign in or create an account</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'login' | 'register'); resetState(); }}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@itam.mx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@itam.mx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-400">{success}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue without account →
          </button>
        )}
      </div>
    </ScreenShell>
  );
};

export default LoginRegister;
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const glassInput = cn(
  'h-12 rounded-full pl-11 bg-white/20 border-white/30 text-white placeholder:text-white/60',
  'focus-visible:ring-white/60 focus-visible:ring-offset-0'
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Welcome!"
      tagline="Sign in to manage your retailer network, track projects, and stay connected — all in one place."
    >
      <div className="flex justify-center mb-6">
        <img src="/OIP.webp" alt="Bailord Pulse" className="h-16 w-16 rounded-full ring-4 ring-white/30" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={glassInput}
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(glassInput, 'pr-11')}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-white text-primary font-semibold hover:bg-white/90"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-white/70">
        Own a business?{' '}
        <Link to="/register/retailer" className="text-white font-medium underline underline-offset-2 hover:text-white/90">
          Register as a retailer
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;

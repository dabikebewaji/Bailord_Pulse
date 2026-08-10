import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const glassInput = cn(
  'h-12 rounded-full pl-11 bg-white/20 border-white/30 text-white placeholder:text-white/60',
  'focus-visible:ring-white/60 focus-visible:ring-offset-0'
);

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = (location.state as { email?: string } | null)?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, code });
      toast.success('Email verified! You can now sign in.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new code has been sent to your email');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      heading="Almost there!"
      tagline="Enter the 6-digit code we emailed you to activate your account."
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
          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={cn(glassInput, 'tracking-widest text-center')}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full h-12 rounded-full bg-white text-primary font-semibold hover:bg-white/90"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </Button>
      </form>
      <div className="mt-6 text-center text-sm space-y-2">
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-white/80 hover:text-white"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? 'Sending...' : "Didn't get a code? Resend"}
        </Button>
        <div>
          <Link to="/login" className="text-white font-medium underline underline-offset-2 hover:text-white/90">
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;

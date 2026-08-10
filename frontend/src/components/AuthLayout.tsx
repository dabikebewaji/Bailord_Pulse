import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  heading: string;
  tagline: string;
  children: ReactNode;
  wide?: boolean;
}

// Shared shell for Login / Retailer Register / Verify OTP — blue gradient
// hero with a glass (frosted) card, mimicking the reference "Welcome!"
// template but in Bailord's brand blue instead of orange.
export function AuthLayout({ heading, tagline, children, wide }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[hsl(214,100%,22%)] via-[hsl(214,100%,34%)] to-[hsl(200,100%,45%)] flex items-center">
      {/* Decorative skyline silhouette, bottom of viewport */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full h-40 md:h-56 opacity-20"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        fill="white"
        aria-hidden="true"
      >
        <rect x="0" y="40" width="30" height="60" />
        <rect x="35" y="20" width="24" height="80" />
        <rect x="64" y="55" width="20" height="45" />
        <rect x="90" y="10" width="28" height="90" />
        <rect x="124" y="45" width="22" height="55" />
        <rect x="152" y="30" width="18" height="70" />
        <rect x="176" y="60" width="26" height="40" />
        <rect x="208" y="15" width="24" height="85" />
        <rect x="238" y="50" width="20" height="50" />
        <rect x="264" y="35" width="30" height="65" />
        <rect x="300" y="55" width="18" height="45" />
        <rect x="324" y="25" width="26" height="75" />
        <rect x="356" y="48" width="22" height="52" />
        <rect x="382" y="15" width="18" height="85" />
      </svg>
      {/* Soft glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[hsl(200,100%,55%)]/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className={cn('relative z-10 w-full mx-auto px-4 py-12 grid lg:grid-cols-2 gap-10 items-center', wide ? 'max-w-6xl' : 'max-w-5xl')}>
        <div className="text-white text-center lg:text-left px-2">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{heading}</h1>
          <p className="text-white/80 max-w-sm mx-auto lg:mx-0">{tagline}</p>
        </div>

        <div className={cn('w-full mx-auto rounded-3xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-8', wide ? 'max-w-2xl' : 'max-w-md')}>
          {children}
        </div>
      </div>
    </div>
  );
}

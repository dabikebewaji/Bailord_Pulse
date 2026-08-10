const WHATSAPP_NUMBER = "2348037885880";

// Simple WhatsApp glyph — lucide-react doesn't ship brand icons.
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.83 14.02c-.24.68-1.4 1.32-1.93 1.4-.49.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.61-.6-2.84-1.23-4.7-4.09-4.84-4.28-.14-.19-1.15-1.53-1.15-2.92s.72-2.07.98-2.35c.24-.27.53-.34.71-.34.18 0 .35 0 .5.01.16.01.38-.06.6.46.24.56.8 1.95.87 2.09.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.27.36-.23.6-.14.24.09 1.55.73 1.82.86.27.14.45.2.51.32.07.11.07.65-.17 1.33Z" />
  </svg>
);

export const WhatsAppWidget = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#25D366] pl-4 pr-5 py-3 text-white font-medium shadow-lg transition-transform hover:scale-105 hover:bg-[#20bd5a]"
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0" />
      Start Chat
    </a>
  );
};

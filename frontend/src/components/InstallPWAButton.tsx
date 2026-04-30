import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isIosDevice() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const ios = useMemo(() => isIosDevice(), []);
  const [mobileViewport, setMobileViewport] = useState(() => window.innerWidth <= 1024);

  useEffect(() => {
    const updateViewport = () => setMobileViewport(window.innerWidth <= 1024);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    updateViewport();
    setInstalled(isStandaloneMode());
    window.addEventListener('resize', updateViewport);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const showButton = mobileViewport && !installed;
  if (!showButton) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }

    if (ios) {
      alert('On iPhone: tap Share and choose "Add to Home Screen".');
      return;
    }
    alert('Install is preparing. Refresh once, then tap this icon again. You can also use browser menu > "Install app".');
  };

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-5 right-5 z-[70] w-12 h-12 rounded-2xl bg-neutral-900 text-white shadow-xl shadow-neutral-900/25 border border-neutral-700/40 flex items-center justify-center active:scale-95"
      aria-label="Install app on phone"
      title="Install on phone"
    >
      <Download size={20} />
    </button>
  );
}

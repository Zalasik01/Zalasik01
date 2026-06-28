import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    // Already installed -> never show.
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (standalone) return;
    if (localStorage.getItem('install_dismissed')) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIOSHelp(false);
    localStorage.setItem('install_dismissed', '1');
  };

  const install = async () => {
    if (isIOS) { setShowIOSHelp(true); return; }
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Instalar o DataSearch</p>
            {showIOSHelp ? (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Toque em <span className="font-semibold">Compartilhar</span> e depois em <span className="font-semibold">"Adicionar à Tela de Início"</span>.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">Acesse rapido pelo celular, como um app.</p>
            )}
            {!showIOSHelp && (
              <div className="flex gap-2 mt-3">
                <button onClick={install} className="px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
                  Instalar
                </button>
                <button onClick={dismiss} className="px-3 py-1.5 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Agora nao
                </button>
              </div>
            )}
          </div>
          <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 flex-shrink-0" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

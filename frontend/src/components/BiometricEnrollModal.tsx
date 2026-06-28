import { useState } from 'react';
import { registrarBiometria, setBioEmail } from '../lib/webauthn';

interface Props {
  email: string;
  onDone: () => void;
}

// Modal estilo app de banco: oferecido logo apos o login com senha.
export default function BiometricEnrollModal({ email, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ativar = async () => {
    setLoading(true);
    setError('');
    try {
      await registrarBiometria(`${navigator.platform || 'Aparelho'}`);
      setBioEmail(email);
      onDone();
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Cadastro cancelado. Voce pode ativar depois no painel.'
        : err.response?.data?.error || 'Nao foi possivel ativar a biometria neste aparelho.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const agoraNao = () => {
    // Nao mostrar de novo nesta sessao para este email.
    sessionStorage.setItem('bio_prompt_skipped', email.toLowerCase().trim());
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-[fadeIn_0.2s_ease-out]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 11c0 3-1 5-1 5"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 12a6 6 0 0 1 6 6"/><path d="M22 16c0-2-1-3-1-4"/><circle cx="12" cy="12" r="1"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Ativar login por biometria?</h2>
        <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
          Da proxima vez, entre com Face ID, Touch ID ou digital — sem precisar digitar a senha.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>
        )}

        <button onClick={ativar} disabled={loading}
          className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 mb-2">
          {loading ? 'Aguardando biometria...' : 'Ativar agora'}
        </button>
        <button onClick={agoraNao} disabled={loading}
          className="w-full py-2.5 text-gray-500 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors">
          Agora nao
        </button>
      </div>
    </div>
  );
}

import { FcGoogle } from 'react-icons/fc';
import { HiOutlineCloudUpload, HiOutlineSearch, HiOutlinePhotograph, HiOutlineFilter } from 'react-icons/hi';

interface LoginScreenProps {
    onLogin: () => void;
    isLoading: boolean;
}

export default function LoginScreen({ onLogin, isLoading }: LoginScreenProps) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0f18 0%, #0f1923 40%, #1a2736 100%)' }}>

            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full opacity-10 animate-float"
                    style={{ background: 'radial-gradient(circle, #FF9900, transparent)', top: '10%', left: '15%' }} />
                <div className="absolute w-72 h-72 rounded-full opacity-8 animate-float"
                    style={{ background: 'radial-gradient(circle, #146EB4, transparent)', bottom: '20%', right: '10%', animationDelay: '1s' }} />
                <div className="absolute w-56 h-56 rounded-full opacity-6 animate-float"
                    style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)', top: '50%', left: '60%', animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo & branding */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: 'linear-gradient(135deg, #FF9900, #E88B00)', boxShadow: '0 8px 32px rgba(255,153,0,0.3)' }}>
                            🗂️
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Amazon Asset <span style={{ color: '#FF9900' }}>Manager</span>
                    </h1>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        Upload, organize & find your Amazon assets in seconds.<br />
                        Powered by Google Drive.
                    </p>
                </div>

                {/* Login card */}
                <div className="glass rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <button
                        onClick={onLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                            background: 'white',
                            color: '#1a1a1a',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        }}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                            <FcGoogle size={22} />
                        )}
                        {isLoading ? 'Connecting...' : 'Sign in with Google'}
                    </button>

                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-text-muted text-xs">FEATURES</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        {[
                            { icon: <HiOutlineCloudUpload size={18} />, label: 'Smart Upload', color: '#FF9900' },
                            { icon: <HiOutlineSearch size={18} />, label: 'Instant Search', color: '#146EB4' },
                            { icon: <HiOutlinePhotograph size={18} />, label: 'Live Preview', color: '#10B981' },
                            { icon: <HiOutlineFilter size={18} />, label: 'Tag & Filter', color: '#8B5CF6' },
                        ].map((feat) => (
                            <div key={feat.label}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium"
                                style={{ background: `${feat.color}12`, color: feat.color }}>
                                {feat.icon}
                                {feat.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-text-muted text-xs mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    Your files stay on your Google Drive.<br />We never store your data.
                </p>
            </div>
        </div>
    );
}

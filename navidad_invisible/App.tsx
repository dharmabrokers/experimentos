import React, { useState, useEffect, useRef } from 'react';
import { User, AppState } from './types';
import { getInitialState, saveState, performDraw, generateShareUrl } from './utils';
import Snowfall from './components/Snowfall';
import Bot from './components/Bot';

const MASTER_KEY = "NAVIDAD"; // Clave maestra para recuperar contraseña

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(getInitialState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wishlistInput, setWishlistInput] = useState('');
  
  // Login State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginStep, setLoginStep] = useState<'select' | 'create-password' | 'enter-password' | 'recovery-check' | 'reset-password'>('select');
  const [loginError, setLoginError] = useState('');

  // Music State
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Intentar reproducir automáticamente al cargar
    const playAudio = async () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.3;
        try {
          await audioRef.current.play();
          setMusicPlaying(true);
        } catch (e) {
          console.log("Autoplay blocked, waiting for user interaction");
          setMusicPlaying(false);
        }
      }
    };
    playAudio();
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setMusicPlaying(true))
        .catch(e => {
            console.error("Audio play failed", e);
            alert("No se pudo reproducir. Toca la pantalla e intenta de nuevo.");
        });
    }
  };

  const handleActivateMusic = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play()
        .then(() => setMusicPlaying(true))
        .catch(e => {
            console.error("Audio play failed", e);
            // Fallback for mobile interaction requirements
            alert("⚠️ Pulsa Aceptar para activar el sonido.");
        });
    }
  };

  // ----- SHARING HANDLER -----
  const handleShareApp = async () => {
    const url = generateShareUrl(state);
    const shareData = {
      title: 'Amigo Invisible Fuertes 2025 🎄',
      text: '¡Entra aquí para ver quién te ha tocado! Usa este enlace mágico.',
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles. ¡Pégalo en el WhatsApp de la familia!");
      }
    } catch (err) {
      console.error(err);
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado. ¡Envíalo a la familia!");
    }
  };

  // ----- AUTHENTICATION HANDLERS -----

  const handleUserSelect = (userId: string) => {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return;

    setSelectedUserId(userId);
    setLoginError('');
    setPasswordInput('');

    if (user.password) {
      setLoginStep('enter-password');
    } else {
      setLoginStep('create-password');
    }
  };

  const handlePasswordSubmit = () => {
    if (!selectedUserId) return;
    const userIndex = state.users.findIndex(u => u.id === selectedUserId);
    if (userIndex === -1) return;

    const user = state.users[userIndex];

    if (loginStep === 'create-password' || loginStep === 'reset-password') {
      if (passwordInput.length < 3) {
        setLoginError('La contraseña debe tener al menos 3 caracteres.');
        return;
      }
      // Save new password
      const updatedUser = { ...user, password: passwordInput };
      const newUsers = [...state.users];
      newUsers[userIndex] = updatedUser;
      
      const newState = { ...state, users: newUsers };
      setState(newState);
      saveState(newState);
      
      // Log in
      setCurrentUser(updatedUser);
      setWishlistInput(updatedUser.wishlist);
      setLoginStep('select');
      setSelectedUserId(null);
    } else if (loginStep === 'enter-password') {
      if (passwordInput === user.password) {
        setCurrentUser(user);
        setWishlistInput(user.wishlist);
        setLoginStep('select');
        setSelectedUserId(null);
      } else {
        setLoginError('Contraseña incorrecta. ¡Intruso!');
      }
    } else if (loginStep === 'recovery-check') {
        if (passwordInput.toUpperCase() === MASTER_KEY) {
            setLoginStep('reset-password');
            setPasswordInput('');
            setLoginError('');
        } else {
            setLoginError('Clave Maestra incorrecta.');
        }
    }
  };

  const handleForgotPassword = () => {
    setLoginStep('recovery-check');
    setPasswordInput('');
    setLoginError('');
  };

  const handleBackToSelect = () => {
    setLoginStep('select');
    setSelectedUserId(null);
    setLoginError('');
    setPasswordInput('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginStep('select');
    setSelectedUserId(null);
    setPasswordInput('');
  };

  // ----- APP LOGIC HANDLERS -----

  const handleUpdateWishlist = () => {
    if (!currentUser) return;
    
    const updatedUsers = state.users.map(u => 
      u.id === currentUser.id ? { ...u, wishlist: wishlistInput } : u
    );

    const newState = { ...state, users: updatedUsers };
    setState(newState);
    saveState(newState);
    setCurrentUser(updatedUsers.find(u => u.id === currentUser.id) || null);
    
    alert("¡Carta a Santa guardada! 🎅 Nota: Para que otros vean tus cambios, ¡el Admin debe volver a compartir el enlace!");
  };

  const handleStartDraw = () => {
    if (state.isDrawDone) return;
    try {
      const drawnUsers = performDraw(state.users);
      const newState = { users: drawnUsers, isDrawDone: true };
      setState(newState);
      saveState(newState);
      if (currentUser) {
        setCurrentUser(drawnUsers.find(u => u.id === currentUser.id) || null);
      }
    } catch (e) {
      alert("Hubo un error en el sorteo. ¡Los duendes están borrachos! Inténtalo de nuevo.");
    }
  };

  const getAssignedUser = (): User | null => {
    if (!currentUser || !currentUser.assignedTo) return null;
    return state.users.find(u => u.id === currentUser.assignedTo) || null;
  };

  const assignedUser = getAssignedUser();

  // ----- RENDER COMPONENTS -----

  const renderLoginScreen = () => (
    <div className="flex flex-col items-center justify-center p-4 min-h-[80vh]">
        <div className="bg-white/95 p-8 rounded-2xl shadow-2xl max-w-md w-full border-4 border-yellow-400 text-center relative text-gray-800 animate-fade-in-up">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-6xl drop-shadow-lg">
            🎅
          </div>
          <h1 className="text-4xl text-red-700 font-bold mb-2 mt-8 christmas-font">
            Familia Fuertes
          </h1>
          <h2 className="text-xl text-green-700 font-bold mb-6">
            Amigo Invisible 2025
          </h2>
          
          {loginStep === 'select' && (
            <>
              <p className="mb-4 text-gray-700 font-semibold">¿Quién eres tú? ¡No mientas!</p>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {state.users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105 shadow-md border-b-4 border-green-800 text-sm"
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {(loginStep === 'create-password' || loginStep === 'enter-password' || loginStep === 'recovery-check' || loginStep === 'reset-password') && (
            <div className="animate-fade-in">
              <button 
                onClick={handleBackToSelect}
                className="absolute top-4 left-4 text-gray-500 hover:text-red-500 text-sm font-bold"
              >
                ← Volver
              </button>
              
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Hola, {state.users.find(u => u.id === selectedUserId)?.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {loginStep === 'create-password' && "Crea una contraseña secreta para proteger tu perfil."}
                {loginStep === 'enter-password' && "Introduce tu contraseña secreta."}
                {loginStep === 'recovery-check' && "Introduce la CLAVE MAESTRA de la familia."}
                {loginStep === 'reset-password' && "Escribe tu nueva contraseña personal."}
              </p>

              <input
                type={loginStep === 'recovery-check' ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={loginStep === 'create-password' || loginStep === 'reset-password' ? "Nueva contraseña" : (loginStep === 'recovery-check' ? "Clave Maestra" : "Tu contraseña")}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-4 text-gray-900 bg-white focus:outline-none focus:border-red-500"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              
              {loginError && (
                <p className="text-red-600 text-sm mb-4 font-bold">{loginError}</p>
              )}

              <button
                onClick={handlePasswordSubmit}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg transition"
              >
                {loginStep === 'create-password' ? "Guardar y Entrar" : 
                 loginStep === 'reset-password' ? "Restablecer y Entrar" :
                 loginStep === 'recovery-check' ? "Verificar" : "Entrar"}
              </button>

              {loginStep === 'enter-password' && (
                  <button
                    onClick={handleForgotPassword}
                    className="mt-4 text-xs text-gray-500 underline hover:text-red-600"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
              )}
            </div>
          )}

          {!musicPlaying && (
            <button 
                onClick={handleActivateMusic}
                className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-6 rounded-full shadow-lg border-2 border-yellow-600 animate-pulse transition-transform active:scale-95 text-sm"
            >
                🎵 ACTIVAR MÚSICA NAVIDEÑA
            </button>
          )}
        </div>
        
        {/* Simple installation hint */}
        <div className="mt-8 text-center text-white/80 text-xs px-8">
            <p>ℹ️ <strong>Para instalar:</strong> En iPhone pulsa "Compartir" y "Añadir a pantalla de inicio".</p>
        </div>
    </div>
  );

  const renderDashboardScreen = () => (
    <div className="flex flex-col items-center pb-20 w-full">
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 bg-black/40 p-3 rounded-xl backdrop-blur-sm border border-white/20">
        <div className="text-white">
          <h1 className="text-xl font-bold christmas-font">Hola, {currentUser!.name} 👋</h1>
          <p className="text-xs opacity-90">Navidades 2025</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={toggleMusic}
                className={`p-2 rounded-full transition text-white ${musicPlaying ? 'bg-green-600/50' : 'bg-red-600/50'}`}
                title={musicPlaying ? "Silenciar" : "Reproducir música"}
            >
                {musicPlaying ? '🔇' : '🎵'}
            </button>
            <button 
                onClick={handleLogout}
                className="bg-red-800 hover:bg-red-900 px-3 py-1 rounded-lg text-xs text-white transition font-bold border border-red-400"
            >
                Salir
            </button>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        
        {/* The Draw Section */}
        <section className="bg-gradient-to-br from-yellow-100 to-yellow-50 text-gray-800 p-6 rounded-xl shadow-xl border-4 border-yellow-400 border-dashed text-center relative">
          <h2 className="text-2xl font-bold mb-4 christmas-font text-yellow-800">
            EL SORTEO
          </h2>

          {!state.isDrawDone ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-800">¡Aún no se ha realizado el sorteo!</p>
              <p className="text-sm text-gray-600 italic">Si eres el primero en entrar (Erik, ¿eres tú?), tienes el honor de pulsar el botón.</p>
              <button
                onClick={handleStartDraw}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold py-4 px-8 rounded-full shadow-xl transform transition hover:scale-110 animate-bounce"
              >
                🎲 REALIZAR SORTEO
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg font-bold text-green-700">¡Ya tienes una misión!</p>
              <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 shadow-inner">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Debes hacer un regalo a:</p>
                {assignedUser ? (
                    <>
                        <p className="text-4xl font-black text-red-600 christmas-font animate-pulse my-4">
                        {assignedUser.name.toUpperCase()}
                        </p>
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                            <p className="text-gray-900 font-bold mb-1">🤫 ¡La lista de deseos es SECRETA!</p>
                            <p className="text-sm text-gray-600">
                                No puedes ver lo que ha pedido directamente. 
                                Baja un poco y habla con <strong>Rodolfo el Reno</strong>. 
                                Él leerá la carta por ti y te dará pistas divertidas sin arruinar la sorpresa.
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-red-500">Error: No tienes asignación.</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Wishlist Section */}
        <section className="bg-white text-gray-800 p-6 rounded-xl shadow-xl border-t-8 border-green-600 relative">
          <div className="absolute -top-5 -left-3 text-4xl transform -rotate-12">🎁</div>
          <h2 className="text-xl font-bold mb-2 text-center christmas-font text-red-700">Tu Carta a Santa</h2>
          <textarea
            value={wishlistInput}
            onChange={(e) => setWishlistInput(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-red-500 min-h-[80px] bg-gray-50 text-gray-900 placeholder-gray-400 text-sm"
            placeholder="Escribe aquí 3 cosas que te gustarían..."
          />
          <button
            onClick={handleUpdateWishlist}
            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition shadow-lg text-sm"
          >
            Guardar Deseos
          </button>
        </section>

      </div>

      {/* AI Bot Section */}
      {state.isDrawDone && assignedUser && (
        <Bot currentUser={currentUser!} targetUser={assignedUser} />
      )}

      {/* SHARE BUTTON */}
      {state.isDrawDone && (
          <div className="w-full max-w-md mt-8 px-4">
            <button 
                onClick={handleShareApp}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95 border-b-4 border-blue-800"
            >
                🔗 COMPARTIR APP CON LA FAMILIA
            </button>
            <p className="text-center text-xs text-white/70 mt-2">
                Pulsa para enviar el enlace al grupo. Al abrirlo, todos verán el resultado del sorteo automáticamente.
            </p>
          </div>
      )}

      <footer className="mt-12 text-white/60 text-xs text-center font-semibold pb-4">
        Familia Fuertes 2025 | Gemini AI
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen p-4 relative z-10 flex flex-col items-center overflow-hidden">
      <Snowfall />
      
      {/* 
        CRITICAL: This audio element is placed here so it is NEVER unmounted 
        when switching between Login and Dashboard screens.
        This fixes the music stopping issue.
      */}
      <audio 
        ref={audioRef} 
        loop 
        playsInline 
        src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Jingle_Bells_by_Kevin_MacLeod.ogg" 
      />

      {!currentUser ? renderLoginScreen() : renderDashboardScreen()}
    </div>
  );
};

export default App;
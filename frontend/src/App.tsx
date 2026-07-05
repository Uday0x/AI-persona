import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import type { PersonaId } from './lib/personas';

type View = 'landing' | 'chat';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [activePersona, setActivePersona] = useState<PersonaId>('hitesh');

  if (view === 'chat') {
    return (
      <ChatPage
        personaId={activePersona}
        onBack={() => setView('landing')}
      />
    );
  }

  return (
    <LandingPage
      onOpenChat={(personaId) => {
        if (personaId) {
          setActivePersona(personaId);
        }
        setView('chat');
      }}
    />
  );
}
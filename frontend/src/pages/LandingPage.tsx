import React from 'react';
import { PERSONAS, type PersonaId } from '../lib/personas';

interface LandingPageProps {
  onOpenChat: (personaId?: PersonaId) => void;
}

function PersonaCard({
  title,
  accent,
  image,
  tagline,
  points,
  onOpen,
}: {
  title: string;
  accent: string;
  image?: string;
  tagline: string;
  points: string[];
  onOpen: () => void;
}) {
  return (
    <article className={`persona-card persona-${accent}`}>
      <div className="persona-top">
        <span className="persona-tag persona-tag-with-icon">
          <span className={`persona-tag-icon persona-tag-icon-${accent}`} />
          {title}
        </span>
        <span className="persona-chip">AI teacher persona</span>
      </div>
      <div className="persona-profile">
        <div className={`persona-portrait persona-portrait-${accent}`} aria-hidden="true">
          {image ? <img src={image} alt="" /> : <span className="avatar-letter">{title === 'Hitesh Sir' ? 'HC' : 'PG'}</span>}
        </div>
        <div>
          <h3>{tagline}</h3>
          <p>{points[0]}</p>
        </div>
      </div>
      <div className="persona-meta">
        {points.slice(1).map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>
      <button type="button" className="button secondary persona-open-btn" onClick={onOpen}>
        Open {title} chat
      </button>
    </article>
  );
}

export default function LandingPage({ onOpenChat }: LandingPageProps) {
  return (
    <div className="page-shell">
      <div className="bg-glow bg-glow-left" />
      <div className="bg-glow bg-glow-right" />

      <div className="app-shell landing-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark brand-mark-logo" aria-hidden="true">
              <span className="brand-mark-core" />
              <span className="brand-mark-ring brand-mark-ring-one" />
              <span className="brand-mark-ring brand-mark-ring-two" />
            </div>
            <div>
              <p>Persona AI</p>
              <span>Teach with Hitesh Sir and Piyush Sir</span>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="ghost-link" type="button" onClick={() => onOpenChat('hitesh')}>
              Hitesh Chat
            </button>
            <button className="ghost-link" type="button" onClick={() => onOpenChat('piyush')}>
              Piyush Chat
            </button>
          </div>
        </header>

        <section className="hero hero-landing">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-landing">Two authentic teacher personas. One clean learning experience.</div>
            <h1>Chai, clarity, and two distinct teaching voices.</h1>
            <p>
              Persona AI feels like a premium learning studio. Hitesh Sir stays warm, practical, and beginner-friendly. Piyush Sir stays architecture-first and product-minded.
            </p>
            <div className="hero-actions">
              <button className="button primary" type="button" onClick={() => onOpenChat('hitesh')}>
                Start with Hitesh Sir
              </button>
              <button className="button secondary" type="button" onClick={() => onOpenChat('piyush')}>
                Open Piyush Sir
              </button>
            </div>
          </div>

          <div className="hero-visual hero-landing-visual">
            <div className="hero-panel hero-panel-main">
              <div className="panel-badge panel-badge-subtle">Built for learners who like clean explanations</div>
              <h2>Pick the persona, then jump into the conversation.</h2>
              <p>
                No clutter. No mixed voices. Just one clear persona at a time, with a dedicated chat screen behind it.
              </p>
              <div className="mini-chip-row">
                <span>Mentor voice</span>
                <span>Separate chats</span>
                <span>Orange chai theme</span>
              </div>
            </div>
          </div>
        </section>

        <section className="persona-grid landing-persona-grid">
          <PersonaCard
            title={PERSONAS.hitesh.label}
            accent={PERSONAS.hitesh.accent}
            image={PERSONAS.hitesh.image}
            tagline="Teaching-first, project-first, chai-first."
            points={['Warm Hinglish. Fundamentals first. Beginner friendly.', 'JS', 'React', 'Node', 'GenAI']}
            onOpen={() => onOpenChat('hitesh')}
          />
          <PersonaCard
            title={PERSONAS.piyush.label}
            accent={PERSONAS.piyush.accent}
            image={PERSONAS.piyush.image}
            tagline="Modern product thinking with real-world tradeoffs."
            points={['Architecture-first. Confident. Production-minded.', 'Next.js', 'Docker', 'RAG', 'Agents']}
            onOpen={() => onOpenChat('piyush')}
          />
        </section>

        <section className="landing-note-card">
          <div className="persona-card persona-note">
            <div className="persona-top">
              <span className="persona-tag">Why two personas?</span>
              <span className="persona-chip">Separate learning modes</span>
            </div>
            <p>
              Hitesh Sir is the fundamentals coach. Piyush Sir is the architecture coach. You choose on the landing page, then switch inside the chat room whenever you want a different teaching style.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
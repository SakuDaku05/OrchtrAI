import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #fafafa;
    --text-primary: #000000;
    --text-secondary: #555555;
    --border: #f0f0f0;
    --accent: #000000;
  }

  body {
    background: var(--bg-primary);
    margin: 0;
    padding: 0;
    width: 100vw;
    overflow-x: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .lp-root {
    width: 100%;
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    position: relative;
  }

  /* Lamp / Glow Effect Top */
  .lp-lamp-container {
    position: absolute; top: 0; left: 0; right: 0; height: 600px;
    z-index: 0; overflow: hidden; pointer-events: none;
  }
  .lp-lamp {
    position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
    width: 1000px; height: 400px;
    background: radial-gradient(circle at 50% 0%, rgba(0,0,0,0.03) 0%, transparent 60%);
    filter: blur(60px); opacity: 0.8;
  }

  /* NAV */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 60px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    transition: all 0.3s;
  }
  .lp-nav.scrolled { padding: 16px 60px; border-bottom: 1px solid var(--border); }
  .lp-logo { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -1px; }
  .lp-nav-links { display: flex; gap: 40px; }
  .lp-nav-link { font-size: 14px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: color 0.2s; }
  .lp-nav-link:hover { color: var(--text-primary); }
  .lp-nav-cta {
    background: var(--text-primary); color: #fff; border: none; border-radius: 6px;
    padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .lp-nav-cta:hover { opacity: 0.8; transform: translateY(-1px); }

  /* HERO */
  .lp-hero {
    position: relative; z-index: 1; padding: 160px 24px 100px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .lp-hero-tag {
    font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;
    color: var(--text-secondary); margin-bottom: 24px;
  }
  .lp-hero-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(40px, 8vw, 100px); font-weight: 900; line-height: 0.95;
    letter-spacing: -4px; margin-bottom: 32px; color: var(--text-primary);
  }
  .lp-hero-desc {
    font-size: clamp(16px, 1.5vw, 19px); font-weight: 400; color: var(--text-secondary);
    max-width: 700px; line-height: 1.6; margin-bottom: 50px;
  }
  .lp-hero-btns { display: flex; gap: 16px; }
  .lp-btn-black {
    background: #000; color: #fff; padding: 18px 40px; border-radius: 8px;
    font-size: 16px; font-weight: 600; border: none; cursor: pointer; transition: 0.3s;
  }
  .lp-btn-black:hover { background: #333; transform: scale(1.02); }
  .lp-btn-white {
    background: #fff; color: #000; padding: 18px 40px; border-radius: 8px;
    font-size: 16px; font-weight: 600; border: 1px solid var(--border); cursor: pointer; transition: 0.3s;
  }
  .lp-btn-white:hover { background: var(--bg-secondary); }

  /* Bento Sections */
  .lp-section { padding: 80px 60px; max-width: 1440px; margin: 0 auto; width: 100%; }
  .lp-grid-layout {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 60px;
  }
  .lp-card {
    background: #fff; border: 1px solid var(--border); border-radius: 20px;
    padding: 40px; transition: 0.3s;
  }
  .lp-card:hover { border-color: #000; box-shadow: 0 20px 40px rgba(0,0,0,0.03); }
  .lp-card-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
  .lp-card-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }

  /* Large Feature Block */
  .lp-large-feature {
    display: flex; align-items: center; gap: 80px; padding: 120px 60px; max-width: 1440px; margin: 0 auto;
  }
  .lp-feature-text { flex: 1; }
  .lp-feature-visual { flex: 1.2; background: var(--bg-secondary); height: 500px; border-radius: 30px; border: 1px solid var(--border); position: relative; overflow: hidden;}
  .lp-feature-label { font-size: 14px; font-weight: 700; color: var(--text-secondary); margin-bottom: 16px; }
  .lp-feature-h2 { font-size: 48px; font-weight: 800; letter-spacing: -2px; margin-bottom: 24px; line-height: 1.1; }
  .lp-feature-p { font-size: 18px; color: var(--text-secondary); line-height: 1.6; }

  /* Footer Minimalist */
  .lp-footer {
    padding: 80px 60px; border-top: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .lp-footer-left { display: flex; flex-direction: column; gap: 24px; }
  .lp-footer-right { display: flex; gap: 80px; }
  .lp-footer-col { display: flex; flex-direction: column; gap: 12px; }
  .lp-footer-head { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  .lp-footer-link { font-size: 13px; color: var(--text-secondary); text-decoration: none; cursor: pointer; }
  .lp-footer-link:hover { color: #000; }

  /* Calendar Mockup */
  .lp-calendar {
    flex: 1.2; background: #fff; border: 1px solid var(--border);
    border-radius: 24px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.02);
    display: flex; flex-direction: column; gap: 24px;
  }
  .lp-cal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px;}
  .lp-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
  .lp-cal-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #999; border-radius: 8px; }
  .lp-cal-day.active { background: #000; color: #fff; font-weight: 700; position: relative; }
  .lp-cal-badge { position: absolute; top: -30px; right: -50px; background: #fff; border: 1px solid #000; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; color: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 140px; text-align: left; }

  @media (max-width: 1024px) {
    .lp-nav { padding: 20px 32px; }
    .lp-section { padding: 60px 24px; }
    .lp-grid-layout { grid-template-columns: 1fr; }
    .lp-large-feature { flex-direction: column; gap: 40px; padding: 60px 24px; }
    .lp-feature-visual { width: 100%; height: 350px; }
    .lp-hero-title { font-size: 60px; }
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp-root">
      <style>{css}</style>

      <div className="lp-lamp-container">
        <div className="lp-lamp" />
      </div>

      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-logo">ORCHESTRAI.</div>
        <div className="lp-nav-links">
          <span className="lp-nav-link">Product</span>
          <span className="lp-nav-link">Infrastructure</span>
          <span className="lp-nav-link">Security</span>
          <span className="lp-nav-link">Pricing</span>
        </div>
        <button className="lp-nav-cta" onClick={() => navigate('/app')}>Get Started</button>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-tag">Intelligent Multi-Agent Workflows</div>
        <h1 className="lp-hero-title">
          Build without<br />boundaries.
        </h1>
        <p className="lp-hero-desc">
          OrchestrAI is the first multi-agent platform designed for professional coordination. Plan, research, and execute complex operations with an autonomous crew of specialized agents.
        </p>
        <div className="lp-hero-btns">
          <button className="lp-btn-black" onClick={() => navigate('/app')}>Explore Platform</button>
          <button className="lp-btn-white">Read Whitepaper</button>
        </div>
      </section>

      <section className="lp-section">
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>Engineered for scale.</h2>
        </div>
        <div className="lp-grid-layout">
          <div className="lp-card">
            <div className="lp-card-title">Dynamic Orchestration</div>
            <p className="lp-card-desc">Our proprietary protocol routes tasks to specialized agents in real-time based on mission objectives.</p>
          </div>
          <div className="lp-card">
            <div className="lp-card-title">Real-time Intelligence</div>
            <p className="lp-card-desc">Deeply integrated with Serper and Groq for sub-second facts and lightning-fast inference.</p>
          </div>
          <div className="lp-card">
            <div className="lp-card-title">Private Doc Indexing</div>
            <p className="lp-card-desc">Enterprise-grade RAG with vector search on Azure Cosmos DB for secure retrieval.</p>
          </div>
        </div>
      </section >

      <section className="lp-large-feature">
        <div className="lp-feature-text">
          <div className="lp-feature-label">GOVERNANCE</div>
          <h2 className="lp-feature-h2">Human-led,<br />Agent-executed.</h2>
          <p className="lp-feature-p">
            We believe in transparency. Review every agent thought, verify every tool call, and approve every critical step. You retain total control while agents handle the heavy lifting.
          </p>
          <button className="lp-btn-black" style={{ marginTop: '32px' }}>Learn more about HITL</button>
        </div>
        <div className="lp-feature-visual">
          <div style={{ position: 'absolute', inset: '40px', border: '1px solid #e0e0e0', borderRadius: '12px', background: '#fff', padding: '24px' }}>
            <div style={{ width: '40%', height: '14px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '32px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '100%', height: '10px', background: '#f5f5f5', borderRadius: '4px' }} />
              <div style={{ width: '90%', height: '10px', background: '#f5f5f5', borderRadius: '4px' }} />
              <div style={{ width: '95%', height: '10px', background: '#f5f5f5', borderRadius: '4px' }} />
              <div style={{ width: '30%', height: '24px', background: '#000', borderRadius: '4px', marginTop: '20px' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="lp-large-feature" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="lp-calendar">
          <div className="lp-cal-header">
            <div style={{ fontWeight: 800, fontSize: '18px' }}>March 2025</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</div>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</div>
            </div>
          </div>
          <div className="lp-cal-grid">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d} style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', color: '#ccc' }}>{d}</div>)}
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className={`lp-cal-day ${i + 1 === 4 ? 'active' : ''}`}>
                {i + 1}
                {i + 1 === 4 && (
                  <div className="lp-cal-badge">
                    <div style={{ fontSize: '9px', opacity: 0.6, marginBottom: '2px' }}>PROMPT</div>
                    "Schedule a meeting on the 4th"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="lp-feature-text" style={{ textAlign: 'right' }}>
          <div className="lp-feature-label">AUTONOMOUS SCHEDULING</div>
          <h2 className="lp-feature-h2">Calendar Management,<br />Perfected.</h2>
          <p className="lp-feature-p">
            OrchestrAI agents interpret conversational intent to manage your time. From "Book dinner on Friday" to "Schedule a meeting on the 4th", our agents handle slots, invites, and follow-ups automatically.
          </p>
          <button className="lp-btn-black" style={{ marginTop: '32px' }}>Connect Cal.com →</button>
        </div>
      </section>

      <section className="lp-section" style={{ background: '#000', color: '#fff', borderRadius: '40px', textAlign: 'center', marginBottom: '100px', maxWidth: '1320px' }}>
        <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '24px' }}>The future is mult-agent.</h2>
        <p style={{ fontSize: '18px', color: '#888', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>Join the companies building the next generation of autonomous workflows on OrchestrAI.</p>
        <button className="lp-btn-black" style={{ background: '#fff', color: '#000' }} onClick={() => navigate('/app')}>Get Started Now</button>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-left">
          <div className="lp-logo">ORCHESTRAI.</div>
          <div style={{ fontSize: '14px', color: '#888' }}>© 2025 OrchestrAI Platforms Inc.</div>
        </div>
        <div className="lp-footer-right">
          <div className="lp-footer-col">
            <div className="lp-footer-head">Company</div>
            <span className="lp-footer-link">About</span>
            <span className="lp-footer-link">Blog</span>
            <span className="lp-footer-link">Careers</span>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-head">Resources</div>
            <span className="lp-footer-link">Documentation</span>
            <span className="lp-footer-link">API Reference</span>
            <span className="lp-footer-link">Support</span>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-head">Legal</div>
            <span className="lp-footer-link">Privacy Policy</span>
            <span className="lp-footer-link">Terms of Service</span>
            <span className="lp-footer-link">Cookie Policy</span>
          </div>
        </div>
      </footer>
    </div >
  );
}

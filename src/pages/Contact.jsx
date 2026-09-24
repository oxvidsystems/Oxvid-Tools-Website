import { toast } from '../core/engine-core.js';
import { useSEO } from '../hooks/useSEO.js';

export default function Contact() {
  useSEO({
    title: 'Contact',
    description: 'Get in touch with Oxvid Tools — report a bug or suggest a tool for the roadmap.',
    path: '/contact',
  });

  function handleSubmit(e) {
    e.preventDefault();
    toast('This is a prototype — connect a real form handler to send messages.');
  }

  return (
    <div className="container section" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Contact</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 22 }}>
        Found a bug in a tool, or want to suggest one for the roadmap? This form is a UI
        demonstration in the prototype — wire it to a real endpoint before launch.
      </p>
      <form className="card" style={{ padding: 20 }} onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input type="text" required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea rows={5} required style={{ fontFamily: 'var(--font-body)' }} />
        </div>
        <button className="btn btn-primary" type="submit">
          Send message
        </button>
      </form>
    </div>
  );
}

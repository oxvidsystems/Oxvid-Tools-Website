import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TOOLS,
  TOOL_BY_SLUG,
  CATEGORIES,
  isLive,
  PLATFORM_META,
  KW_COUNTRIES,
  KW_LANGS,
  svgIcon,
} from '../core/engine.js';
import SearchBox from '../components/SearchBox.jsx';
import PlatformBadge from '../components/PlatformBadge.jsx';
import Section from '../components/Section.jsx';
import { SectionHead } from '../components/Section.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import { useSEO, SITE_URL } from '../hooks/useSEO.js';

const SHORTCUT_SLUGS = [
  'word-counter',
  'json-formatter',
  'image-compress',
  'password-generator',
  'percentage-calculator',
  'color-contrast-checker',
  'qr-code-generator',
  'invoice-generator',
];

const VALUE_PROPS = [
  [
    'No fake processing',
    'Every live tool listed here genuinely runs the operation in your browser — no spinners for effect, no simulated results.',
  ],
  [
    'Privacy by default',
    'Text and file tools process on your device wherever practical, instead of uploading to a server.',
  ],
  [
    'Consistent by design',
    "Every tool page follows the same layout, so once you've used one, you already know how to use the next 144.",
  ],
  [
    'Built to grow',
    "A single typed registry drives search, categories and SEO — adding tool 146 doesn't mean rebuilding the site.",
  ],
];

const HOME_FAQ = [
  ['Do I need to create an account?', 'No. Every tool is available immediately with no sign-up.'],
  ['Are the tools really free?', 'Yes, all 146 live tools are free to use with no hidden limits.'],
  [
    'Is my data safe?',
    'Text and image tools process in your browser wherever possible, so your content generally never leaves your device for those tools.',
  ],
  [
    'What does "Coming soon" mean?',
    "Right now, just one tool — the live HTTP status checker — needs a server this static page genuinely doesn't have. It's listed honestly rather than faked.",
  ],
];

export default function Home() {
  const navigate = useNavigate();
  const [kwActive, setKwActive] = useState('Bing');
  const [kwQuery, setKwQuery] = useState('');
  const [kwType, setKwType] = useState('all');
  const [kwCountry, setKwCountry] = useState('global');
  const [kwLang, setKwLang] = useState('en');

  useSEO({
    title: 'Oxvid Tools — Fast, trustworthy utilities',
    description:
      '146 genuinely functional tools for documents, images, text, code, numbers and design. No sign-up, no clutter, just tools that work.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Oxvid Tools',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/tools?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  });

  function goToKwTool() {
    const q = encodeURIComponent(kwQuery.trim() || 'coffee subscription');
    navigate(`/tool/keyword-suggestion-generator?q=${q}&platform=${encodeURIComponent(kwActive)}`);
  }

  const stats = [
    [TOOLS.length, 'tools in the registry'],
    [TOOLS.filter(isLive).length, 'working right now'],
    [CATEGORIES.length, 'categories'],
    [0, 'sign-ups required'],
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-orb o1" />
        <div className="hero-orb o2" />
        <div className="hero-orb o3" />
        <div className="container">
          <div className="hero-eyebrow">
            <span className="dot" />
            145 tools live · 1 more on the roadmap
          </div>
          <h1>
            Utilities that <span className="grad">work the first time</span>, every time.
          </h1>
          <p className="lede">
            Documents, images, text, code, numbers and design — one fast, uncluttered workspace
            with no sign-up and no fake "processing" screens.
          </p>
          <SearchBox
            className="hero-search"
            placeholder="Try “compress image”, “json formatter”, “bmi”…"
          />
          <div className="hero-shortcuts">
            {SHORTCUT_SLUGS.map((slug) => (
              <Link key={slug} className="chip" to={`/tool/${slug}`}>
                {TOOL_BY_SLUG[slug].name}
              </Link>
            ))}
          </div>
          <div className="hero-stats">
            {stats.map(([n, l]) => (
              <div className="stat" key={l}>
                <b className="count-up" data-target={n}>
                  0
                </b>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div className="kw-dark-panel">
              <h2>Research Keywords Using {kwActive} Autocomplete</h2>
              <div className="kw-platform-row">
                {Object.keys(PLATFORM_META).map((name) => (
                  <div
                    key={name}
                    className={`kw-platform-tab${name === kwActive ? ' active' : ''}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => setKwActive(name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setKwActive(name);
                      }
                    }}
                  >
                    <PlatformBadge name={name} size={22} />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
              <div className="kw-searchbar">
                <select value={kwType} onChange={(e) => setKwType(e.target.value)}>
                  <option value="all">All</option>
                  <option value="platform">Platform</option>
                  <option value="questions">Questions</option>
                  <option value="prepositions">Prepositions</option>
                  <option value="alphabet">A–Z</option>
                </select>
                <input
                  type="text"
                  placeholder="Type a keyword and press enter"
                  value={kwQuery}
                  onChange={(e) => setKwQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') goToKwTool();
                  }}
                />
                <select value={kwCountry} onChange={(e) => setKwCountry(e.target.value)}>
                  {Object.entries(KW_COUNTRIES).map(([v, c]) => (
                    <option key={v} value={v}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select value={kwLang} onChange={(e) => setKwLang(e.target.value)}>
                  {Object.entries(KW_LANGS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={goToKwTool}
                  dangerouslySetInnerHTML={{ __html: svgIcon('search') }}
                />
              </div>
            </div>
            <div
              style={{
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: 'var(--panel)',
              }}
            >
              <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 520 }}>
                Expand any seed keyword into long-tail ideas across 15 platforms — questions,
                comparisons, A–Z patterns and platform-specific intent, all in one workspace.
              </p>
              <Link className="btn btn-primary" to="/tool/keyword-suggestion-generator">
                Open the full keyword tool →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section
        title="Popular tools"
        sub="What people reach for most."
        tools={TOOLS.filter((t) => t.popular).slice(0, 8)}
        viewAllHref="/tools?f=popular"
      />

      <section className="section tight">
        <div className="container">
          <SectionHead
            title="Browse by category"
            sub="Every tool belongs to one clear category."
            href="/categories"
          />
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <CategoryCard key={c.key} category={c} />
            ))}
          </div>
        </div>
      </section>

      <Section
        title="Featured tools"
        sub="A closer look at a few of the best-built tools on the platform."
        tools={TOOLS.filter((t) => t.featured)}
        viewAllHref="/tools"
      />

      <Section
        title="Recently added"
        sub="The newest tools in the registry."
        tools={TOOLS.slice(-8)}
        viewAllHref="/tools?f=new"
      />

      <section className="section tight">
        <div className="container">
          <h2 style={{ fontSize: 22, marginBottom: 18 }}>
            Built to be trusted, not just tried once
          </h2>
          <div className="tool-grid">
            {VALUE_PROPS.map(([t, d]) => (
              <div className="card" style={{ padding: 18 }} key={t}>
                <h3 style={{ fontSize: 15, marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                  {t}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Frequently asked questions</h2>
          <div>
            {HOME_FAQ.map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container cta-banner">
          <div>
            <h2 style={{ fontSize: 22, color: '#fff' }}>Find the tool you need in seconds.</h2>
            <p style={{ color: 'rgba(255,255,255,0.82)', marginTop: 6, fontSize: 14 }}>
              Browse the full directory or search from any page.
            </p>
          </div>
          <Link className="btn cta-btn" to="/tools">
            Browse all tools
          </Link>
        </div>
      </section>
    </>
  );
}

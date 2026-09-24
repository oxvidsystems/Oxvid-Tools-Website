import { Link, useParams } from 'react-router-dom';
import {
  TOOL_BY_SLUG,
  CAT_BY_KEY,
  isLive,
  genHowTo,
  genFeatures,
  genFaq,
  relatedTools,
} from '../core/engine-core.js';
import ToolWorkspace from '../components/ToolWorkspace.jsx';
import ToolCard from '../components/ToolCard.jsx';
import NotFound from './NotFound.jsx';
import { useSEO, SITE_URL } from '../hooks/useSEO.js';

export default function ToolPage() {
  const { slug } = useParams();
  const tool = TOOL_BY_SLUG[slug];
  const cat = tool ? CAT_BY_KEY[tool.category] : null;
  const live = tool ? isLive(tool) : false;
  const faq = tool ? genFaq(tool) : [];

  useSEO({
    title: tool ? tool.name : 'Tool not found',
    description: tool ? tool.description : undefined,
    path: tool ? `/tool/${tool.slug}` : `/tool/${slug}`,
    noindex: !tool,
    jsonLd: tool
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SoftwareApplication',
              name: tool.name,
              description: tool.description,
              url: `${SITE_URL}/tool/${tool.slug}`,
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Any (runs in the browser)',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
              '@type': 'FAQPage',
              mainEntity: faq.map(([q, a]) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: cat.name,
                  item: `${SITE_URL}/category/${cat.key}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: tool.name,
                  item: `${SITE_URL}/tool/${tool.slug}`,
                },
              ],
            },
          ],
        }
      : undefined,
  });

  if (!tool) return <NotFound />;

  return (
    <>
      <div className="container tool-head">
        <div className="crumb">
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <Link to={`/category/${cat.key}`}>{cat.name}</Link>
          <span className="sep">/</span>
          {tool.name}
        </div>
        <h1>{tool.name}</h1>
        <p className="desc">{tool.description}</p>
        <div className="badges">
          <span className="tag">{cat.name}</span>
          {tool.popular && <span className="tag popular">Popular</span>}
          {tool.featured && <span className="tag featured">Featured</span>}
          {!live && <span className="tag soon">Coming soon</span>}
        </div>
      </div>

      <div className="container">
        <ToolWorkspace key={tool.slug} tool={tool} />
      </div>

      <div className="container tool-info">
        <div>
          <h2>How to use {tool.name}</h2>
          <ol className="howto-list">
            {genHowTo(tool).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <h2 style={{ marginTop: 30 }}>Frequently asked questions</h2>
          {faq.map(([q, a], i) => (
            <details className="faq-item" key={i}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <div>
          <h2>Features</h2>
          <ul className="feat-list">
            {genFeatures(tool).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <h2 style={{ marginTop: 26 }}>Related tools</h2>
          <div className="related-grid">
            {relatedTools(tool).map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 60 }} />
    </>
  );
}

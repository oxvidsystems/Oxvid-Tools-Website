import { Link, useParams } from 'react-router-dom';
import { BLOG_POST_BY_SLUG } from '../data/blogPosts.js';
import { useSEO, SITE_URL } from '../hooks/useSEO.js';
import NotFound from './NotFound.jsx';

export default function BlogPost() {
  const { slug } = useParams();
  const post = BLOG_POST_BY_SLUG[slug];

  useSEO({
    title: post ? post.title : 'Post not found',
    description: post ? post.description : undefined,
    path: post ? `/blog/${post.slug}` : `/blog/${slug}`,
    type: 'article',
    noindex: !post,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          url: `${SITE_URL}/blog/${post.slug}`,
          author: { '@type': 'Organization', name: 'Oxvid Systems' },
          publisher: { '@type': 'Organization', name: 'Oxvid Tools' },
        }
      : undefined,
  });

  if (!post) return <NotFound />;

  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <div className="crumb">
        <Link to="/">Home</Link>
        <span className="sep">/</span>
        <Link to="/blog">Blog</Link>
        <span className="sep">/</span>
        {post.title}
      </div>
      <h1 style={{ fontSize: 30, marginTop: 14, marginBottom: 8 }}>{post.title}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 28 }}>
        {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        {' · '}
        {post.readingMinutes} min read
      </p>
      <div
        className="static-copy"
        style={{ color: 'var(--ink)', fontSize: 15, lineHeight: 1.75 }}
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
      <div
        className="card"
        style={{ padding: 20, marginTop: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          Ready to try it? <b>{post.toolLabel}</b> is free, runs in your browser, and takes seconds.
        </p>
        <Link className="btn btn-primary" to={`/tool/${post.toolSlug}`}>
          Open {post.toolLabel} →
        </Link>
      </div>
    </div>
  );
}

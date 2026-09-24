import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts.js';
import { useSEO } from '../hooks/useSEO.js';

export default function Blog() {
  useSEO({
    title: 'Blog',
    description:
      'Guides on PDFs, JSON, QR codes, passwords and more from Oxvid Tools — practical answers, not filler, each tied to a free tool you can use right away.',
    path: '/blog',
  });

  return (
    <>
      <div className="page-head container">
        <h1>Blog</h1>
        <p>Practical guides behind the tools — what actually matters, explained simply.</p>
      </div>
      <div className="container section tight">
        <div className="tool-grid">
          {BLOG_POSTS.map((post) => (
            <Link className="tool-card" key={post.slug} to={`/blog/${post.slug}`}>
              <h3>{post.title}</h3>
              <p className="desc">{post.description}</p>
              <div className="meta">
                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="tag">{post.readingMinutes} min read</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

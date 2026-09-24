import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts.js';
import { CATEGORIES } from '../core/engine-core.js';

// Mega-menu panel for the header's "Blog" nav item. Unlike the Tools menu,
// this only lists content that actually exists: the real published guides,
// plus a shortcut list of tool categories. No invented sections or dead
// links just to fill out a grid.
export default function BlogMegaMenu({ onNavigate }) {
  return (
    <div className="mega-menu blog-mega">
      <div className="mega-grid">
        <div className="mega-col mega-col-wide">
          <div className="mega-col-head">
            <span>Latest guides</span>
          </div>
          <ul>
            {BLOG_POSTS.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`} onClick={onNavigate}>
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link className="mega-view-all" to="/blog" onClick={onNavigate}>
            View all articles →
          </Link>
        </div>
        <div className="mega-col">
          <div className="mega-col-head">
            <span>Browse by category</span>
          </div>
          <ul>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <li key={cat.key}>
                <Link to={`/category/${cat.key}`} onClick={onNavigate}>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mega-footer">
        <Link to="/tools" onClick={onNavigate}>
          Or browse the full directory of 146 tools →
        </Link>
      </div>
    </div>
  );
}

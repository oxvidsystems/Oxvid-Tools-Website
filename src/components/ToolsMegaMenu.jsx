import { Link } from 'react-router-dom';
import { CATEGORIES, toolsInCategory, svgIcon } from '../core/engine-core.js';

// Mega-menu panel for the header's "Tools" nav item: one column per
// category, each showing its top tools (popular first) plus a "View all"
// link, so the whole registry is browsable from any page in one click.
export default function ToolsMegaMenu({ onNavigate }) {
  return (
    <div className="mega-menu tools-mega">
      <div className="mega-grid">
        {CATEGORIES.map((cat) => {
          const tools = toolsInCategory(cat.key)
            .slice()
            .sort((a, b) => b.popular - a.popular || b.featured - a.featured)
            .slice(0, 5);
          return (
            <div className="mega-col" key={cat.key}>
              <div className="mega-col-head">
                <span className="mega-col-icon" dangerouslySetInnerHTML={{ __html: svgIcon(cat.key) }} />
                <Link to={`/category/${cat.key}`} onClick={onNavigate}>
                  {cat.name}
                </Link>
              </div>
              <ul>
                {tools.map((t) => (
                  <li key={t.slug}>
                    <Link to={`/tool/${t.slug}`} onClick={onNavigate}>
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="mega-view-all" to={`/category/${cat.key}`} onClick={onNavigate}>
                View all {toolsInCategory(cat.key).length} →
              </Link>
            </div>
          );
        })}
      </div>
      <div className="mega-footer">
        <Link to="/tools" onClick={onNavigate}>
          Browse the full directory of 146 tools →
        </Link>
      </div>
    </div>
  );
}

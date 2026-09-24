import { CATEGORIES } from '../core/engine-core.js';
import CategoryCard from '../components/CategoryCard.jsx';
import { useSEO } from '../hooks/useSEO.js';

export default function Categories() {
  useSEO({
    title: 'Categories',
    description:
      'Browse all 146 Oxvid Tools by category: PDF & Documents, Image Tools, Text & Writing, Developer Tools, Calculators, SEO & Web, Finance & Business, Generators and Color & Design.',
    path: '/categories',
  });

  return (
    <>
      <div className="page-head container">
        <h1>Categories</h1>
        <p>Every tool on Oxvid Tools belongs to exactly one of these nine categories.</p>
      </div>
      <div className="container section tight">
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.key} category={c} />
          ))}
        </div>
      </div>
    </>
  );
}

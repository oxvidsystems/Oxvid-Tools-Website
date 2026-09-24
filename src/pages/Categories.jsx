import { useEffect } from 'react';
import { CATEGORIES } from '../core/engine.js';
import CategoryCard from '../components/CategoryCard.jsx';

export default function Categories() {
  useEffect(() => {
    document.title = 'Categories — Oxvid Tools';
  }, []);

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

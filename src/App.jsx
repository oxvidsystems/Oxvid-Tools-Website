import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useCardTilt } from './hooks/useVisualEffects.js';

// Route-level code splitting: each page (and the shared tool engine most of
// them pull in) ships as its own chunk, fetched only when that route is
// visited, instead of one bundle containing every page up front.
const Home = lazy(() => import('./pages/Home.jsx'));
const Categories = lazy(() => import('./pages/Categories.jsx'));
const Category = lazy(() => import('./pages/Category.jsx'));
const AllTools = lazy(() => import('./pages/AllTools.jsx'));
const ToolPage = lazy(() => import('./pages/ToolPage.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  useCardTilt();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tools" element={<AllTools />} />
          <Route path="categories" element={<Categories />} />
          <Route path="category/:key" element={<Category />} />
          <Route path="tool/:slug" element={<ToolPage />} />
          <Route path="about" element={<About />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Categories from './pages/Categories.jsx';
import Category from './pages/Category.jsx';
import AllTools from './pages/AllTools.jsx';
import ToolPage from './pages/ToolPage.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import NotFound from './pages/NotFound.jsx';
import { useCardTilt } from './hooks/useVisualEffects.js';

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
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

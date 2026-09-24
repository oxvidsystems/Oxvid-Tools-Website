import StaticPage from './StaticPage.jsx';
import { ABOUT_COPY } from '../data/staticCopy.js';

export default function About() {
  return (
    <StaticPage
      title="About Oxvid Tools"
      htmlCopy={ABOUT_COPY}
      description="Oxvid Tools is a single, consistent home for everyday utilities — 146 tools for documents, images, text, code, numbers and design, with no sign-up and no fake results."
      path="/about"
    />
  );
}

import StaticPage from './StaticPage.jsx';
import { ABOUT_COPY } from '../data/staticCopy.js';

export default function About() {
  return <StaticPage title="About Oxvid Tools" htmlCopy={ABOUT_COPY} />;
}

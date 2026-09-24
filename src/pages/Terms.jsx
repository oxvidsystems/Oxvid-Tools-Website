import StaticPage from './StaticPage.jsx';
import { TERMS_COPY } from '../data/staticCopy.js';

export default function Terms() {
  return <StaticPage title="Terms of Service" htmlCopy={TERMS_COPY} />;
}

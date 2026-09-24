import StaticPage from './StaticPage.jsx';
import { PRIVACY_COPY } from '../data/staticCopy.js';

export default function Privacy() {
  return (
    <StaticPage
      title="Privacy Policy"
      htmlCopy={PRIVACY_COPY}
      description="How Oxvid Tools handles your data: most tools run entirely in your browser, and what's stored locally."
      path="/privacy"
    />
  );
}

import { useEffect, useRef } from 'react';
import { isLive, renderSoon } from '../core/engine-core.js';

// Mounts one of the 145 imperative tool engines (calculators, canvas-based
// image editors, PDF tools via pdf-lib/pdf.js, text/dev utilities, etc.)
// into a plain DOM container. These engines predate this React port and are
// preserved unchanged for behavioral fidelity — this component is the only
// bridge between them and React, matching the original PageTool()'s
// try/catch-into-renderSoon behavior.
//
// Each tool category ships as its own chunk (src/core/engine-<category>.js,
// see scripts/split-engine.mjs) and is fetched only when a tool from that
// category is actually opened, instead of bundling all 145 tools up front.
export default function ToolWorkspace({ tool }) {
  const ref = useRef(null);

  useEffect(() => {
    const ws = ref.current;
    if (!ws) return undefined;
    ws.innerHTML = '';
    let cancelled = false;

    if (!isLive(tool)) {
      renderSoon(ws, tool, false);
      return () => {
        ws.innerHTML = '';
      };
    }

    import(`../core/engine-${tool.category}.js`)
      .then((mod) => {
        if (cancelled) return;
        const fn = mod.DISPATCH[tool.id];
        if (!fn) {
          renderSoon(ws, tool, false);
          return;
        }
        try {
          fn(ws, tool);
        } catch (err) {
          console.error(err);
          ws.innerHTML = '';
          renderSoon(ws, tool, true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        renderSoon(ws, tool, true);
      });

    return () => {
      cancelled = true;
      ws.innerHTML = '';
    };
  }, [tool]);

  return <div className="workspace" ref={ref} />;
}

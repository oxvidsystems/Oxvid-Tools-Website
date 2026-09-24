import { useEffect, useRef } from 'react';
import { DISPATCH, isLive, renderSoon } from '../core/engine.js';

// Mounts one of the 145 imperative tool engines (calculators, canvas-based
// image editors, PDF tools via pdf-lib/pdf.js, text/dev utilities, etc.)
// into a plain DOM container. These engines predate this React port and are
// preserved unchanged for behavioral fidelity — this component is the only
// bridge between them and React, matching the original PageTool()'s
// try/catch-into-renderSoon behavior.
export default function ToolWorkspace({ tool }) {
  const ref = useRef(null);

  useEffect(() => {
    const ws = ref.current;
    if (!ws) return undefined;
    ws.innerHTML = '';

    if (isLive(tool) && DISPATCH[tool.id]) {
      try {
        DISPATCH[tool.id](ws, tool);
      } catch (err) {
        console.error(err);
        ws.innerHTML = '';
        renderSoon(ws, tool, true);
      }
    } else {
      renderSoon(ws, tool, false);
    }

    return () => {
      ws.innerHTML = '';
    };
  }, [tool]);

  return <div className="workspace" ref={ref} />;
}

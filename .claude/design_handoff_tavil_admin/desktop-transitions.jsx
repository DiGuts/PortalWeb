// Page transition system for TAVIL Portal Desktop
// Two standards:
//   1. PAGE  — top-level sidebar pages. Soft fade + small vertical lift.
//   2. SUB   — subpage navigation (e.g. list → detail). Directional horizontal slide.
//
// Both share:
//   • Easing:   cubic-bezier(0.32, 0.72, 0.24, 1)  (corporate ease-out)
//   • Duration: 380ms in, 220ms out  (asymmetric so arrivals feel anchored)
//   • Reduced-motion: respects prefers-reduced-motion (instant swap, fade only)
//
// API:
//   <DPageTransition transitionKey={key} mode="page" | "sub" direction="forward" | "backward">
//     {content}
//   </DPageTransition>

const { useState: tS, useEffect: tE, useRef: tR, useLayoutEffect: tLE } = React;

// ─────────── Standard tokens ───────────
window.TAVIL_MOTION = {
  ease: 'cubic-bezier(0.32, 0.72, 0.24, 1)',     // corporate soft ease-out
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',     // for departures
  durIn: 380,                                    // ms
  durOut: 220,                                   // ms
  // Page (top-level): vertical lift
  page: { translateY: 12, blur: 0 },
  // Sub (detail): horizontal slide
  sub:  { translateX: 36 },
  // Stagger for content-block entrance (used inside pages)
  stagger: 60,
};

// Detect reduced motion once
const prefersReducedMotion = (typeof window !== 'undefined' && window.matchMedia)
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

function DPageTransition({ transitionKey, mode = 'page', direction = 'forward', children }) {
  // We render two layers (current + outgoing) during transition for cross-fade.
  const M = window.TAVIL_MOTION;
  const [layers, setLayers] = tS([{ key: transitionKey, content: children, phase: 'enter' }]);
  const prevKey = tR(transitionKey);
  // Store latest children in a ref so the transition effect doesn't need to depend on them
  // (depending on `children` causes the cleanup to cancel the rAF mid-flight, leaving the
  // new layer stuck in pre-enter / opacity 0).
  const childrenRef = tR(children);
  childrenRef.current = children;
  const modeRef = tR(mode); modeRef.current = mode;
  const dirRef = tR(direction); dirRef.current = direction;

  // Same-screen content refresh (e.g. tweaks updates) — no transition.
  tE(() => {
    if (prevKey.current !== transitionKey) return; // transition path handles new screens
    setLayers(prev => prev.map((l, i) => i === prev.length - 1 ? { ...l, content: children } : l));
  }, [children, transitionKey]);

  // Transition path — runs only when transitionKey changes.
  tE(() => {
    if (prevKey.current === transitionKey) return;
    prevKey.current = transitionKey;

    // Mark current as exiting, push new as entering
    setLayers(prev => [
      ...prev.map(l => ({ ...l, phase: 'exit' })),
      { key: transitionKey, content: childrenRef.current, phase: 'pre-enter', mode: modeRef.current, direction: dirRef.current },
    ]);

    // Next frame, flip pre-enter → enter so CSS transition kicks in
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayers(prev => prev.map(l => l.phase === 'pre-enter' ? { ...l, phase: 'enter' } : l));
      });
    });

    // Cleanup outgoing layer after exit duration
    const dur = prefersReducedMotion ? 120 : M.durOut;
    const tm = setTimeout(() => {
      setLayers(prev => prev.filter(l => l.phase !== 'exit'));
    }, dur + 20);

    return () => { cancelAnimationFrame(raf1); clearTimeout(tm); };
  }, [transitionKey]);

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 72px)' }}>
      {layers.map((l, i) => {
        const isExit = l.phase === 'exit';
        const isPre = l.phase === 'pre-enter';
        const layerMode = l.mode || mode;
        const layerDir = l.direction || direction;

        // Opacity
        const opacity = (isPre || isExit) ? 0 : 1;

        // Transform per phase + mode
        let transform = 'translate3d(0, 0, 0)';
        if (!prefersReducedMotion) {
          if (layerMode === 'page') {
            if (isPre) transform = `translate3d(0, ${M.page.translateY}px, 0)`;
            else if (isExit) transform = `translate3d(0, -${Math.round(M.page.translateY * 0.5)}px, 0)`;
          } else if (layerMode === 'sub') {
            const sign = layerDir === 'backward' ? -1 : 1;
            if (isPre) transform = `translate3d(${sign * M.sub.translateX}px, 0, 0)`;
            else if (isExit) transform = `translate3d(${-sign * Math.round(M.sub.translateX * 0.5)}px, 0, 0)`;
          }
        }

        const isTop = i === layers.length - 1;
        const dur = isExit ? M.durOut : M.durIn;
        const easing = isExit ? M.easeOut : M.ease;

        return (
          <div key={l.key + '-' + i} aria-hidden={isExit}
            style={{
              position: isTop && !isExit ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0,
              opacity, transform,
              transition: prefersReducedMotion
                ? `opacity 120ms linear`
                : `opacity ${dur}ms ${easing}, transform ${dur}ms ${easing}`,
              willChange: 'opacity, transform',
              pointerEvents: isExit ? 'none' : 'auto',
            }}
          >
            {l.content}
          </div>
        );
      })}
    </div>
  );
}

// ─────────── DEnter — child stagger primitive ───────────
// Wraps direct children with a sequenced fade-in so page contents
// reveal with a calm rhythm instead of all at once.
function DEnter({ children, delay = 0, distance = 8, duration = 420, as: Tag = 'div', style, ...rest }) {
  const M = window.TAVIL_MOTION;
  const [shown, setShown] = tS(false);
  tE(() => {
    if (prefersReducedMotion) { setShown(true); return; }
    const tm = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(tm);
  }, [delay]);
  return (
    <Tag
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translate3d(0,0,0)' : `translate3d(0, ${distance}px, 0)`,
        transition: prefersReducedMotion
          ? 'opacity 160ms linear'
          : `opacity ${duration}ms ${M.ease}, transform ${duration}ms ${M.ease}`,
        willChange: 'opacity, transform',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

Object.assign(window, { DPageTransition, DEnter, prefersReducedMotion });

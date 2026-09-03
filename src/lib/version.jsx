import { createContext, useContext, useMemo, useState } from 'react';
import { resolveVersion, FALLBACK_PATH } from '../data/versions.js';

/**
 * The resolved guest-tier version, shared down the tree.
 *
 * The default value is the most restricted version rather than null: a
 * component rendered outside the provider must degrade to showing LESS, never
 * crash a guest's invitation and never fall open to the full tier.
 */
const VersionContext = createContext(resolveVersion(FALLBACK_PATH));

/**
 * Read window.location.pathname ONCE, at mount, and resolve it.
 *
 * useState's lazy initialiser, not a plain call: it runs exactly once for the
 * life of the component, so no re-render can re-read the URL and no router is
 * needed. The path never changes — there is no client-side navigation.
 */
export function useResolvedVersion() {
  const [version] = useState(() =>
    resolveVersion(typeof window === 'undefined' ? FALLBACK_PATH : window.location.pathname),
  );
  return version;
}

export function VersionProvider({ version, children }) {
  return <VersionContext.Provider value={version}>{children}</VersionContext.Provider>;
}

export function useVersion() {
  return useContext(VersionContext);
}

/**
 * Namespaced sessionStorage, so no key written by one version is readable by
 * another. Both calls swallow errors — storage throws in private modes, and
 * that must never break the gate.
 */
export function useSessionStore() {
  const { storageKey } = useVersion();
  // Memoised: this object goes into useCallback and useEffect dependency
  // arrays, and a fresh one each render would re-run them every time.
  return useMemo(() => ({
    read: (name) => {
      try {
        return sessionStorage.getItem(storageKey(name));
      } catch {
        return null;
      }
    },
    write: (name, value) => {
      try {
        sessionStorage.setItem(storageKey(name), value);
      } catch {
        /* ignore */
      }
    },
  }), [storageKey]);
}

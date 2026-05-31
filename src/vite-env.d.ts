/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Secret partagé pour l'auth sync — optionnel, set côté Railway. */
  readonly VITE_SYNC_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

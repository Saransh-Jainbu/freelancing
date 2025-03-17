/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Force a global API URL for consistent access
declare global {
  interface Window {
    API_URL: string;
  }
}

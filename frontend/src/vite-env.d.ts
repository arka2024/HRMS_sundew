/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL: string;
  readonly VITE_HR_API_URL: string;
  readonly VITE_MANAGER_API_URL: string;
  readonly VITE_REPORT_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

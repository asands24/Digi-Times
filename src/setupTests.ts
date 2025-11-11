import '@testing-library/jest-dom';
import { mockBrowserFilePipeline } from './test/setupBrowserMocks';

process.env.REACT_APP_SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ?? 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock';
process.env.APP_ACCESS_MODE = process.env.APP_ACCESS_MODE ?? 'public';

mockBrowserFilePipeline();

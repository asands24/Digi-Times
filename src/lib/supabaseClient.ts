import { createClient } from '@supabase/supabase-js';

const resolveEnvVar = (): { url?: string; anonKey?: string } => {
  let url: string | undefined;
  let anonKey: string | undefined;

  if (typeof process !== 'undefined') {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.REACT_APP_SUPABASE_URL;
    anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.REACT_APP_SUPABASE_ANON_KEY;
  }

  if (typeof window !== 'undefined' && (window as any).__env) {
    const runtimeEnv = (window as any).__env as Record<string, string | undefined>;
    url =
      url ??
      runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??
      runtimeEnv.REACT_APP_SUPABASE_URL ??
      runtimeEnv.VITE_SUPABASE_URL;
    anonKey =
      anonKey ??
      runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      runtimeEnv.REACT_APP_SUPABASE_ANON_KEY ??
      runtimeEnv.VITE_SUPABASE_ANON_KEY;
  }

  return { url, anonKey };
};

type SupabaseClient = ReturnType<typeof createClient>;

const STUB_MESSAGE =
  'Supabase client not configured: supply NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY (or REACT_APP_/VITE_ equivalents) to enable remote features.';

type ResolverResult<T> = Promise<{ data: T; error: Error | null }>;

const resolved = <T>(data: T): ResolverResult<T> =>
  Promise.resolve({ data, error: null });

const rejected = <T = null>(): ResolverResult<T> =>
  Promise.resolve({ data: null as T, error: new Error(STUB_MESSAGE) });

const createReadBuilder = () => {
  const promise = resolved<unknown[]>([]);

  const builder: any = {
    select: () => builder,
    eq: () => builder,
    neq: () => builder,
    ilike: () => builder,
    in: () => builder,
    contains: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    maybeSingle: () => resolved<unknown | null>(null),
    single: () => resolved<unknown | null>(null),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };

  return builder;
};

const createWriteBuilder = () => {
  const promise = rejected();

  const builder: any = {
    select: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    maybeSingle: () => rejected(),
    single: () => rejected(),
    returns: () => builder,
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };

  return builder;
};

const createStorageBucketStub = () => ({
  upload: async () => ({ data: null, error: new Error(STUB_MESSAGE) }),
  remove: async () => ({ data: null, error: new Error(STUB_MESSAGE) }),
  download: async () => ({ data: null, error: new Error(STUB_MESSAGE) }),
  getPublicUrl: () => ({ data: { publicUrl: '' }, error: null }),
  list: async () => ({ data: [], error: null }),
});

const createAuthStub = () => ({
  getUser: async () => ({ data: { user: null }, error: null }),
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: () => undefined } },
    error: null,
  }),
  signInWithOtp: rejected,
  signOut: rejected,
  signInWithPassword: rejected,
  resetPasswordForEmail: rejected,
  verifyOtp: rejected,
});

const createStubClient = (): SupabaseClient =>
  ({
    from: () => ({
      select: () => createReadBuilder(),
      insert: () => createWriteBuilder(),
      upsert: () => createWriteBuilder(),
      update: () => createWriteBuilder(),
      delete: () => createWriteBuilder(),
    }),
    rpc: rejected,
    functions: {
      invoke: rejected,
    },
    storage: {
      from: () => createStorageBucketStub(),
    },
    auth: createAuthStub(),
    channel: () => ({
      on: () => ({ subscribe: async () => ({ data: null, error: new Error(STUB_MESSAGE) }) }),
      subscribe: async () => ({ data: null, error: new Error(STUB_MESSAGE) }),
      unsubscribe: () => Promise.resolve({ data: null, error: new Error(STUB_MESSAGE) }),
    }),
  } as unknown as SupabaseClient);

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveEnvVar();

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️ Supabase environment missing: falling back to stub client.');
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : createStubClient();

if (process.env.NODE_ENV !== 'test' && supabaseUrl && supabaseAnonKey) {
  console.info('✅ Supabase client initialized');
}

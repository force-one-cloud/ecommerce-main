import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
const createBrowserClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      return createFallbackClient()
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return createFallbackClient()
  }
}

// Create a fallback client that won't throw errors
const createFallbackClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase client not properly initialized"),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase client not properly initialized"),
      }),
      signOut: async () => ({ error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error("Supabase client not properly initialized") }),
        }),
        order: () => ({
          limit: () => ({
            range: async () => ({ data: [], count: 0, error: null }),
          }),
        }),
      }),
      insert: async () => ({ data: null, error: new Error("Supabase client not properly initialized") }),
      update: async () => ({ data: null, error: new Error("Supabase client not properly initialized") }),
      delete: async () => ({ data: null, error: new Error("Supabase client not properly initialized") }),
    }),
  } as any
}

// Create a singleton instance for client-side usage
let browserClient: ReturnType<typeof createClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (typeof window === "undefined") {
    // We're on the server side, create a new instance but don't store it
    return createBrowserClient()
  }

  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

// Create a server client (to be used in Server Components, API routes, and Server Actions)
export const getSupabaseServerClient = () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables for server client")
      return createFallbackClient()
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error creating Supabase server client:", error)
    return createFallbackClient()
  }
}

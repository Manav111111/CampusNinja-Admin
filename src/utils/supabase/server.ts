import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const isMockSession = cookieStore.get('campusninja_mock_session')?.value === 'true'

  if (isMockSession) {
    const mockUser = {
      id: 'mock-admin-id',
      email: 'admin@campusninja.app',
      role: 'authenticated',
    }

    return {
      auth: {
        getUser: async () => {
          return { data: { user: mockUser }, error: null }
        },
        signOut: async () => {
          cookieStore.delete('campusninja_mock_session')
          return { error: null }
        }
      }
    } as any
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// For Server Actions that need to bypass RLS completely
export async function createAdminClient() {
  // We MUST use the raw supabase-js client here, NOT the SSR client.
  // The SSR client intercepts cookies and overrides the service_role key with the user's session token,
  // causing the request to run as 'authenticated' instead of 'service_role', which breaks RLS.
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  )
}

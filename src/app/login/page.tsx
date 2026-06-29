import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedParams = await searchParams
  
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto text-zinc-100">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2"
        action={login}
      >
        <div className="flex flex-col gap-4 p-8 rounded-2xl bg-zinc-950/50 backdrop-blur-xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-400">
            Admin Login
          </h1>
          <p className="text-sm text-center text-zinc-400 mb-6">
            Welcome to CampusNinja Admin Panel
          </p>
          
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 mb-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            name="email"
            placeholder="admin@campusninja.app"
            required
          />
          
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 mb-6 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-3 transition-colors shadow-lg shadow-indigo-500/25 active:scale-[0.98]">
            Sign In
          </button>
          
          {resolvedParams?.message && (
            <p className="mt-4 p-4 bg-red-950/50 border border-red-900/50 text-red-400 text-center rounded-lg text-sm font-medium">
              {resolvedParams.message}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

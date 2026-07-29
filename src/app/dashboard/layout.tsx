import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Users,
  Briefcase,
  GraduationCap,
  LogOut,
  FolderOpen,
  ShoppingCart,
  Layout,
  Bell,
  Truck,
  Share2
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/50 bg-zinc-950/50 flex flex-col backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
            <GraduationCap className="text-indigo-400" />
            CampusNinja
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <LayoutDashboard size={18} />
            Overview
          </Link>

          <div className="pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3">
            Academics
          </div>
          <Link href="/dashboard/branches" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <BookOpen size={18} />
            Branches
          </Link>
          <Link href="/dashboard/semesters" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <BookOpen size={18} />
            Semesters
          </Link>
          <Link href="/dashboard/subjects" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <BookOpen size={18} />
            Subjects
          </Link>
          <Link href="/dashboard/resources" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <FolderOpen size={18} />
            Subject Resources
          </Link>

          <div className="pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3">
            Content
          </div>
          <Link href="/dashboard/banners" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <Layout size={18} />
            Banners
          </Link>
          <Link href="/dashboard/notifications" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <Bell size={18} />
            Notifications
          </Link>
          <Link href="/dashboard/social-links" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <Share2 size={18} />
            Social Links
          </Link>
          
          <div className="pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3">
            Careers
          </div>
          <Link href="/dashboard/skills" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <Briefcase size={18} />
            Skill Paths
          </Link>
          <Link href="/dashboard/skill-resources" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <FolderOpen size={18} />
            Skill Resources
          </Link>

          <div className="pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3">
            Marketplace
          </div>
          <Link href="/dashboard/products" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <ShoppingCart size={18} />
            Products
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <Users size={18} />
            Orders
          </Link>
          <Link href="/dashboard/delivery-settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <Truck size={18} />
            Delivery Settings
          </Link>
          
          <div className="pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3">
            System
          </div>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/50 hover:text-indigo-400 transition-colors">
            <Settings size={18} />
            Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-zinc-800/50">
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-md hover:bg-zinc-800/50 hover:text-red-400 transition-colors">
              <LogOut size={18} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-8">
          <div className="text-sm text-zinc-400">Admin Dashboard</div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              {user.email}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

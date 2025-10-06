import { useEffect, useState } from 'react';
import { Settings, Calendar, LogOut, Home, FolderPlus, FolderOpenDot } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // Helper to check if route is active
  const isActive = (route: string) => pathname === route;

  return (
    <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-full flex flex-col p-4 space-y-4">
        <div className="text-lg font-bold text-center text-black mb-20">Novaq</div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer ${isActive('/dashboard') ? 'bg-[#4D3BED] text-white' : 'text-black hover:bg-gray-100'}`}
          >
            <Home size={18} />
            <span>Home</span>
          </button>

          <button
            onClick={() => router.push('/projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer ${isActive('/projects') ? 'bg-[#4D3BED] text-white' : 'text-black hover:bg-gray-100'}`}
          >
            <FolderOpenDot size={18}/>
            <span>Projects</span>
          </button>

          <button
            onClick={() => router.push('/calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer ${isActive('/calendar') ? 'bg-[#4D3BED] text-white' : 'text-black hover:bg-gray-100'}`}
          >
            <Calendar size={18}/>
            <span>Calendar</span>
          </button>
        </nav>

        <div className="mt-auto text-center">
          <button
            onClick={() => router.push('/settings')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded w-full cursor-pointer ${isActive('/settings') ? 'bg-[#4D3BED] text-white' : 'text-black hover:bg-gray-100'}`}
          >
            <Settings size={25}/>
          </button>
        </div>
      </div>
    </aside>

  )
}

export default Navbar

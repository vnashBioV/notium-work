'use client';

import { motion } from 'framer-motion';
import { Calendar, FolderOpenDot, Home, Settings, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname === route;
  const navItems = [
    { label: 'Home', route: '/dashboard', icon: Home },
    { label: 'Projects', route: '/projects', icon: FolderOpenDot },
    { label: 'Calendar', route: '/calendar', icon: Calendar },
  ];
  const sidebarList = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };
  const itemReveal = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.58 }}
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-white/92 px-4 py-6 shadow-lg backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <motion.div variants={itemReveal} initial="hidden" animate="visible" className="mb-8 flex items-center justify-between px-3">
          <button
            type="button"
            onClick={() => {
              router.push('/dashboard');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#6f6bff_0%,#857bff_45%,#b5c7ff_100%)]">
              <span className="text-base font-black text-white">N</span>
            </div>
            <div className="text-left">
              <p className="text-[22px] font-black tracking-[-0.03em] text-slate-950">Novaq</p>
            </div>
          </button>

          <button
            type="button"
            aria-label="Close sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </motion.div>

        <motion.nav
          variants={sidebarList}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1.5"
        >
          {navItems.map(({ label, route, icon: Icon }) => {
            const active = isActive(route);

            return (
              <motion.button
                variants={itemReveal}
                key={route}
                type="button"
                onClick={() => {
                  router.push(route);
                  setSidebarOpen(false);
                }}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  active
                    ? 'bg-[rgba(99,102,241,0.08)] text-[#4f46e5]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    active
                      ? 'bg-[#4f46e5] text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[15px] font-semibold">{label}</span>
              </motion.button>
            );
          })}
        </motion.nav>

        <motion.div variants={itemReveal} initial="hidden" animate="visible" transition={{ delay: 0.24 }} className="mt-auto pt-6">
          <motion.button
            type="button"
            onClick={() => {
              router.push('/settings');
              setSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
              isActive('/settings')
                ? 'bg-[rgba(99,102,241,0.08)] text-[#4f46e5]'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Settings size={18} />
            </div>
            <span className="text-[15px] font-semibold">Settings</span>
          </motion.button>
        </motion.div>
      </motion.aside>
    </>
  );
};

export default Navbar;


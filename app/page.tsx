'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-6">
      <Image
        src="/logo.png" 
        alt="Logo"
        width={120}
        height={120}
        className="mb-6"
      />
      <h1 className="text-3xl font-bold mb-2 text-black">Welcome to Tshilitech Auth</h1>
      <p className="mb-6 text-[#464646]">A simple Firebase Auth example in Next.js 15</p>

      <div className="flex gap-4">
        <Link href="/login">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded cursor-pointer">
            Login
          </button>
        </Link>
        <Link href="/register">
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded cursor-pointer">
            Register
          </button>
        </Link>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-white px-4">
      <form 
        onSubmit={handleRegister}
        className="relative w-full sm:w-[90%] md:w-[70%] lg:w-[40%] xl:w-[25%] bg-white shadow-lg rounded-2xl p-6 sm:p-8 md:p-10 space-y-4 text-black"
      >
        {/* Loader */}
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white/70 rounded-2xl z-10">
            <div role="status" className="rounded-full">
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-gray-200 animate-spin fill-[#4D3BED]"
                viewBox="0 0 100 101"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.59C100 78.2 77.6 100.59 50 100.59C22.39 100.59 0 78.2 0 50.59C0 22.98 22.39 0.59 50 0.59C77.6 0.59 100 22.98 100 50.59Z"
                  fill="currentColor"
                />
                <path
                  d="M93.97 39.04C96.39 38.4 97.86 35.91 97.01 33.55C95.29 28.82 92.87 24.37 89.82 20.35C85.85 15.12 80.88 10.72 75.21 7.41C69.54 4.1 63.28 1.94 56.77 1.05C51.77 0.37 46.7 0.45 41.73 1.28C39.26 1.69 37.81 4.19 38.45 6.62C39.09 9.05 41.57 10.47 44.05 10.11C47.85 9.55 51.72 9.53 55.54 10.05C60.86 10.78 65.99 12.55 70.63 15.26C75.27 17.96 79.33 21.56 82.58 25.84C84.92 28.91 86.8 32.29 88.18 35.88C89.08 38.22 91.54 39.68 93.97 39.04Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}

        <h1 className="text-xl font-bold mb-2">Sign up to Novaq</h1>

        {/* Email */}
        <div>
          <label htmlFor="email" className="text-xs font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="mt-1 bg-gray-100 rounded-md p-2 w-full text-sm text-black outline-none focus:ring-2 focus:ring-[#4D3BED]"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="text-xs font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-1 bg-gray-100 rounded-md p-2 w-full text-sm text-black outline-none focus:ring-2 focus:ring-[#4D3BED]"
            disabled={loading}
          />
        </div>

        {/* Sign Up */}
        <button
          type="submit"
          className="bg-[#4D3BED] cursor-pointer text-white px-4 py-2 rounded-md w-full font-semibold hover:bg-white hover:text-[#4D3BED] border border-[#4D3BED] transition-all"
          disabled={loading}
        >
          Sign up
        </button>

        {/* Sign In link */}
        <div className="text-sm text-center text-gray-700">
          Already have an account?{' '}
          <a href="/login" className="text-[#4D3BED] font-medium hover:underline">
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
}

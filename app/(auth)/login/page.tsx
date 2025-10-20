'use client';
import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setErrorPopup(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!email) {
      setErrorPopup("Please enter your email first.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setErrorPopup("✅ Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      setErrorPopup(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error: any) {
      setErrorPopup(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-white px-4">
      <form
        onSubmit={handleLogin}
        className="relative w-full sm:w-[90%] md:w-[70%] lg:w-[40%] xl:w-[25%] bg-white shadow-lg rounded-2xl p-6 sm:p-8 md:p-10 space-y-4"
      >
        {/* Loader */}
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white/70 rounded-2xl z-10">
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
          </div>
        )}

        {/* Error Popup */}
        {errorPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center text-black">
              <p className="mb-4 text-sm">{errorPopup}</p>
              <button
                onClick={() => setErrorPopup(null)}
                className="bg-[#4D3BED] text-white px-4 py-2 rounded-md text-sm font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <h1 className="text-xl font-bold mb-2">Sign in to Novaq</h1>
        <p className="text-sm text-gray-700">
          New to the platform?{' '}
          <a href="/register" className="text-[#4D3BED] font-medium hover:underline">
            Create an account
          </a>
        </p>

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
            className="mt-1 w-full bg-gray-100 rounded-md p-2 text-sm text-black outline-none focus:ring-2 focus:ring-[#4D3BED]"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => handlePasswordReset(email)}
              className="text-xs text-[#4D3BED] hover:underline"
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-gray-100 rounded-md p-2 text-sm text-black outline-none pr-10 focus:ring-2 focus:ring-[#4D3BED]"
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(prev => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-[#4D3BED] cursor-pointer text-white px-4 py-2 rounded-md w-full font-semibold hover:bg-white hover:text-[#4D3BED] border border-[#4D3BED] transition-all"
          disabled={loading}
        >
          Sign in
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <hr className="flex-1 border-gray-300" />
          <span className="text-xs text-gray-500">OR</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="bg-white border border-gray-300 text-[#4D3BED] px-4 py-2 rounded-md w-full flex justify-center items-center gap-2 font-medium hover:bg-gray-50 transition-all"
          disabled={loading}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>
      </form>
    </div>
  );
}

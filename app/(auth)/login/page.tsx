'use client';
import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
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
      alert(error.message);
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
      if (error.code === "auth/popup-closed-by-user") {
        setErrorPopup("You closed the Google sign-in popup. Please allow it to continue.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setErrorPopup("Sign-in was cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setErrorPopup("The sign-in popup was blocked. Please enable popups and try again.");
      } else {
        setErrorPopup(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className='w-full h-[100vh] flex justify-center items-center text-black'>
      <form onSubmit={handleLogin} className="space-y-4 p-10 max-w-md mx-auto relative shadow-lg w-[20%] rounded-[10px]">
        {loading && (
          <div className='absolute w-full h-full flex justify-center items-center top-0 right-0 left-0 bottom-0' style={{zIndex:"1"}}>
              <div role="status" className='rounded-full bg-white'>
                  <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-white fill-[#4D3BED]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg>
                  <span className="sr-only">Loading...</span>
              </div>
          </div>
        )} 

        {/* Custom Error Popup */}
        {errorPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="text-black bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
              <p className="mb-4">{errorPopup}</p>
              <button
                onClick={() => setErrorPopup(null)}
                className="bg-white text-[#4D3BED] px-4 py-2 rounded font-semibold cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <h1 className="text-lg font-bold mb-2">Sign in to Novaq</h1>

        {/* register section */}
        <p className='text-sm'>New to the platform? <span><a href="/register" className='text-[#4D3BED]'>Create an account</a></span></p>

        <label htmlFor="email" className='text-[.75rem]'>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          className="bg-[#f3f3f3] rounded p-2 w-full text-black outline-none text-sm mt-1 mb-2"
          disabled={loading}
        />
        <div className='flex justify-between items-center m-0'>
          <label htmlFor="password" className='text-[.75rem] m-0 p-0'>Password</label> 
          <button
            type="button"
            onClick={() => handlePasswordReset(email)}
            className="text-[.75rem] text-[#4D3BED] hover:underline cursor-pointer"
            disabled={loading}
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative w-full mt-1">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="bg-[#f3f3f3] rounded p-2 w-full text-black outline-none text-sm pr-10"
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-600"
            onClick={() => setShowPassword(prev => !prev)}
            disabled={loading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        </div>
        <button
          type="submit"
          className="bg-[#4D3BED] text-white px-4 py-2 rounded-[10px] w-full cursor-pointer hover:text-black hover:bg-white transition-all duration-300"
          disabled={loading}
        >
          Sign in
        </button>

        <div className='flex justify-between w-full items-center'>
          <hr className='w-[40%]' />
          <p className='text-[#4D3BED] text-[.75rem]'>OR</p>
          <hr className='w-[40%]' />
        </div>

        {/* login with google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="bg-white text-[#4D3BED] border-1 border-[#e0e0e0] px-4 py-2 rounded-[10px] w-full mt-2 flex items-center relative cursor-pointer"
          disabled={loading}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5 absolute left-4"
          />
          <span className="w-full text-center text-[.80rem]">Continue with Google</span>
        </button>
      </form>
    </div>
    
  );
}

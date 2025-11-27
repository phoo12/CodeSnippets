"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import cl from "@/public/cl.png";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          {/* NEW WRAPPER DIV for logo and title */}
          <div className="flex items-center space-x-1">
            <Image
              src={cl}
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <Link href="/" className="text-2xl font-bold">
              Code Practice
            </Link>
          </div>
          {/* End of NEW WRAPPER DIV */}
          <div className="text-sm">Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* NEW WRAPPER DIV for logo and title */}
        <div className="flex items-center space-x-1">
          <Image
            src={cl}
            alt="Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <Link
            href="/"
            className="text-2xl font-bold hover:text-blue-200 transition"
          >
            Code Practice
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm">
                Welcome, <span className="font-semibold">{user?.username}</span>
                !
              </span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-white text-blue-600 hover:bg-blue-100 px-4 py-2 rounded transition font-semibold"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded transition font-semibold"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

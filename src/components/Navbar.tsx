import React from "react";
import { User } from "../types";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onNavigate,
}) => {
  return (
    <nav className="bg-[#044414] text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => onNavigate("home")}
        >
          <div className="bg-yellow-400 p-1.5 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#044414]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            DeKUT Marketplace
          </span>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          <button
            onClick={() => onNavigate("home")}
            className="hidden md:block hover:text-yellow-400 font-medium transition-colors"
          >
            Browse
          </button>

          {user ? (
            <>
              <button
                onClick={() => onNavigate("create")}
                className="bg-yellow-400 text-[#044414] px-4 py-2 rounded-full font-bold hover:bg-yellow-300 transition-all text-sm md:text-base flex items-center gap-1"
              >
                <span className="hidden sm:inline">Sell Item</span>
                <span className="sm:hidden">+ Sell</span>
              </button>
              <div className="relative group">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="flex items-center space-x-2 hover:text-yellow-400 font-medium"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-[#044414] font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden lg:inline">
                    {user.fullName.split(" ")[0]}
                  </span>
                </button>
              </div>
              <button
                onClick={onLogout}
                className="text-xs md:text-sm text-gray-300 hover:text-white underline decoration-gray-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("login")}
                className="hover:text-yellow-400 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="bg-white text-[#044414] px-4 py-2 rounded-md font-bold hover:bg-gray-100 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useDispatch } from "react-redux";
import { setMe } from "@/store/app/profileSlice";
import Image from "next/image";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { user } = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      dispatch(setMe(user));
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  const logoUrl = process.env.NEXT_PUBLIC_SLACKIFY_LOGO || "/slackify-logo.png";
  const appName = process.env.NEXT_PUBLIC_SLACKIFY_NAME || "Slackify";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#4A154B]">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Image
            width={150}
            height={150}
            src={logoUrl}
            alt={`${appName} Logo`}
            className="h-12 mb-2"
          />
          <span className="text-xl font-bold text-[#4A154B]">{appName}</span>
        </div>
        <h2 className="text-2xl font-bold text-center text-[#4A154B] mb-2">
          Sign in to your workspace
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your <b>work email address</b> to sign in.
        </p>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="text-gray-900 w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
              placeholder="name@work-email.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="text-gray-900 w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
              placeholder="Your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#4A154B] text-white py-2 rounded font-semibold hover:bg-[#350d36] transition"
          >
            Sign In
          </button>
        </form>
        <div className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#4A154B] font-semibold hover:underline">
            Create an account
          </Link>
        </div>
        <div className="text-center mt-2">
          <Link href="/forget-password" className="text-xs text-[#4A154B] hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
      <p className="text-gray-300 text-xs mt-8">
        © {new Date().getFullYear()} {appName}. Not affiliated with Slack Technologies, LLC.
      </p>
    </div>
  );
}
"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from 'next/image';

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const logoUrl = process.env.NEXT_PUBLIC_SLACKIFY_LOGO || "/slackify-logo.png";
  const appName = process.env.NEXT_PUBLIC_SLACKIFY_NAME || "Slackify";

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle password reset logic here
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#4A154B]">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Image
            src={logoUrl}
            alt={`${appName} Logo`}
            className="h-12 mb-2"
            width={150}
            height={150}
          />
          <span className="text-xl font-bold text-[#4A154B]">
            {appName?.replace(/'/g, '’')}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-center text-[#4A154B] mb-2">
          Reset your password
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your email address and well send you a link to reset your password.
        </p>
        {submitted ? (
          <div className="text-center text-green-600 font-semibold">
            If an account exists for <b>{email}</b>, a reset link has been sent.
          </div>
        ) : (
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
                placeholder="name@work-email.com"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#4A154B] text-white py-2 rounded font-semibold hover:bg-[#350d36] transition"
            >
              Send Reset Link
            </button>
          </form>
        )}
        <div className="text-center text-sm text-gray-600 mt-4">
          <Link href="/login" className="text-[#4A154B] font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
      <p className="text-gray-300 text-xs mt-8">
        © {new Date().getFullYear()} {appName}. Not affiliated with Slack Technologies, LLC.
      </p>
    </div>
  );
}
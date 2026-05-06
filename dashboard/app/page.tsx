"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-primary-400/15 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-gray-900/95 backdrop-blur-lg shadow-xl border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300 group-hover:scale-105">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6.3 1 .9 1 1.6V15c0 1-.9 1.8-2 1.8h-3.6c-1.1 0-2-.8-2-1.8v-2.4c0-.7.4-1.3 1-1.6V9.5C9.2 8.1 10.6 7 12 7zm0 1.2c-.8 0-1.5.5-1.5 1.3V11h3V9.5c0-.8-.7-1.3-1.5-1.3z" />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-primary-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Vaultly
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                How It Works
              </a>
              <a
                href="#security"
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Security
              </a>
            </div>

            {/* Sign In Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/portal/login"
                className="relative group px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl font-medium text-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ${
              mobileMenuOpen ? "max-h-64 pb-4" : "max-h-0"
            }`}
          >
            <div className="flex flex-col gap-3 pt-2">
              <a
                href="#features"
                className="text-gray-300 hover:text-white py-2 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-300 hover:text-white py-2 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#security"
                className="text-gray-300 hover:text-white py-2 transition-colors"
              >
                Security
              </a>
              <Link
                href="/portal/login"
                className="bg-primary-500 text-white py-2.5 px-4 rounded-xl text-center font-medium mt-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm text-primary-300 mb-6 backdrop-blur-sm border border-white/10">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                Secure Session Management
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Secure Access.
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                  Zero Friction.
                </span>
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Vaultly provides enterprise-grade session management for your
                team. Share access securely without sharing credentials. One
                click to connect.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/portal/login"
                  className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/30 hover:-translate-y-1"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>

                <a
                  href="#how-it-works"
                  className="group px-8 py-4 border border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:border-white/30 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  See How It Works
                </a>
              </div>

              {/* Trust badges */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-sm text-gray-500 mb-4">Trusted security features</p>
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                    <span className="text-sm">AES-256 Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span className="text-sm">Row Level Security</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span className="text-sm">Usage Tracking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Interactive Demo */}
            <div className="relative animate-fade-in-up animation-delay-200">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-3xl blur-2xl" />

                {/* Main card */}
                <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 lg:p-8 shadow-2xl">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="bg-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        app.example.com
                      </div>
                    </div>
                  </div>

                  {/* Resource cards */}
                  <div className="space-y-4">
                    <ResourceCard
                      icon="🔐"
                      title="Production Dashboard"
                      description="Secure access to analytics"
                      status="active"
                      delay={0}
                    />
                    <ResourceCard
                      icon="📊"
                      title="Admin Panel"
                      description="Management console"
                      status="active"
                      delay={100}
                    />
                    <ResourceCard
                      icon="🛠️"
                      title="Developer Tools"
                      description="API & Documentation"
                      status="pending"
                      delay={200}
                    />
                  </div>

                  {/* Extension popup simulation */}
                  <div className="absolute -right-4 -bottom-4 w-64 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl animate-float">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Vaultly</p>
                        <p className="text-xs text-gray-400">Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-primary-500/20 rounded-lg">
                      <span className="text-xs text-primary-300">Session active</span>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Enterprise-grade features designed for security-conscious teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              }
              title="Zero Credential Sharing"
              description="Share access without ever exposing passwords. Sessions are encrypted and isolated."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              }
              title="Usage Analytics"
              description="Track who accessed what and when. Complete audit trail for compliance."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              }
              title="User Management"
              description="Invite team members, assign permissions, and manage access from one dashboard."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              }
              title="Chrome Extension"
              description="Seamless one-click access directly from your browser. No setup required."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
              }
              title="Custom Branding"
              description="White-label portal with your company branding for a seamless user experience."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              }
              title="Time-Limited Access"
              description="Set expiration dates on sessions. Access automatically revokes when time's up."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-32 relative bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get your team up and running in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <StepCard
              number="01"
              title="Admin Uploads Sessions"
              description="Admin securely uploads session cookies for resources your team needs access to."
              icon="🔒"
            />
            <StepCard
              number="02"
              title="Assign to Users"
              description="Create user accounts and assign specific resources to each team member."
              icon="👥"
            />
            <StepCard
              number="03"
              title="One-Click Access"
              description="Users install the extension and access resources with a single click. No passwords needed."
              icon="🚀"
            />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Security First
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Built with enterprise security standards from the ground up.
                Your data is encrypted at rest and in transit.
              </p>

              <div className="space-y-4">
                <SecurityFeature
                  title="AES-256 Encryption"
                  description="All session data encrypted with military-grade encryption"
                />
                <SecurityFeature
                  title="Row Level Security"
                  description="Database policies ensure users only see their own data"
                />
                <SecurityFeature
                  title="Extension Verification"
                  description="Cryptographic verification ensures only authorized extensions connect"
                />
                <SecurityFeature
                  title="Audit Logging"
                  description="Complete audit trail of all access events"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/25">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Enterprise Ready</h3>
                  <p className="text-gray-400">
                    Built for teams who take security seriously
                  </p>
                </div>

                {/* Animated security indicators */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary-400">256-bit</p>
                    <p className="text-xs text-gray-400">Encryption</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary-400">100%</p>
                    <p className="text-xs text-gray-400">Isolated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 lg:p-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Ready to Get Started?
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join teams who trust Vaultly for secure session management. Start
                sharing access safely today.
              </p>
              <Link
                href="/portal/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                Sign In to Portal
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </div>
              <span className="font-semibold">Vaultly</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Vaultly. Secure session management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component: Resource Card in Hero
function ResourceCard({
  icon,
  title,
  description,
  status,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  status: "active" | "pending";
  delay: number;
}) {
  return (
    <div
      className="group flex items-center gap-4 p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer animate-slide-in-left"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div
        className={`w-3 h-3 rounded-full ${
          status === "active" ? "bg-green-400 animate-pulse" : "bg-yellow-400"
        }`}
      />
    </div>
  );
}

// Component: Feature Card
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 lg:p-8 bg-gray-800/30 hover:bg-gray-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
      <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl flex items-center justify-center text-primary-400 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

// Component: Step Card
function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="relative text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-3xl mb-6 shadow-lg shadow-primary-500/25">
        {icon}
      </div>
      <div className="absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent hidden md:block -translate-x-8" />
      <p className="text-primary-400 text-sm font-bold mb-2">{number}</p>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

// Component: Security Feature
function SecurityFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center mt-0.5">
        <svg
          className="w-4 h-4 text-primary-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

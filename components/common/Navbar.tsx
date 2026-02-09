'use client';

import Link from 'next/link';
import Image from 'next/image';

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-transparent">
            {/* Left: Logo + Text */}
            <Link href="/" className="flex items-center gap-3 no-underline text-white">
                <Image
                    src="/nailart.png"
                    alt="Nailart AI Logo"
                    width={32}
                    height={48}
                    className="rounded-lg object-contain"
                />
                <span className="text-xl tracking-tight">
                    Nailart AI
                </span>
            </Link>

            {/* Center: Nav Links */}
            <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="text-white/85 no-underline text-sm font-light transition-colors hover:text-white"
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* Right: CTA Button */}
            <Link
                href="/get-started"
                className="px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-md text-white no-underline text-sm font-normal border border-white/30 shadow-lg transition-all hover:bg-white/25 hover:-translate-y-0.5"
            >
                Get Started
            </Link>
        </nav>
    );
}

export { Navbar };

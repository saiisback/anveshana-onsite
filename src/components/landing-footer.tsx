import Link from 'next/link'
import React from "react";
import Image from "next/image";

const links = [
    {
        title: 'Register',
        href: '/register',
    },
    {
        title: 'Login',
        href: '/login',
    },
    {
        title: 'About Agastya',
        href: 'https://www.agastya.org/',
    },
]

export default function FooterSection() {
    return (
        <footer className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
                    <Image src="/anveshana.png" alt="Anveshana'26" width={30} height={30} />
                </Link>

                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            className="text-muted-foreground hover:text-primary block duration-150">
                            <span>{link.title}</span>
                        </Link>
                    ))}
                </div>
                <span className="text-muted-foreground block text-center text-sm font-mono">Anveshana 2026 &mdash; Organized by IIC-BICEP Team</span>
            </div>
        </footer>
    )
}

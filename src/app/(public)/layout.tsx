import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/anveshana.png" alt="Anveshana" width={30} height={30} />
            <span className="font-mono text-lg font-semibold tracking-tight">
              Anveshana
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

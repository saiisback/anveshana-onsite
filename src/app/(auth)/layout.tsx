import DitherBackground from "@/components/dither-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DitherBackground>{children}</DitherBackground>;
}

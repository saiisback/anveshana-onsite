import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FlaskConical,
  Map,
  HelpCircle,
  Calendar,
  Radio,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "3D Maps",
    description:
      "Navigate the exhibition venue with interactive 3D maps. Locate stalls, facilities, and points of interest with ease.",
    icon: <Map className="size-6 text-indigo-500" />,
  },
  {
    title: "Live Help",
    description:
      "Request real-time assistance from volunteers. Get help with technical issues, logistics, or anything else you need.",
    icon: <HelpCircle className="size-6 text-emerald-500" />,
  },
  {
    title: "Smart Scheduling",
    description:
      "AI-powered judge scheduling ensures fair evaluation. Track your upcoming visits and stay prepared.",
    icon: <Calendar className="size-6 text-orange-500" />,
  },
  {
    title: "Real-time Updates",
    description:
      "Stay informed with live notifications, announcements, and schedule changes throughout the event.",
    icon: <Radio className="size-6 text-violet-500" />,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6bTAtNHYySDI0di0yaDEyem0wLTR2Mkgy NHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />

        <div className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/30">
              <FlaskConical className="size-8 text-indigo-400" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Anveshana{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                2026
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300 sm:text-xl">
              A national-level prototype exhibition bringing together young
              innovators, mentors, and industry leaders to showcase groundbreaking
              science and engineering projects.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-2 bg-indigo-500 px-6 text-white hover:bg-indigo-600">
                  Register Your Team
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-slate-600 px-6 text-slate-200 hover:bg-white/5 hover:text-white"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Everything you need, on the day
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Our on-site platform streamlines the entire exhibition experience for
            participants, volunteers, judges, and organizers.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-slate-100">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8 text-center text-sm text-slate-500">
        <p>
          Anveshana 2026 &mdash; Organized by Agastya International Foundation
        </p>
      </footer>
    </div>
  );
}

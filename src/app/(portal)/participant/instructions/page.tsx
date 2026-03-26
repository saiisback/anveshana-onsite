"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Gift,
  MapPin,
  Mic,
  UtensilsCrossed,
  Users,
  HandHelping,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  Grid3X3,
  Trophy,
  Stamp,
  Phone,
} from "lucide-react";

const TIMELINE = [
  {
    time: "8:30 AM",
    title: "Registration Opens",
    description:
      "Arrive at the venue and head to the registration desk. Collect your Welcome Kit.",
    icon: Clock,
    color: "text-blue-500",
  },
  {
    time: "After Registration",
    title: "Guided Navigation",
    description:
      "Based on your arrival time, you will be guided to the Inaugural Ceremony or directly to the Prototype Zones.",
    icon: MapPin,
    color: "text-teal-500",
  },
  {
    time: "Morning",
    title: "Inaugural Ceremony",
    description:
      "A formal function covering the event flow, judging evaluation metrics, and all important guidelines for the day.",
    icon: Mic,
    color: "text-purple-500",
  },
  {
    time: "Throughout the Day",
    title: "Prototype Exhibition & Judging",
    description:
      "Present your prototype at your assigned stall. Track judge proximity via the app.",
    icon: Gavel,
    color: "text-orange-500",
  },
  {
    time: "Meal Times",
    title: "Food & Refreshments",
    description:
      "You will be notified through the app when food is ready. A volunteer will guide you to the food area.",
    icon: UtensilsCrossed,
    color: "text-green-500",
  },
];

export default function InstructionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          General Instructions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to know for{" "}
          <span className="font-semibold text-foreground">
            Anveshana 3.0 — March 27, 2026
          </span>
        </p>
      </div>

      {/* Welcome Kit */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-5 text-primary" />
            Welcome Kit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Collect your Welcome Kit at the registration desk. It includes:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["Bingo Board", "Pen", "Notebook", "Event Essentials"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                  {item}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <div className="space-y-3">
        <h2 className="font-mono text-lg font-semibold text-foreground">
          Event Timeline
        </h2>
        <div className="relative space-y-3">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

          {TIMELINE.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="relative ml-10">
                {/* Timeline dot */}
                <div className="absolute -left-10 top-4 flex size-[38px] items-center justify-center rounded-full border border-border bg-background">
                  <Icon className={`size-4 ${item.color}`} />
                </div>
                <CardContent className="py-4">
                  <Badge
                    variant="outline"
                    className="mb-2 font-mono text-xs"
                  >
                    {item.time}
                  </Badge>
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Judging Rules */}
      <Card className="border-orange-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gavel className="size-5 text-orange-500" />
            Judging Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Pitch Duration: Maximum 5 minutes
                </p>
                <p className="text-muted-foreground">
                  Followed by 2–3 minutes of Q&A from the judges.
                </p>
              </div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Track judge proximity to your stall via the app
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Evaluation metrics will be covered in the Inaugural Ceremony
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Strictly adhere to timing and event rules
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Bingo Board Activity */}
      <Card className="border-violet-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="size-5 text-violet-500" />
            Bingo Board Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your Welcome Kit includes an{" "}
            <span className="font-semibold text-foreground">A4 Bingo Board</span>{" "}
            with a set of tasks. Complete as many tasks as possible throughout the day!
          </p>

          <div className="rounded-lg border border-border bg-violet-500/5 p-3">
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 size-4 shrink-0 text-violet-500" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Prize: Hamper worth ₹1,000
                </p>
                <p className="text-muted-foreground">
                  The team with the highest points and fastest completion wins!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How it works
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                Review the tasks on your Bingo Board
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                Complete tasks throughout the day
              </li>
              <li className="flex items-start gap-2">
                <Stamp className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                Visit the <span className="font-semibold text-foreground">Engagement Activity Desk</span> to get each task stamped
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  Important Rule
                </p>
                <p className="text-muted-foreground">
                  A task is <span className="font-semibold text-foreground">only counted</span> after you receive a stamp from the Engagement Activity Desk. Unstamped tasks will not be counted.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Early Arrival / Out-of-Karnataka Contact */}
      <Card className="border-sky-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="size-5 text-sky-500" />
            Early Arrival & Hostel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Arriving between{" "}
            <span className="font-semibold text-foreground">5:00 AM – 9:00 AM</span>,
            staying in a hostel, or coming from out of Karnataka?
          </p>
          <div className="rounded-lg border border-border bg-sky-500/5 p-3">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-sky-500" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Contact Shivanth
                </p>
                <a
                  href="tel:808855825"
                  className="font-mono text-lg font-bold text-primary hover:underline"
                >
                  8088558825
                </a>
                <p className="mt-1 text-muted-foreground">
                  Shivanth will coordinate your arrival and guide you to the venue.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Need Help */}
      <Card className="border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HandHelping className="size-5 text-green-500" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
            <Users className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Identify Our Team
              </p>
              <p className="text-muted-foreground">
                Volunteers and Anveshana team members wear{" "}
                <span className="font-semibold text-foreground">
                  white T-shirts
                </span>{" "}
                with the Anveshana logo. Feel free to approach anyone!
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Raise a help request through the app for any issue
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Volunteers will respond to your request immediately
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Food notifications will be sent through the app
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

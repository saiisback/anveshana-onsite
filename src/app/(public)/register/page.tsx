"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ClipboardList,
  Settings,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  PartyPopper,
  AlertCircle,
} from "lucide-react";

// ── Schema ──────────────────────────────────────────────────────────────────

const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^[+\d\s()-]+$/, "Invalid phone number"),
  role: z.enum(["lead", "member"]),
});

const registrationSchema = z.object({
  // Step 1
  teamName: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name must be under 50 characters"),
  prototypeTitle: z
    .string()
    .min(5, "Prototype title must be at least 5 characters")
    .max(100, "Prototype title must be under 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be under 500 characters"),
  category: z.enum(["IoT", "AI/ML", "Robotics", "Web/App", "Hardware", "Other"], {
    message: "Please select a category",
  }),
  // Step 2
  members: z
    .array(memberSchema)
    .min(1, "At least one team member is required")
    .max(4, "Maximum 4 team members allowed"),
  // Step 3
  powerOutlet: z.boolean(),
  internetNeeded: z.boolean(),
  tableSize: z.enum(["small", "medium", "large"], {
    message: "Please select a table size",
  }),
  additionalRequirements: z.string().max(300).optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

// ── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = ["IoT", "AI/ML", "Robotics", "Web/App", "Hardware", "Other"] as const;
const TABLE_SIZES = ["small", "medium", "large"] as const;

const STEPS = [
  { label: "Team Info", icon: ClipboardList },
  { label: "Members", icon: Users },
  { label: "Requirements", icon: Settings },
  { label: "Review", icon: CheckCircle2 },
] as const;

// Fields validated per step
const STEP_FIELDS: Record<number, (keyof RegistrationFormData)[]> = {
  0: ["teamName", "prototypeTitle", "description", "category"],
  1: ["members"],
  2: ["powerOutlet", "internetNeeded", "tableSize", "additionalRequirements"],
  3: [],
};

// ── Component ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      teamName: "",
      prototypeTitle: "",
      description: "",
      category: undefined,
      members: [{ name: "", email: "", phone: "", role: "lead" }],
      powerOutlet: false,
      internetNeeded: false,
      tableSize: undefined,
      additionalRequirements: "",
    },
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const formValues = watch();

  // ── Navigation ──────────────────────────────────────────────────────────

  async function goNext() {
    const fieldsToValidate = STEP_FIELDS[step];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function onSubmit(data: RegistrationFormData) {
    setSubmitStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Registration failed. Please try again.");
      }

      setSubmitStatus("success");
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  // ── Success Screen ──────────────────────────────────────────────────────

  if (submitStatus === "success") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl text-center">
          <CardContent className="flex flex-col items-center gap-6 py-12">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <PartyPopper className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              {/* Confetti-style decorative dots */}
              <span className="absolute -right-2 -top-2 h-3 w-3 animate-bounce rounded-full bg-yellow-400" />
              <span className="absolute -left-3 top-4 h-2 w-2 animate-bounce rounded-full bg-pink-400 [animation-delay:150ms]" />
              <span className="absolute -bottom-1 -right-4 h-2.5 w-2.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
              <span className="absolute -left-1 -top-3 h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:450ms]" />
              <span className="absolute -bottom-2 left-2 h-3 w-3 animate-bounce rounded-full bg-orange-400 [animation-delay:200ms]" />
              <span className="absolute right-0 top-[-16px] h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:350ms]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Congratulations!
              </h2>
              <p className="text-muted-foreground">
                Your team <strong>{formValues.teamName}</strong> has been
                successfully registered for Anveshana.
              </p>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a confirmation email to the team lead. You can
                check your registration status by logging in.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                Go Home
              </Button>
              <Button onClick={() => (window.location.href = "/login")}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main Form ───────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isComplete
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/30 text-muted-foreground/50"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      isActive
                        ? "text-foreground"
                        : isComplete
                          ? "text-primary"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 rounded-full transition-colors ${
                      i < step ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {step === 0 && "Team Information"}
                {step === 1 && "Team Members"}
                {step === 2 && "Requirements"}
                {step === 3 && "Review & Submit"}
              </CardTitle>
              <CardDescription>
                {step === 0 &&
                  "Tell us about your team and prototype project."}
                {step === 1 &&
                  "Add your team members (1-4). The first member is the team lead."}
                {step === 2 &&
                  "Let us know what you will need at the event."}
                {step === 3 &&
                  "Please review your details before submitting."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* ── Step 1: Team Info ─────────────────────────────────── */}
              {step === 0 && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      placeholder="e.g. Circuit Breakers"
                      {...register("teamName")}
                      aria-invalid={!!errors.teamName}
                    />
                    {errors.teamName && (
                      <p className="text-xs text-destructive">
                        {errors.teamName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prototypeTitle">Prototype Title</Label>
                    <Input
                      id="prototypeTitle"
                      placeholder="e.g. Smart Plant Watering System"
                      {...register("prototypeTitle")}
                      aria-invalid={!!errors.prototypeTitle}
                    />
                    {errors.prototypeTitle && (
                      <p className="text-xs text-destructive">
                        {errors.prototypeTitle.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe your prototype and what problem it solves..."
                      rows={4}
                      {...register("description")}
                      aria-invalid={!!errors.description}
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && (
                      <p className="text-xs text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── Step 2: Members ───────────────────────────────────── */}
              {step === 1 && (
                <>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="relative rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={index === 0 ? "default" : "secondary"}
                            >
                              {index === 0 ? "Lead" : `Member ${index + 1}`}
                            </Badge>
                          </div>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor={`members.${index}.name`}>
                              Full Name
                            </Label>
                            <Input
                              id={`members.${index}.name`}
                              placeholder="John Doe"
                              {...register(`members.${index}.name`)}
                              aria-invalid={!!errors.members?.[index]?.name}
                            />
                            {errors.members?.[index]?.name && (
                              <p className="text-xs text-destructive">
                                {errors.members[index].name.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`members.${index}.email`}>
                              Email
                            </Label>
                            <Input
                              id={`members.${index}.email`}
                              type="email"
                              placeholder="john@example.com"
                              {...register(`members.${index}.email`)}
                              aria-invalid={!!errors.members?.[index]?.email}
                            />
                            {errors.members?.[index]?.email && (
                              <p className="text-xs text-destructive">
                                {errors.members[index].email.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`members.${index}.phone`}>
                              Phone
                            </Label>
                            <Input
                              id={`members.${index}.phone`}
                              placeholder="+91 98765 43210"
                              {...register(`members.${index}.phone`)}
                              aria-invalid={!!errors.members?.[index]?.phone}
                            />
                            {errors.members?.[index]?.phone && (
                              <p className="text-xs text-destructive">
                                {errors.members[index].phone.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label>Role</Label>
                            {index === 0 ? (
                              <>
                                <Input
                                  value="Team Lead"
                                  disabled
                                  className="bg-muted"
                                />
                                <input
                                  type="hidden"
                                  {...register(`members.${index}.role`)}
                                  value="lead"
                                />
                              </>
                            ) : (
                              <>
                                <Input
                                  value="Member"
                                  disabled
                                  className="bg-muted"
                                />
                                <input
                                  type="hidden"
                                  {...register(`members.${index}.role`)}
                                  value="member"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {fields.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        append({
                          name: "",
                          email: "",
                          phone: "",
                          role: "member",
                        })
                      }
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add Member
                    </Button>
                  )}
                </>
              )}

              {/* ── Step 3: Requirements ──────────────────────────────── */}
              {step === 2 && (
                <>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <input
                      id="powerOutlet"
                      type="checkbox"
                      className="h-4 w-4 rounded border-input accent-primary"
                      {...register("powerOutlet")}
                    />
                    <Label htmlFor="powerOutlet" className="cursor-pointer">
                      Power outlet needed
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <input
                      id="internetNeeded"
                      type="checkbox"
                      className="h-4 w-4 rounded border-input accent-primary"
                      {...register("internetNeeded")}
                    />
                    <Label htmlFor="internetNeeded" className="cursor-pointer">
                      Internet access needed
                    </Label>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Table Size Preference</Label>
                    <Controller
                      control={control}
                      name="tableSize"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select table size" />
                          </SelectTrigger>
                          <SelectContent>
                            {TABLE_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size.charAt(0).toUpperCase() + size.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.tableSize && (
                      <p className="text-xs text-destructive">
                        {errors.tableSize.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="additionalRequirements">
                      Additional Requirements{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="additionalRequirements"
                      placeholder="Any special setup, tools, or accommodations you may need..."
                      rows={3}
                      {...register("additionalRequirements")}
                    />
                    {errors.additionalRequirements && (
                      <p className="text-xs text-destructive">
                        {errors.additionalRequirements.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── Step 4: Review ────────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Team Info */}
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <ClipboardList className="h-4 w-4" />
                      Team Information
                    </h3>
                    <div className="rounded-lg border p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Team Name</span>
                        <span className="font-medium">{formValues.teamName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prototype</span>
                        <span className="font-medium">
                          {formValues.prototypeTitle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <Badge variant="secondary">{formValues.category}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Description</span>
                        <p className="mt-1 text-foreground">
                          {formValues.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <Users className="h-4 w-4" />
                      Team Members ({formValues.members?.length})
                    </h3>
                    <div className="space-y-2">
                      {formValues.members?.map((member, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <span className="font-medium">{member.name}</span>
                            <span className="ml-2 text-muted-foreground">
                              {member.email}
                            </span>
                          </div>
                          <Badge
                            variant={
                              member.role === "lead" ? "default" : "secondary"
                            }
                          >
                            {member.role === "lead" ? "Lead" : "Member"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <Settings className="h-4 w-4" />
                      Requirements
                    </h3>
                    <div className="rounded-lg border p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Power Outlet
                        </span>
                        <span className="font-medium">
                          {formValues.powerOutlet ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Internet Access
                        </span>
                        <span className="font-medium">
                          {formValues.internetNeeded ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Table Size</span>
                        <span className="font-medium capitalize">
                          {formValues.tableSize}
                        </span>
                      </div>
                      {formValues.additionalRequirements && (
                        <div>
                          <span className="text-muted-foreground">
                            Additional Requirements
                          </span>
                          <p className="mt-1 text-foreground">
                            {formValues.additionalRequirements}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error state */}
                  {submitStatus === "error" && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {errorMessage}
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* ── Navigation Buttons ────────────────────────────────── */}
            <div className="flex items-center justify-between border-t px-4 py-4">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={submitStatus === "loading"}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button type="button" onClick={goNext}>
                  Next
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitStatus === "loading"}
                >
                  {submitStatus === "loading" ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}

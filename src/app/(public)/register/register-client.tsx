"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Settings,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  PartyPopper,
  AlertCircle,
  Upload,
  UserCircle,
} from "lucide-react";
import { Controller } from "react-hook-form";
import { UploadButton } from "@/lib/uploadthing";

// ── Schema ──────────────────────────────────────────────────────────────────

const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^[+\d\s()-]+$/, "Invalid phone number"),
});

const registrationSchema = z.object({
  // Step 1 — Lead info
  leadName: z.string().min(2, "Name must be at least 2 characters"),
  leadPhone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^[+\d\s()-]+$/, "Invalid phone number"),
  members: z.array(memberSchema).max(3, "Maximum 3 additional members"),
  // Step 2 — Requirements
  powerOutlet: z.boolean(),
  internetNeeded: z.boolean(),
  tableSize: z.enum(["small", "medium", "large"], {
    message: "Please select a table size",
  }),
  additionalRequirements: z.string().max(300).optional(),
  paymentScreenshot: z.string().min(1, "Please upload your payment screenshot"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const TABLE_SIZES = ["small", "medium", "large"] as const;

const STEPS = [
  { label: "Team Info", icon: UserCircle },
  { label: "Requirements", icon: Settings },
  { label: "Done", icon: CheckCircle2 },
] as const;

const STEP_FIELDS: Record<number, (keyof RegistrationFormData)[]> = {
  0: ["leadName", "leadPhone", "members"],
  1: ["powerOutlet", "internetNeeded", "tableSize", "paymentScreenshot"],
  2: [],
};

// ── Component ───────────────────────────────────────────────────────────────

export default function RegisterClient({
  token,
  invitedEmail,
}: {
  token: string;
  invitedEmail: string;
}) {
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
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      leadName: "",
      leadPhone: "",
      members: [],
      powerOutlet: false,
      internetNeeded: false,
      tableSize: undefined,
      additionalRequirements: "",
      paymentScreenshot: "",
    },
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const formValues = watch();

  async function goNext() {
    const fieldsToValidate = STEP_FIELDS[step];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => Math.min(s + 1, 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: RegistrationFormData) {
    setSubmitStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? "RSVP failed. Please try again."
        );
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
              <span className="absolute -right-2 -top-2 h-3 w-3 animate-bounce rounded-full bg-yellow-400" />
              <span className="absolute -left-3 top-4 h-2 w-2 animate-bounce rounded-full bg-pink-400 [animation-delay:150ms]" />
              <span className="absolute -bottom-1 -right-4 h-2.5 w-2.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                RSVP Submitted!
              </h2>
              <p className="text-muted-foreground">
                Your team RSVP is now pending admin approval.
              </p>
              <p className="text-sm text-muted-foreground">
                Once approved, all team members will receive an email to set
                their password and access the portal.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress Indicator */}
        <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-3">
            {STEPS.slice(0, 2).map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isComplete = i < step;
              return (
                <div key={s.label} className="contents">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isComplete
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted-foreground/30 text-muted-foreground/50"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
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
                  {i < 1 && (
                    <div
                      className={`mb-5 h-0.5 w-16 rounded-full transition-colors ${
                        i < step ? "bg-primary" : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Step {step + 1} of 2
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {step === 0 && "Team Information"}
                {step === 1 && "Requirements & Payment"}
              </CardTitle>
              <CardDescription>
                {step === 0 &&
                  "Enter your details and add team members (up to 3 additional)."}
                {step === 1 &&
                  "Let us know what you need and upload your payment screenshot."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* ── Step 1: Lead + Members ─────────────────────────── */}
              {step === 0 && (
                <>
                  {/* Lead info */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <Badge>Team Lead (You)</Badge>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="leadEmail">Email</Label>
                        <Input
                          id="leadEmail"
                          value={invitedEmail}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="leadName">Full Name</Label>
                        <Input
                          id="leadName"
                          placeholder="Your full name"
                          {...register("leadName")}
                          aria-invalid={!!errors.leadName}
                        />
                        {errors.leadName && (
                          <p className="text-xs text-destructive">
                            {errors.leadName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="leadPhone">Phone</Label>
                        <Input
                          id="leadPhone"
                          placeholder="+91 98765 43210"
                          {...register("leadPhone")}
                          aria-invalid={!!errors.leadPhone}
                        />
                        {errors.leadPhone && (
                          <p className="text-xs text-destructive">
                            {errors.leadPhone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional members */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Additional Members (optional)
                    </h3>
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="relative rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            Member {index + 1}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label>Name</Label>
                            <Input
                              placeholder="Full name"
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
                            <Label>Email</Label>
                            <Input
                              type="email"
                              placeholder="email@example.com"
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
                            <Label>Phone</Label>
                            <Input
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
                        </div>
                      </div>
                    ))}

                    {fields.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          append({ name: "", email: "", phone: "" })
                        }
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Member
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* ── Step 2: Requirements + Payment ──────────────────── */}
              {step === 1 && (
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
                    <Label>
                      Additional Requirements{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      placeholder="Any special setup, tools, or accommodations..."
                      rows={3}
                      {...register("additionalRequirements")}
                    />
                  </div>

                  {/* Payment screenshot upload */}
                  <div className="space-y-1.5">
                    <Label>Payment Screenshot</Label>
                    {formValues.paymentScreenshot ? (
                      <div className="flex items-center gap-2 rounded-lg border border-green-800 bg-green-900/20 p-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <span className="text-sm text-green-400">
                          Screenshot uploaded
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => setValue("paymentScreenshot", "")}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="paymentScreenshot"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) {
                            setValue("paymentScreenshot", res[0].ufsUrl, {
                              shouldValidate: true,
                            });
                          }
                        }}
                        onUploadError={(error) => {
                          console.error("Upload error:", error);
                        }}
                      />
                    )}
                    {errors.paymentScreenshot && (
                      <p className="text-xs text-destructive">
                        {errors.paymentScreenshot.message}
                      </p>
                    )}
                  </div>

                  {/* Error state */}
                  {submitStatus === "error" && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {errorMessage}
                    </div>
                  )}
                </>
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

              {step < 1 ? (
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
                    "Submit RSVP"
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

"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useAsyncAction() {
  const [loading, setLoading] = useState(false);

  async function execute(
    action: () => Promise<Response>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (data: unknown) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<boolean> {
    setLoading(true);
    try {
      const res = await action();
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? options.errorMessage ?? "Action failed");
      }
      if (options.onSuccess) {
        const data = await res.json().catch(() => null);
        options.onSuccess(data);
      }
      if (options.successMessage) toast.success(options.successMessage);
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : (options.errorMessage ?? "Something went wrong");
      toast.error(message);
      if (options.onError)
        options.onError(error instanceof Error ? error : new Error(message));
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, execute };
}

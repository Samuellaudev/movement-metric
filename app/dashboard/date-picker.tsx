"use client";

import { useRouter } from "next/navigation";

export default function DatePicker({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/dashboard?date=${e.target.value}`);
  }

  return (
    <input
      type="date"
      defaultValue={defaultDate}
      onChange={handleChange}
      className="border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

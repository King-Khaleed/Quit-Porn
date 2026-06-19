"use client";

import { useSearchParams } from "next/navigation";
import PreCommitScreen from "@/components/PreCommitScreen";

export default function InterceptPage() {
  const params = useSearchParams();
  const domain = params.get("domain") || undefined;

  return <PreCommitScreen domain={domain} />;
}

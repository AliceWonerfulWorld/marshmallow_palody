"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
  const { isAuthenticated } = useConvexAuth();
  const { userId } = useAuth();
  const upsert = useMutation(api.users.upsert);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let active = true;
    upsert({}).then(() => {
      if (active) setFailed(false);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [isAuthenticated, userId, upsert, retry]);

  if (!isAuthenticated || !failed) return null;
  return (
    <div role="alert" className="bg-red-50 p-4 text-center text-red-800">
      アカウントの準備を完了できませんでした。
      <button className="ml-3 underline" onClick={() => setRetry((value) => value + 1)}>再試行</button>
    </div>
  );
}

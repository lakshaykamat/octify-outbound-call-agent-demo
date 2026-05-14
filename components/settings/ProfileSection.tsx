"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineEditField } from "@/components/patterns";
import { useSession } from "@/hooks/queries";
import { toast } from "sonner";
import { Camera } from "lucide-react";

function initials(value: string) {
  return value
    .split(/[\s._-]+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileSection() {
  const session = useSession();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [usernameOverride, setUsernameOverride] = useState<string | null>(null);
  const [title, setTitle] = useState("Head of Sales Development");

  if (session.isLoading || !session.data) return <Skeleton className="h-72" />;
  const u = session.data.user;
  const liveName = nameOverride ?? u.name;
  const liveUsername = usernameOverride ?? u.username;

  function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      toast.success("Avatar updated");
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          How you appear in Xylo and on call invites.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-4">
          <label className="group relative cursor-pointer">
            <Avatar className="size-16">
              {avatar ? <AvatarImage src={avatar} alt="Avatar" /> : null}
              <AvatarFallback className="text-base">
                {initials(liveName)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="size-5" />
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarPick}
              className="sr-only"
              aria-label="Upload avatar"
            />
          </label>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Name
              </div>
              <InlineEditField
                value={liveName}
                onSave={async (v) => {
                  setNameOverride(v);
                  toast.success("Name updated");
                }}
              />
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Username
              </div>
              <InlineEditField
                value={`@${liveUsername}`}
                onSave={async (v) => {
                  setUsernameOverride(v.replace(/^@/, ""));
                  toast.success("Username updated");
                }}
              />
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Title
              </div>
              <InlineEditField
                value={title}
                onSave={async (v) => {
                  setTitle(v);
                  toast.success("Title updated");
                }}
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {u.role ? <Badge variant="secondary">{u.role}</Badge> : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.message("Password reset email sent")}
            >
              Reset password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

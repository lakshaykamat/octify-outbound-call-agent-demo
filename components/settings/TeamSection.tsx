"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorCard } from "@/components/ErrorCard";
import { useMembers } from "@/hooks/queries";
import { toast } from "sonner";
import { MoreHorizontal, UserPlus } from "lucide-react";
import type { Member } from "@/lib/mock";

const ROLE_VARIANT: Record<Member["role"], "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
  viewer: "outline",
};

function initials(value: string) {
  return value
    .split(/[\s._-]+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Pending = { id: string; email: string; role: Member["role"]; invitedAt: string };

export function TeamSection() {
  const members = useMembers();
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("member");
  const [pending, setPending] = useState<Pending[]>([
    { id: "inv_01", email: "dana@apexcapital.com", role: "admin", invitedAt: "2026-05-10" },
    { id: "inv_02", email: "jules@apexcapital.com", role: "member", invitedAt: "2026-05-12" },
  ]);

  function sendInvite() {
    if (!inviteEmail.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setPending((p) => [
      { id: `inv_${Math.random().toString(36).slice(2, 6)}`, email: inviteEmail, role: inviteRole, invitedAt: new Date().toISOString().slice(0, 10) },
      ...p,
    ]);
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole("member");
    setOpen(false);
  }

  if (members.isError)
    return <ErrorCard message="Couldn't load team." detail={members.error instanceof Error ? members.error.message : undefined} />;
  if (members.isLoading || !members.data) return <Skeleton className="h-72" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Team</CardTitle>
            <CardDescription>
              {members.data.total} {members.data.total === 1 ? "member" : "members"} · {pending.length} pending
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={<Button size="sm"><UserPlus className="size-3.5" /> Invite</Button>}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a teammate</DialogTitle>
                <DialogDescription>They'll get an email with a sign-in link.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="email@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  autoFocus
                />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Member["role"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={sendInvite}>Send invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="divide-y">
          {members.data.members.map((m) => (
            <li key={m._id} className="flex items-center gap-3 py-3 first:pt-0">
              <Avatar className="size-9"><AvatarFallback>{initials(m.name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{m.username} · joined {new Date(m.createdAt).toISOString().slice(0, 10)}</p>
              </div>
              <Badge variant={ROLE_VARIANT[m.role]}>{m.role}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button size="icon" variant="ghost" className="size-8" aria-label="Member actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.message(`${m.name} promoted to admin`)}>Make admin</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.message(`${m.name} demoted to viewer`)}>Make viewer</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toast.success(`${m.name} removed`)}
                    className="text-destructive"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>

        {pending.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Pending invites</div>
            <ul className="divide-y rounded-lg border">
              {pending.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(p.email.split("@")[0] ?? p.email)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.email}</p>
                    <p className="text-xs text-muted-foreground">invited {p.invitedAt}</p>
                  </div>
                  <Badge variant="outline">{p.role}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPending((arr) => arr.filter((x) => x.id !== p.id));
                      toast.message("Invite revoked");
                    }}
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

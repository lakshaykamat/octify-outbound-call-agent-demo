"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2 } from "lucide-react";

type ApiKey = { id: string; name: string; prefix: string; createdAt: string; lastUsed: string | null };

const SEED: ApiKey[] = [
  { id: "key_01", name: "Production server", prefix: "xy_live_8f3a", createdAt: "2026-01-12", lastUsed: "12 min ago" },
  { id: "key_02", name: "Zapier integration", prefix: "xy_live_a91c", createdAt: "2026-02-04", lastUsed: "3 hours ago" },
  { id: "key_03", name: "n8n workflows", prefix: "xy_live_b7e0", createdAt: "2026-03-21", lastUsed: "2 days ago" },
  { id: "key_04", name: "Staging", prefix: "xy_test_2d4f", createdAt: "2026-04-09", lastUsed: null },
];

function fakeSecret() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "xy_live_";
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>(SEED);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<{ name: string; secret: string } | null>(null);

  function create() {
    if (!name.trim()) { toast.error("Name your key"); return; }
    const secret = fakeSecret();
    const prefix = secret.slice(0, 12);
    setKeys((k) => [{ id: `key_${Math.random().toString(36).slice(2, 6)}`, name: name.trim(), prefix, createdAt: new Date().toISOString().slice(0, 10), lastUsed: null }, ...k]);
    setRevealed({ name: name.trim(), secret });
    setName("");
    setOpen(false);
  }

  function revoke(id: string) {
    setKeys((k) => k.filter((x) => x.id !== id));
    toast.success("Key revoked");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>API keys</CardTitle>
              <CardDescription>Use these to authenticate the Xylo REST and webhook APIs.</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={<Button size="sm"><Plus className="size-3.5" /> New key</Button>}
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                  <DialogDescription>You'll see the full secret once — store it somewhere safe.</DialogDescription>
                </DialogHeader>
                <Input placeholder="e.g. Webhook receiver" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={create}>Create key</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-3 px-6 py-3">
                <Key className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{k.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{k.prefix}••••••••••••••••</p>
                </div>
                {k.prefix.startsWith("xy_test") ? <Badge variant="outline">test</Badge> : <Badge variant="secondary">live</Badge>}
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {k.lastUsed ? `Used ${k.lastUsed}` : "Never used"}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  onClick={() => revoke(k.id)}
                  aria-label="Revoke"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={!!revealed} onOpenChange={(o) => !o && setRevealed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>
              This is the only time you'll see the full key. Copy it now.
            </DialogDescription>
          </DialogHeader>
          {revealed && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{revealed.name}</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs">
                  {revealed.secret}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(revealed.secret);
                    toast.success("Copied to clipboard");
                  }}
                  aria-label="Copy"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setRevealed(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

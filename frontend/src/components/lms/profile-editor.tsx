'use client';

import { useState, useTransition } from 'react';
import { Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfileAction } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile } from '@/types/lms';

export function ProfileEditor({ profile }: { profile: UserProfile }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}><Pencil className="size-3.5" /> Edit profile</Button>;
  }

  return (
    <form className="mt-5 grid gap-4 border-t border-border pt-5" action={(formData) => startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Profile updated');
      setEditing(false);
    })}>
      <div className="grid gap-2"><Label htmlFor="profile-name">Display name</Label><Input id="profile-name" name="username" defaultValue={profile.username} minLength={2} maxLength={60} required /></div>
      <div className="grid gap-2">
        <Label htmlFor="profile-avatar">Profile image</Label>
        <Input id="profile-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF. Maximum 5 MB.</p>
      </div>
      <div className="grid gap-2"><Label htmlFor="profile-bio">Short bio</Label><Textarea id="profile-bio" name="bio" defaultValue={profile.bio} maxLength={280} rows={3} placeholder="Tell other learners a little about yourself." /></div>
      <div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</Button><Button type="button" variant="ghost" className="gap-2" disabled={pending} onClick={() => setEditing(false)}><X className="size-4" /> Cancel</Button></div>
    </form>
  );
}

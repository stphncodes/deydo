import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { signOutAction } from '@/features/auth/server/actions'
import { listActiveAreas } from '@/features/locations/server/areas'
import { AvatarUploader } from '@/features/profiles/components/avatar-uploader'
import { ProfileForm } from '@/features/profiles/components/profile-form'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Account' }

export default async function SettingsPage() {
  const { profile } = await requireUser()
  const areas = await listActiveAreas()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <Card className="space-y-6">
        <AvatarUploader path={profile.avatar_path} name={profile.full_name} />
        <ProfileForm
          areas={areas}
          profile={{
            fullName: profile.full_name ?? '',
            handle: profile.handle ?? '',
            locationId: profile.default_location_id ?? '',
          }}
        />
      </Card>
      <form action={signOutAction}>
        <Button type="submit" variant="secondary" fullWidth>
          Sign out
        </Button>
      </form>
    </div>
  )
}

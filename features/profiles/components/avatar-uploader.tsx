'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { buttonClasses } from '@/components/ui/button'

import { compressImage } from '../compress-image'
import { createAvatarUploadAction, saveAvatarAction } from '../server/actions'

type Status =
  { kind: 'idle' } | { kind: 'busy' } | { kind: 'done' } | { kind: 'error'; message: string }

export function AvatarUploader({ path, name }: { path: string | null; name: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function onFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus({ kind: 'error', message: 'Please choose a photo.' })
      return
    }
    setStatus({ kind: 'busy' })
    try {
      const { blob, extension } = await compressImage(file)
      const upload = await createAvatarUploadAction(extension)
      if (!upload.ok) throw new Error('upload url')

      const body = new FormData()
      body.append('cacheControl', '3600')
      body.append('', blob)
      const response = await fetch(upload.signedUrl, {
        method: 'PUT',
        body,
        headers: { 'x-upsert': 'false' },
      })
      if (!response.ok) throw new Error('upload failed')

      const saved = await saveAvatarAction(upload.path)
      if (saved.error) throw new Error(saved.error.message)
      setStatus({ kind: 'done' })
      router.refresh()
    } catch {
      setStatus({ kind: 'error', message: 'We could not upload your photo. Please try again.' })
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar path={path} name={name} size={72} />
      <div className="space-y-1">
        <label className={buttonClasses({ variant: 'secondary' })}>
          {status.kind === 'busy' ? 'Uploading...' : path ? 'Change photo' : 'Add a photo'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={status.kind === 'busy'}
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </label>
        <p className="text-sm text-ink-muted" role="status">
          {status.kind === 'error'
            ? status.message
            : status.kind === 'done'
              ? 'Photo updated.'
              : 'A clear photo of your face helps people trust you.'}
        </p>
      </div>
    </div>
  )
}

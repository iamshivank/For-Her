'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

interface SettingsSheetProps {
  open: boolean
  onClose: () => void
}

type ThemeOption = 'light' | 'dark' | 'system' | 'high-contrast'

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { userPrefs, updateUserPrefs, exportData, importData, changePassphrase, wipeAllData } = useAppStore()
  const [cloud, setCloud] = React.useState(!!userPrefs?.consentFlags.cloudSync)
  const [theme, setTheme] = React.useState<ThemeOption>((userPrefs?.theme as ThemeOption) ?? 'system')
  const [busy, setBusy] = React.useState(false)
  const [oldPass, setOldPass] = React.useState('')
  const [newPass, setNewPass] = React.useState('')
  const [confirmNew, setConfirmNew] = React.useState('')
  const [err, setErr] = React.useState<string | null>(null)

  const save = async () => {
    const existing = userPrefs?.consentFlags || { analytics: false, cloudSync: false, crashReporting: false }
    await updateUserPrefs({
      theme: theme as any,
      consentFlags: {
        analytics: existing.analytics ?? false,
        cloudSync: cloud,
        crashReporting: existing.crashReporting ?? false,
      }
    })
    onClose()
  }

  const changePass = async () => {
    setErr(null)
    if (!oldPass || newPass.length < 12 || newPass !== confirmNew) {
      setErr('Check passphrases. New must be 12+ chars and match confirm.')
      return
    }
    setBusy(true)
    try {
      const ok = await changePassphrase(oldPass, newPass)
      if (!ok) setErr('Failed to change passphrase.')
      else {
        setOldPass(''); setNewPass(''); setConfirmNew('')
      }
    } finally { setBusy(false) }
  }

  const doExport = async () => {
    setBusy(true)
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cyclewise-export-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  const doImport = async (file: File) => {
    setBusy(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      await importData(json)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto"
            initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Settings</h2>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium mb-2">Theme</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['light','dark','system'] as ThemeOption[]).map((t) => (
                    <button key={t} onClick={() => setTheme(t)} className={`p-2 rounded border ${theme===t? 'border-pink-500 bg-pink-50':'border-gray-200 hover:border-gray-300'}`}> {t}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Cloud Sync</div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={cloud} onChange={(e)=>setCloud(e.target.checked)} />
                  <span className="text-sm text-gray-600">Enable encrypted cloud backup</span>
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Data Export / Import</div>
                <div className="flex gap-2">
                  <Button onClick={doExport} disabled={busy} variant="outline">Export</Button>
                  <label className="inline-flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer text-sm">
                    Import
                    <input type="file" accept="application/json" className="hidden" onChange={(e)=> e.target.files && doImport(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Change Passphrase</div>
                <div className="space-y-2">
                  <input placeholder="Current passphrase" type="password" className="w-full border rounded p-2" value={oldPass} onChange={e=>setOldPass(e.target.value)} />
                  <input placeholder="New passphrase (12+ chars)" type="password" className="w-full border rounded p-2" value={newPass} onChange={e=>setNewPass(e.target.value)} />
                  <input placeholder="Confirm new passphrase" type="password" className="w-full border rounded p-2" value={confirmNew} onChange={e=>setConfirmNew(e.target.value)} />
                  {err && <div className="text-xs text-red-600">{err}</div>}
                  <Button onClick={changePass} disabled={busy}>Update Passphrase</Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">Danger Zone</div>
                <p className="text-xs text-gray-600">Reset app will erase local data. You will need to onboard again.</p>
                <Button variant="destructive" disabled={busy} onClick={() => wipeAllData()}>Reset App</Button>
              </div>

              <div>
                <Button onClick={save} disabled={busy}>Save</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



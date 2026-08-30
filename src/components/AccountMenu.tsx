import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ChevronDown, LogOut } from 'lucide-react'

type AccountMenuProps = {
  user: User
  onSignOut: () => void
}

export function AccountMenu({ user, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="account-menu">
      <button className="account-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        <span>{user.email?.charAt(0).toUpperCase() ?? 'M'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="account-popover" role="menu">
          <p>{user.email}</p>
          <button role="menuitem" onClick={onSignOut}><LogOut size={15} /> Sign out</button>
        </div>
      )}
    </div>
  )
}

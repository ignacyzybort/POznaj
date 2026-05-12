"use client";

function Icon({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function SearchIcon({ size }: { size?: number }) {
  return <Icon size={size}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/></Icon>;
}

export function FilterIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M3 5h18M6 12h12M10 19h4"/></Icon>;
}

export function BackIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M15 6l-6 6 6 6"/></Icon>;
}

export function ShareIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M16 6l-4-4-4 4M12 2v14"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></Icon>;
}

export function BookmarkIcon({ size, fill }: { size?: number; fill?: boolean }) {
  return fill
    ? <svg width={size ?? 20} height={size ?? 20} viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
    : <Icon size={size}><path d="M6 4h12v17l-6-4-6 4z"/></Icon>;
}

export function PinIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9.5" r="2.5"/></Icon>;
}

export function CalIcon({ size }: { size?: number }) {
  return <Icon size={size}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></Icon>;
}

export function UsersIcon({ size }: { size?: number }) {
  return <Icon size={size}><circle cx="9" cy="9" r="3.5"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M21 18a4 4 0 0 0-4-4"/></Icon>;
}

export function SparkIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M12 3v6m0 6v6M3 12h6m6 0h6"/></Icon>;
}

export function CheckIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M5 12.5 10 17l9-10"/></Icon>;
}

export function FireIcon({ size, fill }: { size?: number; fill?: boolean }) {
  return fill
    ? <svg width={size ?? 20} height={size ?? 20} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.7 3.4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 0-8z"/></svg>
    : <Icon size={size}><path d="M12 2c.7 3.4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 0-8z"/></Icon>;
}

export function HomeIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z"/></Icon>;
}

export function MapIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/></Icon>;
}

export function SavedIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M6 4h12v17l-6-4-6 4z"/></Icon>;
}

export function ProfileIcon({ size }: { size?: number }) {
  return <Icon size={size}><circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></Icon>;
}

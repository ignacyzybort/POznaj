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
  return <Icon size={size}><path d="M6 4h12v17l-6-4-6 4z" fill={fill ? "currentColor" : "none"} /></Icon>;
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
  return <Icon size={size}><path d="M12 2c.7 3.4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 0-8z" fill={fill ? "currentColor" : "none"} /></Icon>;
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

export function ShuffleIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5"/></Icon>;
}

export function CloseIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M6 6l12 12M18 6 6 18"/></Icon>;
}

export function ChevronIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="m9 6 6 6-6 6"/></Icon>;
}

export function ClockIcon({ size }: { size?: number }) {
  return <Icon size={size}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></Icon>;
}

export function BellIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>;
}

export function SettingsIcon({ size }: { size?: number }) {
  return <Icon size={size}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.5-2.4.8a7 7 0 0 0-1.9-1.1L14 3h-4l-.6 2.6a7 7 0 0 0-1.9 1.1L5.1 6 3.1 9.5l2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.5 2.4-.8c.6.5 1.2.8 1.9 1.1L10 21h4l.6-2.6c.7-.2 1.3-.6 1.9-1.1l2.4.8 2-3.5-2-1.5c.1-.3.1-.7.1-1.1z"/></Icon>;
}

export function EditIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></Icon>;
}

export function PlusIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M12 5v14M5 12h14"/></Icon>;
}

export function TramIcon({ size }: { size?: number }) {
  return <Icon size={size}><rect x="5" y="3" width="14" height="14" rx="2"/><path d="M9 17l-2 4M15 17l2 4M9 7h6M8 13h.01M16 13h.01"/></Icon>;
}

export function BusIcon({ size }: { size?: number }) {
  return <Icon size={size}><rect x="4" y="4" width="16" height="14" rx="2"/><path d="M4 11h16M8 18v2M16 18v2M8 15h.01M16 15h.01"/></Icon>;
}

export function CarIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M5 14l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 14M4 18v-4h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></Icon>;
}

export function CalPlusIcon({ size }: { size?: number }) {
  return <Icon size={size}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17M12 14v4M10 16h4"/></Icon>;
}

export function SunIcon({ size }: { size?: number }) {
  return <Icon size={size}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Icon>;
}

export function CloudIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 12a4 4 0 0 1-1 8H7z"/></Icon>;
}

export function RainIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M7 15a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 9a4 4 0 0 1-1 8H7z"/><path d="M8 19l-1 3M12 19l-1 3M16 19l-1 3"/></Icon>;
}

export function MoonIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z"/></Icon>;
}

export function ArrowIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>;
}

export function RefreshIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M21 12a9 9 0 1 1-2.2-6" strokeLinecap="round" /><path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" /></Icon>;
}

export function CameraIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Icon>;
}

export function CoverIcon({ size }: { size?: number }) {
  return <Icon size={size}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 16l5-5 3 3 4-4 6 6" /><circle cx="9" cy="9" r="1" /></Icon>;
}

export function LockIcon({ size }: { size?: number }) {
  return <Icon size={size}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>;
}

export function PassportIcon({ size }: { size?: number }) {
  return <Icon size={size}><rect x="3" y="3" width="18" height="20" rx="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="11" y2="15" /></Icon>;
}

export function SendIcon({ size }: { size?: number }) {
  return <Icon size={size}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" /></Icon>;
}

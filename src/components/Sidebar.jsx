import { Home, BarChart2, Calendar, Bell, Settings } from 'lucide-react';

const NAV = [
  { icon: Home,      label: 'Home',         active: true  },
  { icon: BarChart2, label: 'Analytics'                   },
  { icon: Calendar,  label: 'Scheduling'                  },
  { icon: Bell,      label: 'Notifications'               },
  { icon: Settings,  label: 'Settings'                    },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col items-center w-16 bg-white border-r border-al-border py-4 gap-1 flex-shrink-0">
      {NAV.map(({ icon: Icon, label, active }) => (
        <button
          key={label}
          title={label}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl gap-1 transition-all
            ${active
              ? 'bg-al-navy/10 text-al-navy'
              : 'text-al-muted hover:text-al-sub hover:bg-al-bg'}`}
        >
          <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
          <span className="text-[9px] font-medium leading-none">{label}</span>
        </button>
      ))}
    </aside>
  );
}

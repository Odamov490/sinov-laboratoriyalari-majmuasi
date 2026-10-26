import React from 'react';
import { ChevronDown } from 'lucide-react';

// One collapsible section of the admin sidebar. The body animates open/closed
// via grid-template-rows 0fr -> 1fr (no fixed max-height to guess), and is
// made `invisible` while collapsed so its links drop out of the tab order.
// `nested` renders a lighter subgroup header (e.g. a laboratory inside Sifat).
export default function AdminMenuGroup({ group, isOpen, onToggle, badgeCount = 0, nested = false, children }) {
  const bodyId = `admin-menu-group-${group.key}`;
  const Icon = group.icon;

  return (
    <div className={nested ? '' : 'pt-2 mt-2 border-t border-white/10'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors ${
          nested ? 'text-xs font-medium text-left' : 'text-[11px] font-semibold uppercase tracking-wider'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{group.label}</span>
        </span>
        <span className="flex items-center gap-2">
          {/* Unread badge stays reachable while the group is collapsed. */}
          {!isOpen && badgeCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold normal-case tracking-normal text-white">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div
        id={bodyId}
        className={`grid transition-all duration-200 ease-in-out ${
          // Open bodies inherit visibility (no explicit `visible`), so an open
          // nested group inside a collapsed parent stays hidden too.
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 invisible'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-1 pt-1 pl-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

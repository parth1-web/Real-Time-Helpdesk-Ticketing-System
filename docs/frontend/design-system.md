# Design System — Helpdesk

SaaS tokens in `src/styles/theme.css` (light/dark via `data-theme`, persisted in Zustand+localStorage).
Bootstrap 5 + React-Bootstrap remain the only UI framework. Lucide icons only.

- Colors: `--primary #4f46e5`, success/warning/danger/info + priority/status/SLA semantic badges with icon+text (never color alone).
- Type: Inter stack; page title bold, secondary muted, metadata small.
- Spacing: Bootstrap `p-/m-/gap-` utilities.
- Components: `PageHeader`, `StatCard` (`.metric-card` hover lift), `StatusBadge/PriorityBadge/SlaBadge`, `UserAvatar` initials, `EmptyState/ErrorState/SkeletonCards`, Bootstrap Modal/Toast/Table/Pagination.
- Responsive: sidebar → offcanvas <992px; `desktop-table` ↔ `mobile-cards`; charts stack 1-col on mobile.
- A11y: labels + `aria-invalid/describedby`, `aria-label` on icon buttons, `:focus-visible`, keyboard `Ctrl+K` search, `Ctrl+Enter` send, `Esc` closes offcanvas.
- Dark: surfaces `#1e293b`, text `#f1f5f9`, charts/tooltips adapt via `data-theme`.
- Feedback: every fetch has loading/skeleton, error+retry, empty+CTA; mutations show sending→toast.

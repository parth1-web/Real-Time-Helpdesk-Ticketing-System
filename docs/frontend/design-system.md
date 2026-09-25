# Design System — Helpdesk (polished)

SaaS tokens in `src/styles/theme.css` + `animations.css` + `responsive.css` + `components.css` + `globals.css`
(light default, dedicated dark, persisted in Zustand+localStorage, `prefers-reduced-motion` respected).
Bootstrap 5 + React-Bootstrap remain the only UI framework. Lucide icons only.

- Colors: `--primary #4f46e5` (+ `--primary-hover`), restrained surfaces; priority/status/SLA badges with icon+text (never color alone).
- Type/spacing: Inter stack, page-title hierarchy, Bootstrap utilities, content max 1600 / forms 800.
- Shell: sectioned sidebar (Overview/Support/Management) with icons, active accent bar, badges, collapse + offcanvas; light topbar with breadcrumb, search + Ctrl+K command palette, Live dot, notification 9+ badge, profile menu with role; offline bar.
- Components: `PageHeader`, `StatCard` (icon+trend+hover lift), `TicketCard` (number/subject/customer/priority/status/SLA/progress/updated/arrow), `FilterChip`, `ConfirmModal`, `SlaProgress`, timeline, skeleton/avatar/message/table variants, toasts with icons.
- Tickets: sticky table headers, urgent left-accent, hover actions, mobile cards, `Showing 1–20 of N` + mobile pager; detail 2-col with role-labeled bubbles, internal-note amber treatment, msg-enter/flash on SignalR, sticky composer with count + Ctrl+Enter, copy-number with Copied!, activity timeline.
- Feedback/notifications: lightweight 1–5 + toast; unread tinted rows, mark read/all, badge invalidation.
- A11y/responsive: labels + `aria-*`, visible focus, keyboard shortcuts, 1920→360 audits, charts stack + dark-aware tooltips.

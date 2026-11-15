# SeatWatch design system, Task 08A

## Scope and decisions

The authenticated shell uses a single semantic token layer in `src/styles/seatwatch-system.css`. Its prefixed variables are on `:root` so portal dialogs inherit the same values without duplicate definitions; only new shell and shared components consume them. New shared primitives live in `src/components/system`. The shell uses a 232px desktop sidebar, a 208px sidebar between 768px and 1100px, and a modal navigation sheet below 768px. The content grid has no fixed mobile offset. Page content still uses its existing components and real API data.

Tailwind CSS 4 is integrated through `@tailwindcss/vite`. Only Tailwind's theme and utilities are imported, avoiding a new global preflight reset over existing pages. The shadcn Vite documentation's plugin approach is used; components are added manually in JavaScript because the existing `components/ui` and `components/common` names and global styles would conflict with generated files. The `@` alias is configured in Vite and `jsconfig.json` for future incremental migration. No chart or animation package is installed.

## Tokens

The `--sw-*` variables define canvas, surfaces, text, accent, status colors, focus ring, spacing (4/8/12/16/24/32px), modest radii (6/8/12px), control heights (40/44px), and one popover elevation. Inter is the shell's typeface. New components should use these semantic variables, not page-specific colors or older `--gold-*` variables. Breakpoints are 768px for the drawer and 1100px for the compact desktop sidebar.

## Shared component contract

- `Button`: variant, size, disabled, loading. Loading exposes busy/status state.
- `Field`: visible label, hint, error, required; generated or supplied ID links the label and description.
- `Dialog` and `Sheet`: controlled open state, title, Radix focus containment, Escape dismissal, and focus return.
- `DropdownMenu`: keyboard menu for account actions.
- `Card` and `Badge`: scoped surface and status styling.
- `Tabs`: Radix tabs for future page migration. The active admin tabs use native tab roles and arrow/Home/End handling so the existing browser workflow remains compatible.

The active management modal keeps its old props while using the new Dialog internally. Active common and authentication inputs now associate labels and errors. This lets management forms keep their API and validation behavior.

## Legacy compatibility and next work

`index.css`, `design-system.css`, the old `components/ui` and `components/common` files, and page CSS remain because live routes still import them. Obsolete `components/styles/Sidebar.css` and `Header.css` are left in place pending a verified cleanup. Task 08B can redesign dashboard content using real statistics. Task 08C should migrate page tables, repeated row actions, remaining dialogs, legacy tokens, and page-specific CSS, then remove unused component/CSS files after checking consumers. The current dashboard cards and management-page spacing are intentionally still legacy.

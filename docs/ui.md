# UI Coding Standards

## Component Library

**Only ShadCN UI components may be used for UI in this project.**

- Do NOT create custom UI components (buttons, inputs, cards, dialogs, etc.)
- Do NOT use any other component libraries
- All UI must be built exclusively from [ShadCN UI](https://ui.shadcn.com/docs/components) components
- If a required component does not yet exist in the project, add it via the ShadCN CLI:
  ```bash
  npx shadcn@latest add <component-name>
  ```

## Date Formatting

Date formatting must use [date-fns](https://date-fns.org/).

Dates must be formatted using ordinal day, abbreviated month, and full year:

| Date | Formatted output |
|------|-----------------|
| September 1, 2025 | 1st Sep 2025 |
| August 2, 2025 | 2nd Aug 2025 |
| January 3, 2025 | 3rd Jan 2025 |
| June 4, 2024 | 4th Jun 2024 |

Use the `do MMM yyyy` format string with `date-fns/format`:

```ts
import { format } from "date-fns";

format(date, "do MMM yyyy"); // e.g. "1st Sep 2025"
```

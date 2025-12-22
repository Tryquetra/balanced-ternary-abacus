# Product Guidelines

## Visual Identity
*   **Aesthetic:** Clean, modern, and dark-themed by default (using `bg-gray-900` and `text-gray-100`). The design should feel digital-native but respectful of the physical Soroban inspiration.
*   **Color Palette:**
    *   **Backgrounds:** Dark grays (`gray-800`, `gray-900`) for depth.
    *   **Accents:** Teal (`teal-300`) for primary actions and headings.
    *   **Bead Indicators:** Distinct colors for active states to aid learning:
        *   **Top (+1):** Blue (`rgb(0, 0, 255)`)
        *   **Bottom (-1):** Red (`rgb(197, 48, 48)`)
        *   **Both Active (Zero):** White (`white`) to signify the cancellation state.
        *   **Inactive:** Green (`#48bb78`) to show potential.

## User Experience (UX)
*   **Interactivity:** Click-based interaction on beads. Feedback should be immediate—visual state change + instant recalculation of total and math notation.
*   **Accessibility:**
    *   Beads must be large enough for touch targets on mobile.
    *   High contrast text for readability.
    *   Keyboard navigation support (future enhancement).
*   **Responsiveness:** The layout must adapt gracefully from desktop monitors to mobile screens, ensuring the abacus rods remain usable without horizontal scrolling if possible, or scroll naturally.

## Writing Style
*   **Tone:** Educational, clear, and encouraging. The text should demystify complex concepts without being patronizing.
*   **Terminology:** Use consistent terms like "Rod" (Haste), "Bead" (Conta), "Balanced Ternary" (Ternário Balanceado).
*   **Bilingualism:** All user-facing text must be available in both English (US) and Portuguese (BR).

## Code Style & Convention
*   **Structure:** Separation of concerns—HTML for structure, CSS (Tailwind + custom) for presentation, JS for logic.
*   **Simplicity:** Avoid heavy frameworks for the core logic; keep the abacus engine lightweight and dependency-free.
*   **Documentation:** Clear comments explaining the mathematical logic (e.g., why a bead move equals +3 or -9).

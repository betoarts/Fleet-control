# Apple Glass UI/UX Redesign

## Goal
Transform Fleet-control into a modern, Apple-inspired webapp featuring Clean Light Glassmorphism, a floating iOS navigation dock, and refined dashboard cards while preserving brand colors.

## Tasks
- [x] Task 1: Update design tokens in `tailwind.config.js` and `index.css` with Apple blur, glass borders, specular highlights, and ambient light background → Verify: CSS compiles without errors and glass utility classes are available
- [x] Task 2: Redesign `components/Layout.tsx` with Apple frosted glass sticky header, floating iOS bottom glass dock, and responsive mobile/desktop frame → Verify: Header blurs content underneath, floating tab bar is centered with haptic feedback styles, desktop shows sleek iPhone wrapper while mobile takes 100dvh
- [x] Task 3: Modernize Dashboard in `App.tsx` with Apple glassmorphism cards (AI Fleet Intelligence, Vehicle Status cards, Trip active cards, and CTA) → Verify: Dashboard renders with translucent frosted cards, crisp typography, and refined status pills
- [x] Task 4: Polish `index.html` typography & viewport tags for iOS PWA immersion → Verify: System fonts and safe-area insets blend seamlessly
- [x] Task 5: Run TypeScript checks and verify visual rendering in browser → Verify: `npm run type-check` passes with zero errors and preview is functional

## Done When
- [x] Layout matches Apple HIG Clean Light Glass aesthetic with glassmorphism, blur effects, and refined floating dock
- [x] Brand colors (NBA Blue & Red) are elevated with glass accents, badges, and subtle gradients
- [x] Webapp looks like a native iOS app on mobile devices and an elegant preview frame on desktop
- [x] `npm run type-check` passes cleanly

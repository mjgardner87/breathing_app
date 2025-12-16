# Innerfire Design System

A sleek, linear, rayscape-inspired design system for a clean, distraction-free breathing experience.

## Design Philosophy

- **Rayscape Aesthetic**: Deep, dark backgrounds (`#0B0C0E`) paired with high-contrast text (`#F2F2F3`) and subtle, glowing accents.
- **Linear/Notion Feel**: Minimalist components, refined typography, and purposeful whitespace.
- **Focus**: The UI is designed to fade away, letting the user focus entirely on their breath.

## Color Palette

The system supports both Dark (default) and Light modes.

### Dark Theme (Deep Frozen Night)
- **Background**: `#0B0C0E` - Deep matte black/gray
- **Elevated**: `#16181C` - Subtle elevation for cards
- **Hover**: `#1E2024` - Interactive state
- **Border**: `#2E3035` - Subtle dividers
- **Text Primary**: `#F2F2F3` - High contrast white
- **Text Secondary**: `#8A8F98` - Muted gray
- **Accent**: `#5E6AD2` - Blurple/Indigo (Rayscape inspired)

### Light Theme (Crisp Air)
- **Background**: `#FFFFFF` - Pure white
- **Elevated**: `#F7F7F5` - Notion-like subtle gray
- **Border**: `#E0E0E0` - Crisp light border
- **Text Primary**: `#37352F` - Notion dark gray
- **Text Secondary**: `#787774` - Notion medium gray
- **Accent**: `#2EAADC` - Clean blue

### Functional Colours
- **Success**: `#4CC38A` (Dark) / `#448361` (Light)
- **Warning**: `#E8B05E` (Dark) / `#D9730D` (Light)
- **Danger**: `#E25555` (Dark) / `#D44C47` (Light)

## Typography

We use the system font stack (`San Francisco` on iOS, `Roboto` on Android) for a native, fast feel.

- **Timer**: 72px / Light (300) / Tabular Nums - *For the main hold timer*
- **Display**: 32px / Semibold (600) / -0.5px tracking - *For headers*
- **Title**: 24px / Semibold (600) / -0.3px tracking - *For section titles*
- **Heading**: 16px / Semibold (600) / -0.2px tracking - *For card headers*
- **Body**: 15px / Regular (400) / 24px line height - *For standard text*
- **Caption**: 13px / Regular (400) / 0.1px tracking - *For helper text*

## Spacing System

Based on a 4px grid.

- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **xxl**: 32px
- **xxxl**: 48px

## Components

### Buttons
Buttons use high-contrast fills in the active theme color (White in Dark mode, Dark Gray in Light mode) with inverted text for maximum visibility.

### Cards
Cards use the `backgroundElevated` color with a 1px `borderSubtle` stroke. Shadows are minimal or non-existent to maintain the flat, linear look.

### Breathing Circle
The core visual component.
- **Animation**: Smooth scaling using `react-native-reanimated`.
- **Style**: A minimal ring that pulses with the breath.
- **Colours**:
  - Dark Mode: Dark Gray (`#2E3035`) → White (`#F2F2F3`)
  - Light Mode: Light Gray (`#E0E0E0`) → Dark Gray (`#37352F`)

## Accessibility

- **Contrast**: All primary text meets WCAG AAA standards.
- **Touch Targets**: Minimum 44x44px for all interactive elements.
- **Dynamic Type**: Text scales with system accessibility settings.
- **Reduced Motion**: The breathing animation is essential but respects system reduction settings where possible.

## Implementation Notes

- **Theming**: Handled via `ThemeContext`. All components must consume `useTheme()` to adapt.
- **Icons**: Custom geometric icons (like the Logo) are built with Views to avoid heavy icon font dependencies.
- **Performance**: Heavy animations (Breathing Circle) run on the UI thread using Reanimated 2.

## Future Enhancements

- [ ] Haptic feedback integration for breath pacing.
- [ ] Custom soundscapes (ambient background noise).
- [ ] Apple Health / Google Fit integration.

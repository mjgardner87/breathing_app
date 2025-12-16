# BreathingApp Design System

Linear/Notion-inspired design system for a clean, professional, and minimal UI.

## Color Palette

### Background
- **Primary Background**: `#0d0d0d` - Pure black base
- **Elevated Background**: `#161616` - Cards and elevated surfaces
- **Hover Background**: `#1a1a1a` - Interactive hover states

### Borders
- **Border**: `#2a2a2a` - Standard borders
- **Border Subtle**: `#1a1a1a` - Subtle dividers

### Text
- **Primary Text**: `#e6e6e6` - Main content
- **Secondary Text**: `#999999` - Supporting text
- **Tertiary Text**: `#666666` - Disabled/placeholder text

### Accent Colors
- **Primary**: `#5e6ad2` - Linear purple (buttons, links)
- **Primary Hover**: `#6b75db` - Hover state
- **Success**: `#26b5ce` - Cyan (positive actions)
- **Warning**: `#f5a623` - Orange (warnings)
- **Danger**: `#ff6b6b` - Red (destructive actions)

### Breathing Circle
- **Start**: `#5e6ad2` - Purple gradient start
- **End**: `#26b5ce` - Cyan gradient end

## Typography

### Display
- **Font Size**: 32px
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: -0.5px
- **Usage**: Page titles, main headings

### Title
- **Font Size**: 24px
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: -0.3px
- **Usage**: Section titles

### Heading
- **Font Size**: 18px
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: -0.2px
- **Usage**: Card titles, button text

### Body
- **Font Size**: 15px
- **Font Weight**: 400 (Regular)
- **Line Height**: 22px
- **Usage**: Regular text

### Body Medium
- **Font Size**: 15px
- **Font Weight**: 500 (Medium)
- **Line Height**: 22px
- **Usage**: Emphasized body text

### Caption
- **Font Size**: 13px
- **Font Weight**: 400 (Regular)
- **Line Height**: 18px
- **Usage**: Help text, metadata

### Timer
- **Font Size**: 64px
- **Font Weight**: 300 (Light)
- **Letter Spacing**: -2px
- **Usage**: Large numerical displays

## Spacing Scale

- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **xxl**: 32px
- **xxxl**: 48px

## Border Radius

- **sm**: 6px - Small elements
- **md**: 8px - Standard buttons, inputs
- **lg**: 12px - Cards, large buttons
- **xl**: 16px - Modals, containers

## Shadows

### Small Shadow
```typescript
{
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 1},
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 2,
}
```

### Medium Shadow
```typescript
{
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 4,
}
```

## Component Patterns

### Buttons

#### Primary Button
```typescript
{
  backgroundColor: theme.colours.primary,
  paddingVertical: theme.spacing.lg,
  paddingHorizontal: theme.spacing.xl,
  borderRadius: theme.borderRadius.lg,
  ...theme.shadows.sm,
}
```

#### Secondary Button
```typescript
{
  backgroundColor: theme.colours.backgroundElevated,
  paddingVertical: theme.spacing.lg,
  paddingHorizontal: theme.spacing.xl,
  borderRadius: theme.borderRadius.lg,
  borderWidth: 1,
  borderColor: theme.colours.border,
}
```

### Cards
```typescript
{
  backgroundColor: theme.colours.backgroundElevated,
  padding: theme.spacing.lg,
  borderRadius: theme.borderRadius.lg,
  borderWidth: 1,
  borderColor: theme.colours.border,
}
```

### Icon Buttons
```typescript
{
  width: 40,
  height: 40,
  borderRadius: theme.borderRadius.md,
  backgroundColor: theme.colours.backgroundElevated,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: theme.colours.border,
}
```

### Modals
```typescript
{
  backgroundColor: theme.colours.backgroundElevated,
  borderRadius: theme.borderRadius.xl,
  padding: theme.spacing.xxl,
  borderWidth: 1,
  borderColor: theme.colours.border,
}
```

## Design Principles

### 1. Clarity
- Use clear visual hierarchy
- Maintain consistent spacing
- Ensure sufficient contrast for readability

### 2. Minimalism
- Remove unnecessary elements
- Use whitespace effectively
- Focus on essential information

### 3. Consistency
- Apply design system uniformly
- Use consistent spacing and sizing
- Maintain predictable interactions

### 4. Accessibility
- Ensure text contrast meets WCAG standards
- Provide clear touch targets (min 44x44px)
- Use semantic color meanings

### 5. Performance
- Optimize animations (60fps)
- Use native components where possible
- Minimize re-renders

## Screen-Specific Guidelines

### Dashboard
- Large, clear stats cards
- Prominent "Start Session" button
- Scrollable session history
- Minimal chrome, focus on content

### Settings
- Grouped settings in cards
- Large, readable values
- Sliders with clear labels
- Help text for guidance

### Session
- Minimal UI during breathing
- Large, readable timer
- Circular "Done" button for holds
- Clean phase transitions

## Accessibility

### Color Contrast
- Text on background: 13.5:1 (AAA)
- Secondary text: 7.5:1 (AA)
- Tertiary text: 4.5:1 (AA)

### Touch Targets
- Minimum size: 44x44px
- Adequate spacing between interactive elements
- Clear visual feedback on interaction

### Typography
- Scalable font sizes
- Sufficient line height (1.5x for body text)
- Clear visual hierarchy

## Implementation Notes

### React Native Compatibility
- Avoid using `gap` property (not supported in RN < 0.71)
- Use `marginHorizontal`/`marginVertical` for spacing
- Test on both iOS and Android

### Performance
- Use `memo` for expensive components
- Optimize re-renders with `useMemo`/`useCallback`
- Keep animations at 60fps

### Theming
- All colors from `theme.colours`
- All spacing from `theme.spacing`
- All typography from `theme.typography`
- Never hardcode values

## Future Enhancements

### Potential Additions
- [ ] Dark/Light mode toggle
- [ ] Custom color themes
- [ ] Accessibility settings (larger text, high contrast)
- [ ] Animation speed controls
- [ ] Haptic feedback options

### Component Library
- [ ] Reusable Button component
- [ ] Reusable Card component
- [ ] Reusable Modal component
- [ ] Reusable Input component

## Resources

- [Linear Design System](https://linear.app/design-system)
- [Notion Design Principles](https://www.notion.so/design)
- [Material Design 3](https://m3.material.io/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

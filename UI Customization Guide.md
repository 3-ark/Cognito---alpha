# UI Customization Guide for Bruside Extension

This document explains how to customize various UI elements in the Bruside Chrome extension, which uses Chakra UI as its primary component library.

## Table of Contents
1. [Theme System Overview](#theme-system-overview)
2. [Customizing Colors](#customizing-colors)
3. [Component Styling](#component-styling)
4. [Typography](#typography)
5. [Special Elements](#special-elements)
6. [Troubleshooting](#troubleshooting)

## Theme System Overview

The extension uses a dual theming system:
- **CSS Variables** (for global styles)
- **Chakra UI Theme** (for component styles)

Key CSS variables:
```css
:root {
  --bg: #F5E9D5;        /* Background color */
  --active: #dcc299;    /* Active/highlight color */
  --text: #5B4636;      /* Primary text color */
  --bold: #af1b1b;      /* Strong text color */
  --italic: #09993e;    /* Emphasized text color */
  --link: #003bb9;      /* Link color */
}
```

## Customizing Colors

### 1. Preset Themes
Located in `Themes.tsx`:
```tsx
export const themes = [
  {
    name: 'paper', 
    active: '#dcc299', 
    bg: '#F5E9D5', 
    text: '#5B4636'
  },
  // ...other themes
];
```

### 2. Custom Theme
Custom colors can be set through the UI and are stored in:
```tsx
customTheme: {
  active: '#C2E7B5',
  bg: '#c2e7b5',
  text: '#333333'
}
```

## Component Styling

### 1. Buttons
Example from `Header.tsx`:
```tsx
<Button
  _hover={{ 
    background: 'var(--active)', 
    border: '2px solid var(--text)' 
  }}
  background="var(--active)"
  border="2px solid var(--text)"
  borderRadius={16}
  color="var(--text)"
>
  Click me
</Button>
```

### 2. Select Boxes
Styled in `Header.tsx` with special options styling:
```tsx
<Select
  sx={{
    '> option': {
      background: 'var(--bg)',
      color: 'var(--text)',
      '--option-bg-contrast': 'color-mix(in srgb, var(--text) 20%, var(--bg))'
    },
  }}
  _hover={{
    borderColor: 'var(--text)', 
    background: 'var(--active)' 
  }}
  background="transparent"
  border="2px solid var(--text)"
>
  {/* options */}
</Select>
```

### 3. Input Fields
Example from `Input.tsx`:
```tsx
<Input
  border="2px solid var(--text)"
  _focus={{
    borderColor: 'var(--text)',
    boxShadow: 'none'
  }}
/>
```

## Typography

### 1. Font Family
Set in `index.html`:
```html
<style>
:root {
  font-family: 'Poppins', sans-serif;
}
</style>
```

### 2. Text Components
Custom Markdown components in `Message.tsx`:
```tsx
const P = ({ children }: ParagraphProps) => (
  <p style={{
    paddingTop: 0,
    paddingBottom: '0.2rem',
    wordBreak: 'break-word'
  }}>{children}</p>
);
```

## Special Elements

### 1. Paper Texture
Applied via pseudo-elements:
```tsx
sx={{
  '&::before': {
    content: '""',
    backgroundImage: 'url(assets/images/paper-texture.png)',
    opacity: 0.3,
    mixBlendMode: 'multiply'
  }
}}
```

### 2. Message Bubbles
Styled in `Message.tsx` with:
- Background alternation
- Texture overlay
- Border styling

## Troubleshooting

### Common Issues

1. **Styles not applying**:
   - Check if the component uses `sx` vs `style` prop
   - Verify CSS variable names match

2. **Select options not styled**:
   - Ensure the `sx` prop targets `> option` specifically

3. **Hover states not working**:
   - Use Chakra's `_hover` prop instead of CSS `:hover`

### Development Tips

1. Use Chrome DevTools to inspect:
   - Computed styles
   - CSS variable values
   - Pseudo-elements

2. For Chakra-specific components:
   - Right-click → "Store as global variable"
   - Inspect `$0.__chakraProps` in console

3. Check the Chakra UI docs for:
   - Component-specific props
   - Style configuration options

## Advanced Customization

To modify the Chakra theme globally, edit `index.tsx`:
```tsx
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false
  },
  // Add other theme overrides here
});
```

[Comprehensive UI Customization Guide for Bruside Extension.md](https://github.com/3-ark/Bruside/blob/main/Comprehensive%20UI%20Customization%20Guide%20for%20Bruside%20Extension.md)
Remember that most visual styling should be done through the theme system and CSS variables rather than direct component overrides for maintainability.

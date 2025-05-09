# Comprehensive UI Customization Guide for Cognito Extension

## Expanded Theme System Documentation

### 1. Theme Configuration (Themes.tsx)
The complete theme system includes:

```tsx
export const themes = [
  {
    name: 'paper', 
    active: '#dcc299', 
    bg: '#F5E9D5', 
    text: '#5B4636'
  },
  {
    name: 'smoke', 
    active: '#bab8b8', 
    bg: '#dfdfdf', 
    text: '#333'
  },
  {
    name: 'moss', 
    active: '#a4b086', 
    bg: '#EFD6AC', 
    text: 'black'
  },
  {
    name: 'custom', 
    active: '#C2E7B5', 
    bg: '#c2e7b5', 
    text: '#333'
  }
];
```

### 2. Theme Application Logic (ConfigContext.tsx)
The theme application flow:

1. **Initialization**:
```tsx
const defaultConfig: Config = {
  theme: 'paper',
  customTheme: themes.find(t => t.name === 'custom'),
  // ...other defaults
};
```

2. **Theme Application**:
```tsx
useEffect(() => {
  const themeToApply = config.theme === 'custom'
    ? { name: 'custom', ...config.customTheme }
    : themes.find(t => t.name === config.theme) || themes[0];
  setTheme(themeToApply);
}, [config.theme, config.customTheme]);
```

## Complete Component Styling Guide

### 1. Accordion Settings Panel (Settings.tsx)
Structure and styling:
```tsx
<Accordion
  defaultIndex={defaultIndex}
  marginTop={4}
  maxWidth="512px"
  width="100%"
  allowToggle
  reduceMotion
>
  <Themes />
  <Connect />
  <Persona />
  {/* Other sections */}
</Accordion>
```

### 2. Main App Container (Cognito.tsx)
Key layout components:
```tsx
<Container
  maxWidth="100%"
  minHeight="100vh"
  padding={0}
  textAlign="center"
>
  <Box display="flex" flexDir="column" minHeight="100vh">
    <Header {...props} />
    {settingsMode && <Settings />}
    {!settingsMode && <Messages />}
    {config?.backgroundImage && <Background />}
  </Box>
</Container>
```

## Advanced Customization Areas

### 1. Font Size Control (Themes.tsx)
Slider implementation:
```tsx
<Slider
  defaultValue={currentFontSize}
  min={7}
  max={20}
  onChange={(e) => updateConfig({ fontSize: e })}
>
  <SliderTrack background="var(--text)">
    <SliderFilledTrack background="var(--text)" />
  </SliderTrack>
  <SliderThumb background="var(--text)" style={{ zoom: 1.5 }} />
</Slider>
```

### 2. Custom Theme Picker (Themes.tsx)
Complete implementation:
```tsx
<Popover>
  <Tooltip label="custom">
    <Box display="inline-block">
      <PopoverTrigger>
        <Button
          _hover={{ background: customTheme.active }}
          background={customTheme.active}
          border="2px solid var(--text)"
          borderRadius={16}
        />
      </PopoverTrigger>
    </Box>
  </Tooltip>
  <PopoverContent>
    <PopoverHeader>Custom Theme Colors</PopoverHeader>
    <PopoverBody>
      <Flex direction="column" gap={2}>
        <ColorPickerField label="Background" value={customTheme.bg} onChange={/*...*/} />
        <ColorPickerField label="Text" value={customTheme.text} onChange={/*...*/} />
        <ColorPickerField label="Active" value={customTheme.active} onChange={/*...*/} />
      </Flex>
    </PopoverBody>
  </PopoverContent>
</Popover>
```

## UI Behavior Customization

### 1. Chat Mode Selection (Cognito.tsx)
Initial state buttons:
```tsx
<Box bottom="4rem" left="0.5rem" position="absolute">
  <MessageTemplate onClick={() => updateConfig({ chatMode: 'web' })}>
    Web
  </MessageTemplate>
  <MessageTemplate onClick={() => updateConfig({ chatMode: 'page' })}>
    Page
  </MessageTemplate>
</Box>
```

### 2. Page Interaction Buttons (Cognito.tsx)
Contextual actions:
```tsx
<Box bottom="4rem" left="0.5rem" position="absolute">
  <MessageTemplate onClick={async () => await onSend('Find Data')}>
    Data
  </MessageTemplate>
  <MessageTemplate onClick={async () => await onSend('Get Summary')}>
    Info
  </MessageTemplate>
</Box>
```

## Configuration Persistence

### 1. Saving Mechanism (ConfigContext.tsx)
```tsx
const updateConfig = (newConfig: Partial<Config>) => {
  setConfig(prev => {
    const updated = { ...prev, ...newConfig };
    storage.setItem('config', JSON.stringify(updated));
    return updated;
  });
};
```

### 2. Reset Functionality (Cognito.tsx)
```tsx
const reset = () => {
  setMessages([]);
  setPageContent('');
  setWebContent('');
  updateConfig({ chatMode: undefined });
  setChatId(generateChatId());
};
```

## Visual Texture System

### 1. Paper Texture Application
Implemented in multiple components:
```tsx
sx={{
  '&::before': {
    backgroundImage: 'url(assets/images/paper-texture.png)',
    backgroundSize: '512px',
    opacity: 0.3,
    mixBlendMode: 'multiply'
  }
}}
```

### 2. Background Image (Background.tsx)
```tsx
<Image
  src="assets/images/Cognito.jpg"
  style={{ 
    filter: 'opacity(0.03)',
    zoom: '1.2'
  }}
/>
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **Theme not applying on load**:
   - Check `ConfigContext.tsx` initialization
   - Verify `storage.getItem('config')` parsing

2. **Custom colors not saving**:
   - Ensure `updateConfig` is called with both:
     ```tsx
     updateConfig({ 
       customTheme: newValues,
       theme: 'custom' // Must set theme to custom
     });
     ```

3. **Component styles not updating**:
   - Verify CSS variable usage:
     ```tsx
     background="var(--bg)" 
     // vs
     backgroundColor="var(--bg)"
     ```

4. **Texture not appearing**:
   - Check image path in `assets/images/`
   - Verify `z-index` stacking context

## Best Practices

1. **Styling Priority**:
   - Use Chakra props first (`bg`, `color`)
   - Fall back to `sx` for complex styles
   - Use `style` only for dynamic values

2. **Theme Consistency**:
   - Always reference CSS variables
   - Maintain contrast ratios
   - Test all theme combinations

3. **Performance**:
   - Limit texture opacity (0.3-0.5)
   - Use `reduceMotion` where appropriate
   - Memoize expensive components

This comprehensive guide covers all aspects of UI customization across the extension's components. The system is designed to be flexible while maintaining visual consistency across all interface elements.

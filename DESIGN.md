---
name: HyperFrames
description: Minimalist design framework for cinematic video applications.
colors:
  primary: "#141414"
  bg: "#0a0a0a"
  surface: "#141414"
  surface2: "#1a1a1a"
  border: "#2a2a2a"
  border-light: "#3a3a3a"
  text: "#e5e5e5"
  text-secondary: "#a0a0a0"
  text-tertiary: "#666666"
  heading: "#f5f5f5"
  code-bg: "#141414"
  accent-green: "#22c55e"
  accent-blue: "#3b82f6"
  accent-purple: "#a78bfa"
typography:
  h1:
    fontFamily: Inter
  body-md:
    fontFamily: Inter
  label-caps:
    fontFamily: IBM Plex Mono
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  btn-primary:
    backgroundColor: "{colors.heading}"
    textColor: "#0a0a0a"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
---

## Overview
The HyperFrames aesthetic is flat, dark, and highly minimal. It avoids aggressive drop-shadows and brutalist gradients, favoring clean lines and sophisticated dark-mode palettes.

## Colors
The color palette uses deep charcoals offset by vibrant accents for actionable areas.
- **Primary:** Deep charcoals for foundational backbones.
- **Background (#0a0a0a):** Primary backdrop.
- **Surface (#141414):** Cards, inputs, elevated sections.
- **Accents:** Green, Blue, Purple for badges and interactions.

## Typography
- **Inter:** The core sans-serif for headings and readable body strings.
- **IBM Plex Mono:** Distinct monospace for technical metadata and terminal blocks.

## Layout
Spacing is tightly bound using fractional margins (4px/8px loops).

## Components
- **btn-primary:** Flat action buttons, dark text on heading background, triggering an opacity fade on hover.
- **card:** 1px solid bordered containers capturing content securely.



# WJ Vision E-Bikes Platform — Implementation Plan

## Overview
A premium e-bike platform with minimalist Dutch luxury design, inspired by VanMoof and Cowboy. Focus on cinematic animations, scroll-driven interactions, and a seamless e-commerce experience.

---

## Phase 1: Foundation & Design System

### Global Configuration
- **Color Palette**: Deep Black (#020202), Forest (#08150d), WJ Green accent (#058c42), Neutral base (#f3eff5)
- **Typography**: Inter font family with generous tracking and high-contrast sizing
- **Theme Engine**: Dark mode as default with smooth Light mode toggle
- **Animation Library**: Framer Motion for scroll-triggered reveals and micro-interactions

---

## Phase 2: The Interactive Entrance

### Animated Loader
- Minimalist e-bike wireframe that progressively fills with WJ Green (#058c42)
- Loading progress bar synced with wireframe animation
- Smooth zoom-in transition that morphs into the Hero section

---

## Phase 3: Landing Page Sections

### Hero Section (Cinematic Lifestyle)
- Full-screen video background placeholder (muted, looping Amsterdam sunrise aesthetic)
- Transparent glassmorphism navigation bar
- Headline: "Your journey in the Netherlands, elevated to a state of art."
- CTA button with glass effect: "Discover My Journey"

### Features Showcase Section
- Scroll-triggered feature reveals (like Cowboy's technology showcase)
- Split layout: text callouts on left, product detail imagery on right
- Animated feature list that highlights on scroll

### E-Pass Membership Section
- Sleek comparison table: Basic / E-Pass Silver / E-Pass Black
- Physical membership card visual (black matte with gold QR code mockup)
- Glassmorphism card effects with hover animations

### Quick Actions Grid
- Four action cards: Test Ride / Accessories / Find Store / Browse Deals
- Subtle hover animations and icon transitions

---

## Phase 4: Product Catalog & Gallery

### Product Listing Page ("The Gallery")
- Model filter chips (like VanMoof's product selector)
- Product cards with hover zoom and quick-view animations
- Floating price indicators

### Product Detail Page (Scroll-Driven Experience)
- Bike stays centered while scrolling
- Part zoom-ins with text callouts (Motor, Seat, Frame welds)
- Feature tags that animate in on scroll
- Color/variant selector with visual swatches
- Floating purchase bar: [Model] + [E-Pass] + [Total Price]

---

## Phase 5: E-Commerce Integration

### Shopify Connection
- Product catalog sync with inventory management
- Variant handling (colors, frame sizes)
- Secure Shopify checkout integration

### One-Step Checkout Experience
- Clean split layout: Shipping form (left) / Order summary (right)
- "Reserved for you" psychology messaging
- Real-time order total updates

---

## Phase 6: Owner's Portal (Demo Mode)

### Simulated Dashboard
- Visual mockup of bike health widgets
- Maintenance timeline display
- E-ID digital passport preview (rotating 3D card effect)
- "Sell with E-ID" feature demonstration

---

## Design & Animation Details

### Scroll Animations
- Component fade-in reveals on scroll entry
- Parallax effects on hero and product sections
- Smooth 0.6s ease-in-out transitions throughout

### Interactive Elements
- Glassmorphism buttons and cards
- Hover scale effects on products
- Mouse-follow effects on E-ID card preview

### Mobile Optimization
- Mobile-first responsive design
- Optimized vertical video placeholder for mobile hero
- Touch-friendly interactions and navigation

---

## Technology Stack
- **React + TypeScript + Tailwind CSS**
- **Framer Motion** for animations
- **Shopify** for e-commerce backend
- **Dark/Light theme** with CSS variables


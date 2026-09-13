# Accessibility and responsive verification

Eigenflow targets WCAG 2.1 AA for its recruiter-facing interactive experience.
This audit covers the production Docker build as of 2026-09-13.

## Automated checks

`frontend/src/accessibility.test.tsx` runs axe-core against the completed state of
all three experiments. The test keeps `color-contrast` disabled because JSDOM
does not provide rendered color calculations; contrast is checked separately
below.

Run the automated guard with:

```powershell
cd frontend
npm test -- --run src/accessibility.test.tsx
```

The component suite also verifies the skip-link destination, chart names,
ordered spectrum values, current values for every graph node, and reduced-motion
playback behavior.

## Manual checklist

### Keyboard and focus

- [x] `Tab` from the page start reveals a high-contrast skip link.
- [x] Activating the skip link focuses the named **Interactive experiment**
      region without adding it to the normal tab order.
- [x] Experiment selection, source selection, parameter sliders, mode selection,
      playback, timeline scrubbing, and resets are keyboard operable.
- [x] Focus order follows the visual workflow and every enabled control has a
      visible amber focus indicator.
- [x] Disabled actions remain identifiable and are skipped by keyboard focus.

### Screen-reader semantics

- [x] The Chromium accessibility tree exposes one page heading followed by
      ordered section headings and named control groups.
- [x] The network SVG has a concise name and time-dependent description.
- [x] A screen-reader-only table exposes the current value of every node; tiny
      floating-point noise is presented as `0.000` rather than `-0.000`.
- [x] Time, source, hottest node, and total heat remain available as text.
- [x] The spectrum SVG has an equivalent ordered value list and a textual
      algebraic-connectivity status.
- [x] Fiedler partition membership and unavailable-state explanations do not
      depend on color.
- [x] Automatic playback suppresses per-frame live-region announcements.

### Contrast and non-color cues

Token pairs were checked against their darkest applicable foreground/background
combination:

| Use | Contrast | Requirement |
| --- | ---: | ---: |
| Strong text on raised surface | 15.43:1 | 4.5:1 |
| Muted text on raised surface | 7.53:1 | 4.5:1 |
| Faint text on raised surface | 4.60:1 | 4.5:1 |
| Amber focus/selection on raised surface | 9.63:1 | 3:1 |
| Strong control boundary on raised surface | 3.21:1 | 3:1 |

Heat uses the perceptually ordered Cividis scale, but the node-value table and
summary provide the equivalent state. Partition groups combine color with stroke
style and textual membership.

### Reduced motion

- [x] With `prefers-reduced-motion: reduce`, automatic playback is disabled.
- [x] The interface explains why playback is unavailable while preserving manual
      timeline scrubbing and every computed result.
- [x] Smooth scrolling and non-essential transition/animation durations are
      suppressed.

### Responsive layouts

The production image was inspected in Chromium at 320, 768, 1024, and 1440 CSS
pixels.

- [x] No viewport produced document-level horizontal overflow.
- [x] No button, select, or slider extended outside the viewport.
- [x] At 320px and 768px, every interactive control has a minimum 44px target.
- [x] The graph, legend, playback controls, and explanatory content reflow without
      clipping.
- [x] At 320px, the ordered spectrum values use a contained horizontal scroller;
      the page itself does not scroll horizontally.
- [x] The desktop two-column composition becomes a single-column experiment-first
      flow below 840px.

## Browser verification result

The final production container reported no browser console errors or warnings.
Keyboard traversal, exact-width layout metrics, the accessibility tree, and
reduced-motion emulation all passed in Chrome 152.

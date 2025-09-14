# Resume Panel Components

This folder contains different styling versions of the resume panel component.

## Structure

- `ResumePanel.tsx` - Master component that acts as a pipeline/selector
- `ResumePanel1.tsx` - Classic style (original design)
- `ResumePanel2.tsx` - Modern style (cards, gradients, timeline)
- `ResumePanel3.tsx` - Minimalist style (clean typography, minimal design)
- `index.ts` - Export file for the master component

## Usage

The master `ResumePanel` component automatically handles version selection and renders the appropriate style. Users can switch between different resume styles using the selector in the header.

## Adding New Versions

To add a new resume style:

1. Create `ResumePanelX.tsx` (where X is the next number)
2. Add it to the `RESUME_VERSIONS` array in `ResumePanel.tsx`
3. Follow the same interface pattern as existing components

## Styles

- **Classic (Panel 1)**: Traditional resume layout with clean borders and standard typography
- **Modern (Panel 2)**: Card-based design with gradients, timeline, and modern UI elements
- **Minimalist (Panel 3)**: Clean, typography-focused design with minimal visual elements
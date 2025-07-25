# Diazepam Metabolism 3D Visualization

An interactive 3D visualization of diazepam metabolism, showing how diazepam metabolizes into its three main metabolites through hepatic oxidation.

## Features

- **3D Molecular Visualization**: Interactive spheres representing diazepam and its metabolites
- **Animated Metabolism Process**: Watch the transformation from diazepam to its metabolites
- **Interactive Hover Effects**: Hover over molecules to see enhanced rim lighting
- **Drug Information Panel**: Click on molecules to view detailed information including:
  - Half-life
  - Active/inactive status
  - Metabolizing enzymes
- **Smooth Animations**: Flowing particles show metabolic pathways
- **Responsive Controls**: 
  - Drag to rotate the scene
  - Scroll to zoom in/out
  - Click molecules for information

## Metabolites Visualized

1. **Diazepam** (Parent compound - blue)
   - Half-life: 20-100 hours
   - Active: Yes
   - Enzymes: CYP2C19, CYP3A4

2. **Nordiazepam** (Orange metabolite)
   - Half-life: 50-120 hours
   - Active: Yes
   - Enzymes: CYP3A4

3. **Temazepam** (Green metabolite)
   - Half-life: 8-22 hours
   - Active: Yes
   - Enzymes: UGT2B7, UGT2B15

4. **Oxazepam** (Orange metabolite)
   - Half-life: 6-25 hours
   - Active: Yes
   - Enzymes: UGT2B7, UGT2B15

## Technologies Used

- **Three.js**: 3D graphics and animations
- **WebGL**: Hardware-accelerated 3D rendering
- **Custom GLSL Shaders**: Fresnel-based rim lighting for consistent glow effects

## How to Run

Simply open `index.html` in a modern web browser. No server setup required.

## Browser Compatibility

Works best in modern browsers with WebGL support:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Controls

- **Mouse Drag**: Rotate the view
- **Mouse Wheel**: Zoom in/out
- **Hover**: Highlight molecules with enhanced glow
- **Click**: Show drug information panel
- **Start Metabolism Button**: Begin the animation
- **Reset Button**: Reset to initial state

## Future Enhancements

- Add more metabolic pathways
- Include minor metabolites
- Add molecular structure diagrams
- Implement VR support
- Add educational annotations
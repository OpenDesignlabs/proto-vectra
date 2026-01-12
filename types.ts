
export type ComponentType = 'container' | 'text' | 'button' | 'image' | 'video' | 'input';

export interface Interaction {
  type: 'none' | 'alert' | 'link' | 'scroll' | 'log' | 'setState' | 'api';
  trigger: 'click' | 'view' | 'mouseEnter' | 'mouseLeave' | 'submit';
  value: string;
  threshold?: number; // 0-1
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiUrl?: string;
}

export interface Breakpoint {
  id: string;
  name: string;
  width: string; // e.g., '100%', '768px'
  height?: string; // e.g. '812px'
  type: 'desktop' | 'mobile' | 'tablet' | 'foldable' | 'ultrawide' | 'custom';
  icon: string;
}

// --- CMS & Data Integration Types ---

export type CMSFieldType = 'text' | 'image' | 'number' | 'date';

export interface CMSField {
  id: string;
  name: string;
  type: CMSFieldType;
}

export interface CMSItem {
  id: string;
  [key: string]: any;
}

export interface CMSCollection {
  id: string;
  name: string;
  fields: CMSField[];
  items: CMSItem[];
}

export interface DataBinding {
  collectionId?: string; // If null, assume current context
  fieldId: string;
}

// ------------------------------------

export interface StyleConfig {
  // Layout
  display?: 'flex' | 'block' | 'grid';
  flexDirection?: 'row' | 'col';
  justifyContent?: 'start' | 'center' | 'end' | 'between';
  alignItems?: 'start' | 'center' | 'end';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;
  gap?: number;
  
  // Grid (Advanced)
  gridCols?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
  
  // Position (Advanced)
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: number | 'auto';
  right?: number | 'auto';
  bottom?: number | 'auto';
  left?: number | 'auto';
  zIndex?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';

  // Spacing (Box Model)
  paddingAll?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  
  marginAll?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;

  // Sizing
  width?: 'auto' | 'full' | '1/2' | '1/3' | '2/3' | 'screen' | '16' | '32' | '64' | '96';
  height?: 'auto' | 'full' | 'screen' | '16' | '32' | '64' | '96'; 
  
  // Typography
  fontFamily?: 'sans' | 'serif' | 'mono' | 'roboto';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '4xl';
  fontWeight?: 'normal' | 'medium' | 'bold' | 'extrabold';
  lineHeight?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textShadow?: 'none' | 'sm' | 'md' | 'lg';

  // Appearance
  backgroundColor?: string;
  backgroundGradient?: 'none' | 'sunset' | 'ocean' | 'cotton-candy' | 'midnight' | 'gunmetal';
  backgroundImage?: string;
  backgroundSize?: 'auto' | 'cover' | 'contain';
  
  objectFit?: 'contain' | 'cover' | 'fill'; 
  mixBlendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'difference';
  
  // Borders
  borderWidth?: number; 
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  
  // Effects & Transforms
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number; 
  rotate?: number; // 0-360 (Z axis)
  rotateX?: number; // 0-360 (X axis)
  rotateY?: number; // 0-360 (Y axis)
  perspective?: number; // px value
  scale?: number; // 0.5-2
  translateX?: number;
  translateY?: number;
  skewX?: number;
  skewY?: number;
  
  // Advanced 3D Context
  transformStyle?: 'flat' | 'preserve-3d';
  backfaceVisibility?: 'visible' | 'hidden';
  transformOrigin?: string;
  
  cursor?: 'auto' | 'default' | 'pointer' | 'move' | 'not-allowed';
  
  // Filters
  blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backdropBlur?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  brightness?: number; // 100 default
  contrast?: number; // 100 default
  grayscale?: number; // 0 default
  saturate?: number; // 100 default
  sepia?: number; // 0 default

  // Animation & Motion
  animation?: 'none' | 'fade-in' | 'slide-up' | 'zoom-in' | 'bounce-in' | 'float' | 'breathe' | 'pulse-slow' | 'spin-slow' | 'wiggle' | 'ticker' | 'gradient-xy';
  transitionDuration?: 0 | 75 | 100 | 150 | 200 | 300 | 500 | 700 | 1000;
  animationDelay?: number; // ms
  animationTimingFunction?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  scrollTrigger?: boolean; // If true, animation plays only when in view
}

export interface ComponentData {
  id: string;
  name: string; // User-defined name
  type: ComponentType;
  tagName?: string; // HTML tag name override (e.g., 'section', 'form', 'article')
  props: Record<string, any>;
  customClassName?: string; // Raw Tailwind classes
  
  // Responsive Styles
  styleConfig: StyleConfig; // Base/Desktop
  
  // Legacy responsive props (kept for compatibility)
  mobileStyleConfig?: StyleConfig;
  tabletStyleConfig?: StyleConfig;
  
  // New Generic Responsive Map
  breakpoints?: Record<string, StyleConfig>; // key = breakpoint id

  // Interaction States
  hoverStyleConfig?: StyleConfig; 
  focusStyleConfig?: StyleConfig;
  activeStyleConfig?: StyleConfig;
  
  // Custom States
  customStates?: Record<string, StyleConfig>; // key = state name (e.g., 'toggled')

  children: ComponentData[];
  parentId: string | null;
  interactions?: Interaction;

  // Data Integration
  repeatConfig?: { collectionId: string }; // If set, this container repeats for each item
  bindings?: Record<string, DataBinding>; // Map prop name (e.g. 'text') to data field
}

export interface DragItem {
  type: string; 
}

export interface AuditIssue {
  id: string;
  nodeId: string;
  severity: 'high' | 'medium' | 'low';
  category: 'performance' | 'bundle' | 'accessibility' | 'structure';
  title: string;
  description: string;
  suggestion?: string;
}

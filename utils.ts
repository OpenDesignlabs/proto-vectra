
import { ComponentData, ComponentType, StyleConfig, AuditIssue } from './types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const findNode = (node: ComponentData, id: string): ComponentData | null => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
};

export const updateNode = (root: ComponentData, id: string, updater: (node: ComponentData) => ComponentData): ComponentData => {
  if (root.id === id) return updater(root);
  return {
    ...root,
    children: root.children.map(child => updateNode(child, id, updater))
  };
};

export const cloneNode = (node: ComponentData, newParentId: string | null): ComponentData => {
  const newId = generateId();
  return {
    ...node,
    id: newId,
    name: `${node.name} (Copy)`,
    parentId: newParentId,
    children: node.children.map(child => cloneNode(child, newId))
  };
};

export const removeNode = (root: ComponentData, id: string): ComponentData | null => {
  if (root.id === id) return null;
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== id)
      .map(child => removeNode(child, id))
      .filter((child): child is ComponentData => child !== null)
  };
};

export const moveNode = (root: ComponentData, nodeId: string, newParentId: string, index: number = -1): ComponentData => {
  const nodeToMove = findNode(root, nodeId);
  if (!nodeToMove) return root;

  // Prevent moving root or into self
  if (nodeToMove.id === newParentId || nodeToMove.id === 'root') return root;

  const isMovingIntoChild = (parent: ComponentData, targetId: string): boolean => {
      if (parent.id === targetId) return true;
      return parent.children.some(child => isMovingIntoChild(child, targetId));
  };
  if (isMovingIntoChild(nodeToMove, newParentId)) return root;

  let adjustedIndex = index;
  
  // If reordering within the same parent
  if (nodeToMove.parentId === newParentId && index !== -1) {
      const parent = findNode(root, newParentId);
      if (parent) {
          const currentIndex = parent.children.findIndex(c => c.id === nodeId);
          // If we are moving an item "down" the list, the removal will shift indices up, so we must decrement the target index.
          if (currentIndex !== -1 && currentIndex < index) {
              adjustedIndex -= 1;
          }
      }
  }

  const treeWithoutNode = removeNode(root, nodeId);
  if (!treeWithoutNode) return root;

  const nodeWithNewParent = { ...nodeToMove, parentId: newParentId };

  return updateNode(treeWithoutNode, newParentId, (parent) => {
    const newChildren = [...parent.children];
    
    // Safety clamp
    if (adjustedIndex < 0) {
        newChildren.push(nodeWithNewParent);
    } else {
        if (adjustedIndex > newChildren.length) adjustedIndex = newChildren.length;
        newChildren.splice(adjustedIndex, 0, nodeWithNewParent);
    }
    
    return {
      ...parent,
      children: newChildren
    };
  });
};

export const getDefaultProps = (type: ComponentType): { props: any, styleConfig: StyleConfig, name: string } => {
  const baseStyle: StyleConfig = {
    position: 'static',
    paddingAll: 0,
    marginAll: 0,
    gap: 2,
    borderRadius: 'none',
    shadow: 'none',
    animation: 'none',
    transitionDuration: 200,
    opacity: 100,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    perspective: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
    skewX: 0,
    skewY: 0,
    transformStyle: 'flat',
    backfaceVisibility: 'visible',
    borderWidth: 0,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    textColor: '#e2e8f0',
    fontSize: 'base',
    fontWeight: 'normal',
    textAlign: 'left',
    width: 'auto',
    height: 'auto',
    objectFit: 'cover',
    flexWrap: 'nowrap',
    flexGrow: 0,
    flexShrink: 0,
    fontFamily: 'sans',
    lineHeight: 'normal',
    letterSpacing: 'normal',
    textTransform: 'none',
    textDecoration: 'none',
    cursor: 'auto',
    overflow: 'visible',
    backgroundGradient: 'none',
    backgroundSize: 'cover',
    mixBlendMode: 'normal',
    blur: 'none',
    backdropBlur: 'none',
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    textShadow: 'none',
    animationDelay: 0,
    animationTimingFunction: 'ease',
    scrollTrigger: false
  };

  switch (type) {
    case 'container': 
      return { 
        name: 'Container',
        props: {}, 
        styleConfig: { 
          ...baseStyle, 
          display: 'flex', 
          flexDirection: 'col', 
          paddingAll: 4, 
          backgroundColor: '#f3f4f6',
          borderRadius: 'md',
          textColor: '#1f2937',
          width: 'full'
        } 
      };
    case 'button': 
      return { 
        name: 'Button',
        props: { text: 'Click Me' }, 
        styleConfig: { 
          ...baseStyle, 
          paddingAll: 2, 
          paddingLeft: 4,
          paddingRight: 4,
          backgroundColor: '#3b82f6', 
          borderRadius: 'md',
          flexDirection: 'row',
          justifyContent: 'center',
          textColor: '#ffffff',
          fontWeight: 'bold',
          width: 'auto',
          cursor: 'pointer'
        } 
      };
    case 'text': 
      return { 
        name: 'Text Block',
        props: { text: 'Edit this text' }, 
        styleConfig: {
          ...baseStyle,
          textColor: '#1f2937'
        }
      };
    case 'input':
      return {
        name: 'Input Field',
        props: { placeholder: 'Enter text...', type: 'text' },
        styleConfig: {
          ...baseStyle,
          paddingAll: 2, 
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 'md',
          textColor: '#1f2937',
          width: 'full'
        }
      };
    case 'image': 
      return { 
        name: 'Image',
        props: { src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80' }, 
        styleConfig: { ...baseStyle, borderRadius: 'md', width: 'full', height: 'auto' } 
      };
    case 'video':
      return {
        name: 'Video',
        props: { src: 'https://www.w3schools.com/html/mov_bbb.mp4', controls: true },
        styleConfig: { ...baseStyle, borderRadius: 'md', width: 'full', height: 'auto' }
      }
    default: return { name: 'Component', props: {}, styleConfig: baseStyle };
  }
};

export const createComponent = (type: string): ComponentData => {
  const id = generateId();
  if (type === 'navbar') {
    const base = getDefaultProps('container');
    const nav: ComponentData = {
      id,
      name: 'Navbar',
      type: 'container',
      tagName: 'nav',
      props: {},
      styleConfig: { 
        ...base.styleConfig, 
        backgroundColor: '#ffffff', 
        paddingAll: 4,
        flexDirection: 'row',
        justifyContent: 'between',
        alignItems: 'center',
        width: 'full',
        shadow: 'md',
        position: 'sticky',
        top: 0,
        zIndex: 50
      },
      children: [],
      parentId: null
    };

    const logoId = generateId();
    nav.children.push({
      id: logoId,
      name: 'Logo',
      type: 'text',
      props: { text: 'Brand' },
      styleConfig: { ...getDefaultProps('text').styleConfig, fontSize: 'xl', fontWeight: 'bold' },
      children: [],
      parentId: id
    });

    const linksId = generateId();
    const linksContainer: ComponentData = {
        id: linksId,
        name: 'Links',
        type: 'container',
        props: {},
        styleConfig: { ...getDefaultProps('container').styleConfig, paddingAll: 0, flexDirection: 'row', gap: 6, backgroundColor: 'transparent' },
        children: [],
        parentId: id
    };
    
    ['Home', 'About', 'Contact'].forEach(linkText => {
        const linkId = generateId();
        linksContainer.children.push({
            id: linkId,
            name: 'Link',
            type: 'text',
            props: { text: linkText },
            styleConfig: { ...getDefaultProps('text').styleConfig, cursor: 'pointer' },
            hoverStyleConfig: { textColor: '#3b82f6' },
            children: [],
            parentId: linksId
        });
    });
    nav.children.push(linksContainer);
    return nav;
  }
  
  if (type === 'hero') {
      const base = getDefaultProps('container');
      const hero: ComponentData = {
      id,
      name: 'Hero Section',
      type: 'container',
      props: {},
      styleConfig: { 
        ...base.styleConfig, 
        backgroundColor: '#111827', 
        paddingAll: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: '96',
        position: 'relative'
      },
      children: [],
      parentId: null
    };
    
    const titleId = generateId();
    hero.children.push({
      id: titleId,
      name: 'Hero Title',
      type: 'text',
      props: { text: 'Build Faster with Vectra' },
      styleConfig: { ...getDefaultProps('text').styleConfig, fontSize: '4xl', fontWeight: 'extrabold', textColor: '#ffffff', textAlign: 'center' },
      children: [],
      parentId: id
    });

    const subId = generateId();
    hero.children.push({
      id: subId,
      name: 'Hero Subtitle',
      type: 'text',
      props: { text: 'The visual builder for React developers. Design, code, and ship in record time.' },
      styleConfig: { ...getDefaultProps('text').styleConfig, fontSize: 'lg', textColor: '#9ca3af', textAlign: 'center', width: '2/3' },
      children: [],
      parentId: id
    });

    const btnId = generateId();
    hero.children.push({
      id: btnId,
      name: 'Hero Button',
      type: 'button',
      props: { text: 'Get Started' },
      styleConfig: { ...getDefaultProps('button').styleConfig, paddingAll: 4, fontSize: 'lg', width: 'auto' },
      hoverStyleConfig: { backgroundColor: '#374151' },
      children: [],
      parentId: id
    });

    return hero;
  }

  if (type === 'card') {
    const base = getDefaultProps('container');
    const card: ComponentData = {
      id,
      name: 'Feature Card',
      type: 'container',
      props: {},
      styleConfig: { 
        ...base.styleConfig, 
        backgroundColor: '#ffffff', 
        borderRadius: 'lg', 
        shadow: 'lg', 
        paddingAll: 6,
        gap: 4,
        width: 'full',
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden'
      },
      hoverStyleConfig: {
        shadow: 'xl',
        scale: 1.02,
      },
      children: [],
      parentId: null
    };
    
    const imgId = generateId();
    card.children.push({
      id: imgId,
      name: 'Card Image',
      type: 'image',
      props: { src: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80' },
      styleConfig: { ...getDefaultProps('image').styleConfig, height: '64', objectFit: 'cover' },
      children: [],
      parentId: id
    });
    
    const titleId = generateId();
    card.children.push({
      id: titleId,
      name: 'Card Title',
      type: 'text',
      props: { text: 'Beautiful Destination' },
      styleConfig: { ...getDefaultProps('text').styleConfig, fontSize: 'xl', fontWeight: 'bold' },
      children: [],
      parentId: id
    });
    
    const descId = generateId();
    card.children.push({
      id: descId,
      name: 'Card Description',
      type: 'text',
      props: { text: 'Explore the wonders of the world with our premium travel packages designed for adventurers.' },
      styleConfig: { ...getDefaultProps('text').styleConfig, textColor: '#6b7280', fontSize: 'sm' },
      children: [],
      parentId: id
    });

    const btnId = generateId();
    card.children.push({
      id: btnId,
      name: 'Card Button',
      type: 'button',
      props: { text: 'Book Now' },
      styleConfig: { ...getDefaultProps('button').styleConfig, width: 'full' },
      hoverStyleConfig: { backgroundColor: '#2563eb' },
      children: [],
      parentId: id
    });

    return card;
  }

  if (type === 'modal') {
      const base = getDefaultProps('container');
      const overlay: ComponentData = {
          id,
          name: 'Modal Overlay',
          type: 'container',
          props: {},
          styleConfig: {
              ...base.styleConfig,
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: '#000000',
              opacity: 80,
              zIndex: 99,
              justifyContent: 'center',
              alignItems: 'center',
              backdropBlur: 'sm'
          },
          children: [],
          parentId: null
      };
      
      const contentId = generateId();
      overlay.children.push({
          id: contentId,
          name: 'Modal Content',
          type: 'container',
          props: {},
          styleConfig: {
              ...base.styleConfig,
              width: '96',
              height: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: 'lg',
              paddingAll: 6,
              shadow: 'xl',
              opacity: 100 
          },
          children: [
              {
                  id: generateId(),
                  name: 'Title',
                  type: 'text',
                  props: { text: 'Modal Title' },
                  styleConfig: { ...getDefaultProps('text').styleConfig, fontSize: 'xl', fontWeight: 'bold', marginBottom: 2 },
                  children: [],
                  parentId: contentId
              },
              {
                  id: generateId(),
                  name: 'Body',
                  type: 'text',
                  props: { text: 'This is the modal content area.' },
                  styleConfig: { ...getDefaultProps('text').styleConfig, marginBottom: 4, textColor: '#4b5563' },
                  children: [],
                  parentId: contentId
              },
              {
                  id: generateId(),
                  name: 'Close Button',
                  type: 'button',
                  props: { text: 'Close' },
                  styleConfig: { ...getDefaultProps('button').styleConfig, width: 'full' },
                  children: [],
                  parentId: contentId
              }
          ],
          parentId: id
      });
      return overlay;
  }

  const { name, props, styleConfig } = getDefaultProps(type as ComponentType);
  return {
    id,
    name,
    type: type as ComponentType,
    props,
    styleConfig,
    children: [],
    parentId: null
  };
};

export const getTailwindClasses = (config: StyleConfig, prefix = ''): string => {
  if (!config) return '';
  const p = prefix ? `${prefix}:` : '';
  const classes = [];

  // Layout
  if (config.display === 'flex') {
    classes.push(`${p}flex`);
    classes.push(config.flexDirection === 'row' ? `${p}flex-row` : `${p}flex-col`);
    if (config.justifyContent) classes.push(`${p}justify-${config.justifyContent}`);
    if (config.alignItems) classes.push(`${p}items-${config.alignItems}`);
    if (config.gap !== undefined) classes.push(`${p}gap-${config.gap}`);
    if (config.flexWrap) classes.push(`${p}flex-${config.flexWrap}`);
    if (config.flexGrow) classes.push(`${p}${config.flexGrow === 1 ? 'grow' : 'grow-0'}`);
    if (config.flexShrink) classes.push(`${p}${config.flexShrink === 1 ? 'shrink' : 'shrink-0'}`);
  } else if (config.display === 'grid') {
    classes.push(`${p}grid`);
    if (config.gridCols) classes.push(`${p}grid-cols-${config.gridCols}`);
    if (config.gap !== undefined) classes.push(`${p}gap-${config.gap}`);
  } else {
    classes.push(`${p}block`);
  }

  // Positioning
  if (config.position && config.position !== 'static') classes.push(`${p}${config.position}`);
  if (config.top !== undefined && config.top !== 'auto') classes.push(`${p}top-${config.top}`);
  if (config.right !== undefined && config.right !== 'auto') classes.push(`${p}right-${config.right}`);
  if (config.bottom !== undefined && config.bottom !== 'auto') classes.push(`${p}bottom-${config.bottom}`);
  if (config.left !== undefined && config.left !== 'auto') classes.push(`${p}left-${config.left}`);
  if (config.zIndex !== undefined) classes.push(`${p}z-[${config.zIndex}]`);
  if (config.overflow) classes.push(`${p}overflow-${config.overflow}`);

  // Spacing (Granular)
  if (config.paddingAll !== undefined && config.paddingAll !== 0) classes.push(`${p}p-${config.paddingAll}`);
  if (config.paddingTop !== undefined) classes.push(`${p}pt-${config.paddingTop}`);
  if (config.paddingBottom !== undefined) classes.push(`${p}pb-${config.paddingBottom}`);
  if (config.paddingLeft !== undefined) classes.push(`${p}pl-${config.paddingLeft}`);
  if (config.paddingRight !== undefined) classes.push(`${p}pr-${config.paddingRight}`);

  if (config.marginAll !== undefined && config.marginAll !== 0) classes.push(`${p}m-${config.marginAll}`);
  if (config.marginTop !== undefined) classes.push(`${p}mt-${config.marginTop}`);
  if (config.marginBottom !== undefined) classes.push(`${p}mb-${config.marginBottom}`);
  if (config.marginLeft !== undefined) classes.push(`${p}ml-${config.marginLeft}`);
  if (config.marginRight !== undefined) classes.push(`${p}mr-${config.marginRight}`);

  // Sizing
  if (config.width) classes.push(`${p}w-${config.width}`);
  if (config.height) classes.push(`${p}h-${config.height}`);
  if (config.objectFit) classes.push(`${p}object-${config.objectFit}`);

  // Typography
  if (config.fontFamily) classes.push(`${p}font-${config.fontFamily}`);
  if (config.fontSize) classes.push(`${p}text-${config.fontSize}`);
  if (config.fontWeight) classes.push(`${p}font-${config.fontWeight}`);
  if (config.textAlign) classes.push(`${p}text-${config.textAlign}`);
  if (config.lineHeight) classes.push(`${p}leading-${config.lineHeight}`);
  if (config.letterSpacing) classes.push(`${p}tracking-${config.letterSpacing}`);
  if (config.textTransform && config.textTransform !== 'none') classes.push(`${p}${config.textTransform}`);
  if (config.textDecoration && config.textDecoration !== 'none') classes.push(`${p}${config.textDecoration}`);
  if (config.textShadow && config.textShadow !== 'none') classes.push(`${p}drop-shadow-${config.textShadow}`);

  // Appearance
  if (config.backgroundGradient && config.backgroundGradient !== 'none') {
    classes.push(`${p}bg-gradient-to-br`);
    if (config.backgroundGradient === 'sunset') classes.push(`${p}from-orange-400 ${p}to-pink-500`);
    if (config.backgroundGradient === 'ocean') classes.push(`${p}from-blue-400 ${p}to-emerald-500`);
    if (config.backgroundGradient === 'cotton-candy') classes.push(`${p}from-pink-300 ${p}to-purple-400`);
    if (config.backgroundGradient === 'midnight') classes.push(`${p}from-gray-900 ${p}to-gray-600`);
    if (config.backgroundGradient === 'gunmetal') classes.push(`${p}from-gray-800 ${p}to-gray-900`);
  }
  if (config.mixBlendMode && config.mixBlendMode !== 'normal') classes.push(`${p}mix-blend-${config.mixBlendMode}`);
  if (config.backgroundSize) classes.push(`${p}bg-${config.backgroundSize}`);

  if (config.borderRadius && config.borderRadius !== 'none') classes.push(`${p}rounded-${config.borderRadius}`);
  if (config.shadow && config.shadow !== 'none') classes.push(`${p}shadow-${config.shadow}`);
  if (config.cursor && config.cursor !== 'auto') classes.push(`${p}cursor-${config.cursor}`);
  
  // Border
  if (config.borderWidth !== undefined) {
    if (config.borderWidth === 0) classes.push(`${p}border-0`);
    else if (config.borderWidth === 1) classes.push(`${p}border`);
    else classes.push(`${p}border-${config.borderWidth}`);
  }
  if (config.borderStyle && config.borderStyle !== 'solid') classes.push(`${p}border-${config.borderStyle}`);

  // Effects & Transforms
  if (config.opacity !== undefined && config.opacity < 100) classes.push(`${p}opacity-${config.opacity}`);
  // Note: 3D transforms like rotateX/Y and perspective are handled via arbitrary Tailwind classes or inline styles
  if (config.rotate !== undefined && config.rotate !== 0) classes.push(`${p}rotate-[${config.rotate}deg]`);
  if (config.scale !== undefined && config.scale !== 1) classes.push(`${p}scale-[${config.scale}]`);
  if (config.translateX !== undefined && config.translateX !== 0) classes.push(`${p}translate-x-[${config.translateX}px]`);
  if (config.translateY !== undefined && config.translateY !== 0) classes.push(`${p}translate-y-[${config.translateY}px]`);
  if (config.skewX !== undefined && config.skewX !== 0) classes.push(`${p}skew-x-[${config.skewX}deg]`);
  if (config.skewY !== undefined && config.skewY !== 0) classes.push(`${p}skew-y-[${config.skewY}deg]`);
  
  // 3D Transforms (Using Arbitrary Properties)
  if (config.rotateX !== undefined && config.rotateX !== 0) classes.push(`${p}[transform:rotateX(${config.rotateX}deg)]`);
  if (config.rotateY !== undefined && config.rotateY !== 0) classes.push(`${p}[transform:rotateY(${config.rotateY}deg)]`);
  if (config.perspective !== undefined && config.perspective !== 0) classes.push(`${p}[perspective:${config.perspective}px]`);
  
  if (config.transformStyle === 'preserve-3d') classes.push(`${p}[transform-style:preserve-3d]`);
  if (config.backfaceVisibility === 'hidden') classes.push(`${p}[backface-visibility:hidden]`);
  if (config.transformOrigin) classes.push(`${p}[transform-origin:${config.transformOrigin}]`);

  // Filters
  if (config.blur && config.blur !== 'none') classes.push(`${p}blur-${config.blur}`);
  if (config.backdropBlur && config.backdropBlur !== 'none') classes.push(`${p}backdrop-blur-${config.backdropBlur}`);
  if (config.brightness !== undefined && config.brightness !== 100) classes.push(`${p}brightness-[${config.brightness/100}]`);
  if (config.contrast !== undefined && config.contrast !== 100) classes.push(`${p}contrast-[${config.contrast/100}]`);
  if (config.saturate !== undefined && config.saturate !== 100) classes.push(`${p}saturate-[${config.saturate/100}]`);
  if (config.grayscale !== undefined && config.grayscale !== 0) classes.push(`${p}grayscale-[${config.grayscale/100}]`);
  if (config.sepia !== undefined && config.sepia !== 0) classes.push(`${p}sepia-[${config.sepia/100}]`);

  // Animation & Transitions
  if (!config.scrollTrigger && config.animation && config.animation !== 'none') {
      classes.push(`${p}animate-${config.animation}`);
  }
  
  if (config.transitionDuration !== undefined) classes.push(`${p}duration-${config.transitionDuration}`);

  return classes.join(' ');
};

const hasClientFeatures = (node: ComponentData): boolean => {
  if (node.interactions && node.interactions.type !== 'none') return true;
  if (node.type === 'input') return true; // Inputs typically need state
  if (node.styleConfig.scrollTrigger) return true; // Needs IntersectionObserver
  return node.children.some(child => hasClientFeatures(child));
};

const generateJSX = (node: ComponentData, indent: number): string => {
    const space = '  '.repeat(indent);
    const baseClasses = getTailwindClasses(node.styleConfig);
    const hoverClasses = node.hoverStyleConfig ? getTailwindClasses(node.hoverStyleConfig, 'hover') : '';
    const focusClasses = node.focusStyleConfig ? getTailwindClasses(node.focusStyleConfig, 'focus') : '';
    const activeClasses = node.activeStyleConfig ? getTailwindClasses(node.activeStyleConfig, 'active') : '';
    
    // Breakpoints logic could be added here similar to getTailwindClasses but prefixed
    let responsiveClasses = '';
    // (Omitted for brevity in this step, but in production would iterate node.breakpoints)

    const finalClassName = `${baseClasses} ${hoverClasses} ${focusClasses} ${activeClasses} ${node.customClassName || ''} ${node.props.className || ''}`.trim();
    
    const propsStr = Object.entries(node.props)
      .filter(([key]) => key !== 'children' && key !== 'text' && key !== 'className' && key !== 'style')
      .map(([key, val]) => {
        if (val === true) return key;
        return `${key}="${val}"`;
      })
      .join(' ');

    const styleObj: string[] = [];
    if (node.styleConfig.backgroundColor && node.styleConfig.backgroundGradient === 'none') {
        styleObj.push(`backgroundColor: '${node.styleConfig.backgroundColor}'`);
    }
    // ... other inline styles ...
    if (node.styleConfig.backgroundImage) styleObj.push(`backgroundImage: 'url(${node.styleConfig.backgroundImage})'`);

    const styleAttr = styleObj.length > 0 ? `style={{ ${styleObj.join(', ')} }}` : '';
    const tagProps = `className="${finalClassName}" ${propsStr} ${styleAttr}`.trim();

    // Determine Tag Name
    let Tag = node.tagName || 'div';
    if (!node.tagName) {
        if (node.type === 'button') Tag = 'button';
        if (node.type === 'text') Tag = 'p';
        if (node.type === 'image') Tag = 'img';
        if (node.type === 'input') Tag = 'input';
        if (node.type === 'video') Tag = 'video';
    }

    const startComment = indent === 2 ? `\n${space}{/* ${node.name} */}` : '';

    const selfClosing = ['img', 'input', 'br', 'hr'].includes(Tag);

    if (selfClosing) {
        return `${startComment}\n${space}<${Tag} ${tagProps} />`;
    }

    let content = '';
    if (node.type === 'text') content = node.props.text || '';
    if (node.type === 'button') content = node.props.text || '';

    if (node.children.length > 0) {
        content = node.children.map(c => generateJSX(c, indent + 1)).join('');
        return `${startComment}\n${space}<${Tag} ${tagProps}>\n${content}\n${space}</${Tag}>`;
    }

    return `${startComment}\n${space}<${Tag} ${tagProps}>${content}</${Tag}>`;
};

export const generateCode = (node: ComponentData, indent = 0): string => {
  const isClient = hasClientFeatures(node);
  
  const jsx = generateJSX(node, 2);

  return `
${isClient ? "'use client';\n" : ""}
import React from 'react';

export default function GeneratedComponent() {
  return (
${jsx}
  );
}
  `.trim();
};

export const performAudit = (rootNode: ComponentData): AuditIssue[] => {
  const issues: AuditIssue[] = [];
  let totalNodes = 0;
  let totalListeners = 0;
  let totalImages = 0;

  const checkNode = (n: ComponentData, depth: number) => {
    totalNodes++;

    // 1. Structure: Deep Nesting
    if (depth > 8) {
       issues.push({
         id: `nesting-${n.id}`,
         nodeId: n.id,
         severity: 'medium',
         category: 'structure', 
         title: 'Deep Nesting Detected',
         description: `Component "${n.name}" is nested ${depth} levels deep.`,
         suggestion: 'Flatten your component structure to reduce DOM complexity and improve rendering speed.'
       });
    }

    // 2. Performance: Animation Checks
    if (n.styleConfig.animation && n.styleConfig.animation !== 'none') {
       // Check for expensive paints during animation
       if (n.styleConfig.shadow !== 'none' || n.styleConfig.backdropBlur !== 'none' || n.styleConfig.blur !== 'none') {
          issues.push({
            id: `anim-paint-${n.id}`,
            nodeId: n.id,
            severity: 'medium',
            category: 'performance',
            title: 'Expensive Animation Paint',
            description: `Animating "${n.name}" with Shadows or Blurs triggers expensive repaints.`,
            suggestion: 'Try removing shadows/blurs during animation or promote to a new layer using "will-change" in custom CSS.'
          });
       }
    }

    // 3. Bundle/Performance: Image Optimization
    if (n.type === 'image') {
       totalImages++;
       const src = n.props.src || '';
       if (src.startsWith('data:image')) {
          if (src.length > 10000) { // >10KB base64
             issues.push({
                id: `img-base64-${n.id}`,
                nodeId: n.id,
                severity: 'high',
                category: 'bundle',
                title: 'Large Inline Image',
                description: `Image "${n.name}" uses a large Base64 string (${Math.round(src.length/1024)}KB).`,
                suggestion: 'Upload this image to the backend or use a CDN URL to reduce the initial JS bundle size.'
             });
          }
       }
       if (!n.props.alt) {
          issues.push({
             id: `a11y-alt-${n.id}`,
             nodeId: n.id,
             severity: 'high',
             category: 'accessibility',
             title: 'Missing Alt Text',
             description: `Image "${n.name}" has no description.`,
             suggestion: 'Add descriptive text in the props panel for screen readers.'
          });
       }
    }

    // 4. Performance: Large Lists
    if (n.repeatConfig) {
       issues.push({
          id: `list-perf-${n.id}`,
          nodeId: n.id,
          severity: 'medium',
          category: 'performance',
          title: 'Dynamic List Rendering',
          description: `List "${n.name}" renders dynamic items.`,
          suggestion: 'Ensure the source collection is paginated. For lists > 50 items, consider using a virtualization library in the exported code.'
       });
    }

    // 5. Interactions/Listeners
    if (n.interactions && n.interactions.type !== 'none') {
        totalListeners++;
        if (n.interactions.trigger === 'view') {
             issues.push({
                id: `scroll-listener-${n.id}`,
                nodeId: n.id,
                severity: 'low',
                category: 'performance',
                title: 'Scroll Observer',
                description: `"${n.name}" uses an IntersectionObserver (On View).`,
                suggestion: 'Too many scroll observers can degrade scrolling performance on mobile.'
             });
        }
    }

    // 6. Accessibility: Buttons/Links
    if (n.type === 'button' && !n.props.text && !n.children.length) {
         issues.push({
             id: `a11y-btn-${n.id}`,
             nodeId: n.id,
             severity: 'high',
             category: 'accessibility',
             title: 'Empty Button',
             description: `Button "${n.name}" has no text or content.`,
             suggestion: 'Add text or an icon label.'
         });
    }

    n.children.forEach(c => checkNode(c, depth + 1));
  };

  checkNode(rootNode, 0);

  // Global Bundle Check
  if (totalNodes > 500) {
      issues.push({
          id: 'dom-size',
          nodeId: 'root',
          severity: 'high',
          category: 'performance',
          title: 'Excessive DOM Size',
          description: `Total DOM nodes (${totalNodes}) exceeds recommended limit (500) for a single view.`,
          suggestion: 'Break this page into multiple routes or lazily load sections.'
      });
  }
  
  return issues;
};

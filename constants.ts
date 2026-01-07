import { ComponentData, CMSCollection } from './types';

export const INITIAL_TREE: ComponentData = {
  id: 'root',
  name: 'Page Body',
  type: 'container',
  props: {},
  styleConfig: {
    display: 'flex',
    flexDirection: 'col',
    paddingAll: 8,
    gap: 4,
    backgroundColor: '#ffffff',
    borderRadius: 'none',
    shadow: 'none',
    animation: 'none',
    opacity: 100,
    borderWidth: 0,
    textColor: '#000000',
    fontSize: 'base',
    fontWeight: 'normal',
    lineHeight: 'normal',
    letterSpacing: 'normal'
  },
  children: [],
  parentId: null,
};

export const INITIAL_CMS_COLLECTIONS: CMSCollection[] = [
  {
    id: 'blog-posts',
    name: 'Blog Posts',
    fields: [
      { id: 'title', name: 'Title', type: 'text' },
      { id: 'cover', name: 'Cover Image', type: 'image' },
      { id: 'excerpt', name: 'Excerpt', type: 'text' },
      { id: 'date', name: 'Publish Date', type: 'date' },
    ],
    items: [
      { 
        id: 'post-1', 
        title: 'The Future of No-Code', 
        cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
        excerpt: 'How visual builders are reshaping the web development landscape in 2026.',
        date: 'Oct 24, 2025' 
      },
      { 
        id: 'post-2', 
        title: 'Design Systems at Scale', 
        cover: 'https://images.unsplash.com/photo-1558655146-d09347e0b7a9?w=800&q=80',
        excerpt: 'Managing consistency across thousands of pages with atomic design principles.',
        date: 'Nov 02, 2025' 
      },
      { 
        id: 'post-3', 
        title: 'React Concurrent Mode', 
        cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
        excerpt: 'Leveraging the power of React 19 for buttery smooth transitions.',
        date: 'Nov 15, 2025' 
      }
    ]
  },
  {
    id: 'team-members',
    name: 'Team Members',
    fields: [
      { id: 'name', name: 'Name', type: 'text' },
      { id: 'avatar', name: 'Avatar', type: 'image' },
      { id: 'role', name: 'Role', type: 'text' }
    ],
    items: [
      { id: 'tm-1', name: 'Sarah Drasner', role: 'VP of Engineering', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
      { id: 'tm-2', name: 'Guillermo Rauch', role: 'CEO', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' },
    ]
  }
];

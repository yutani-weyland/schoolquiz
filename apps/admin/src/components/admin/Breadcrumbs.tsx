'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  href: string;
}

// Route metadata for breadcrumb generation
const routeMetadata: Record<string, { label: string; parent?: string }> = {
  '/admin': { label: 'Overview' },
  '/admin/organisations': { label: 'Organisations' },
  '/admin/users': { label: 'Users' },
  '/admin/quizzes': { label: 'Quizzes' },
  '/admin/quizzes/builder': { label: 'Quiz Builder' },
  '/admin/scheduling': { label: 'Scheduling' },
  '/admin/analytics': { label: 'Analytics' },
  '/admin/analytics/engagement': { label: 'Engagement', parent: '/admin/analytics' },
  '/admin/analytics/learning': { label: 'Learning Outcomes', parent: '/admin/analytics' },
  '/admin/analytics/funnel': { label: 'Funnel', parent: '/admin/analytics' },
  '/admin/billing': { label: 'Billing' },
  '/admin/support': { label: 'Support' },
  '/admin/system': { label: 'System' },
  '/admin/system/feature-flags': { label: 'Feature Flags', parent: '/admin/system' },
  '/admin/system/audit-log': { label: 'Audit Log', parent: '/admin/system' },
  '/admin/achievements': { label: 'Achievements' },
  '/admin/questions/submissions': { label: "People's Round Submissions" },
  '/admin/questions/create': { label: 'Create Question' },
  '/admin/categories': { label: 'Categories' },
};

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Generate breadcrumb segments from pathname
  const generateBreadcrumbs = (): BreadcrumbSegment[] => {
    const segments: BreadcrumbSegment[] = [];
    
    // Always start with Home
    segments.push({ label: 'Home', href: '/admin' });
    
    // Handle dynamic routes like /admin/quizzes/[id]
    let currentPath = '/admin';
    const pathParts = pathname.split('/').filter(Boolean);
    
    // Skip 'admin' in path parts
    const relevantParts = pathParts.slice(1);
    
    for (let i = 0; i < relevantParts.length; i++) {
      const part = relevantParts[i];
      const isDynamic = /^\[.*\]$/.test(part) || /^[a-z0-9-]+-[a-z0-9-]+$/i.test(part);
      
      if (isDynamic) {
        // For dynamic routes like [id], we need to fetch the actual label
        // For now, we'll try to get it from route metadata or use a generic label
        const parentPath = currentPath;
        const metadata = routeMetadata[parentPath];
        
        if (parentPath === '/admin/quizzes' && part) {
          // For quiz detail pages, use a generic label (can be enhanced to fetch title later)
          segments.push({ label: 'Quiz Details', href: `${parentPath}/${part}` });
        } else if (parentPath === '/admin/organisations' && part) {
          segments.push({ label: 'Organisation Details', href: `${parentPath}/${part}` });
        } else if (parentPath === '/admin/users' && part) {
          segments.push({ label: 'User Details', href: `${parentPath}/${part}` });
        } else {
          // Generic dynamic segment - capitalize and format
          const label = part
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          segments.push({ label, href: `${currentPath}/${part}` });
        }
        
        currentPath = `${currentPath}/${part}`;
      } else {
        currentPath = `${currentPath}/${part}`;
        const metadata = routeMetadata[currentPath];
        
        if (metadata) {
          segments.push({ label: metadata.label, href: currentPath });
        } else {
          // Fallback: capitalize and format the segment
          const label = part
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          segments.push({ label, href: currentPath });
        }
      }
    }
    
    return segments;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumbs on the home page
  if (pathname === '/admin' || breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {breadcrumbs.map((segment, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={segment.href} className="flex items-center gap-2">
            {index === 0 ? (
              <Link
                href={segment.href}
                className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Home"
              >
                <Home className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={segment.href}
                className={`transition-colors ${
                  isLast
                    ? 'text-[hsl(var(--foreground))] font-medium cursor-default pointer-events-none'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}
              >
                {segment.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            )}
          </div>
        );
      })}
    </nav>
  );
}


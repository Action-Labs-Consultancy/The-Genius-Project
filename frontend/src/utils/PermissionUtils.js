// Permission utilities for the Genius Project
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:10000';

// Permission levels
export const PERMISSION_LEVELS = {
  NONE: 'none',
  VIEW: 'view', 
  EDIT: 'edit',
  FULL: 'full'
};

// Page mappings
export const PAGE_PERMISSIONS = {
  'dashboard': { name: 'Dashboard', route: '/dashboard' },
  'projects': { name: 'Projects', route: '/projects' },
  'tasks': { name: 'Tasks', route: '/tasks' },
  'clients': { name: 'Clients', route: '/clients' },
  'equipment': { name: 'Equipment', route: '/equipment' },
  'calendar': { name: 'Calendar', route: '/calendar' },
  'settings': { name: 'Settings', route: '/settings' },
  'reports': { name: 'Reports', route: '/reports' },
  'data-dashboard': { name: 'Data Dashboard', route: '/data-dashboard' },
  'chat': { name: 'Chat', route: '/chat' },
  'ai-content': { name: 'AI Content', route: '/ai-content' },
  'marketing-lab': { name: 'Marketing Lab', route: '/marketing-lab' },
  'brains': { name: 'AI Brains', route: '/brains' },
  'insights': { name: 'Insights', route: '/insights' },
  'workflow': { name: 'Workflow', route: '/workflow' },
  'due-diligence': { name: 'Due Diligence', route: '/due-diligence' },
  'ads': { name: 'Ads', route: '/ads' },
  'leave-board': { name: 'Leave Board', route: '/leave-board' }
};

// Default permissions for when API is unavailable
function getDefaultPermissions() {
  const defaults = {};
  Object.keys(PAGE_PERMISSIONS).forEach(pageId => {
    defaults[pageId] = PERMISSION_LEVELS.FULL; // Give full access by default
  });
  return defaults;
}

// Hook to manage user permissions
export function useUserPermissions(userId) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/permissions`);
        
        if (response.ok) {
          const permissionsData = await response.json();
          setPermissions(permissionsData);
        } else {
          // If no permissions found or server error, set defaults
          console.log('Permissions API failed, using default permissions');
          setPermissions(getDefaultPermissions());
        }
      } catch (err) {
        console.log('Permissions API unavailable, using default permissions');
        setError(null); // Don't treat this as an error
        setPermissions(getDefaultPermissions());
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  return { permissions, loading, error, setPermissions };
}

// Check if user has permission for a specific page
export function hasPermission(permissions, pageId, requiredLevel = PERMISSION_LEVELS.VIEW) {
  const userPermission = permissions[pageId] || PERMISSION_LEVELS.NONE;
  
  // Permission hierarchy: none < view < edit < full
  const levels = {
    [PERMISSION_LEVELS.NONE]: 0,
    [PERMISSION_LEVELS.VIEW]: 1,
    [PERMISSION_LEVELS.EDIT]: 2,
    [PERMISSION_LEVELS.FULL]: 3
  };

  return levels[userPermission] >= levels[requiredLevel];
}

// Get permission level for a page
export function getPermissionLevel(permissions, pageId) {
  return permissions[pageId] || PERMISSION_LEVELS.NONE;
}

// Check if user can access a route
export function canAccessRoute(permissions, route, requiredLevel = PERMISSION_LEVELS.VIEW) {
  // Find the page ID for this route
  const pageId = Object.keys(PAGE_PERMISSIONS).find(
    key => PAGE_PERMISSIONS[key].route === route || route.startsWith(PAGE_PERMISSIONS[key].route)
  );

  if (!pageId) {
    // If no specific permission found, allow access (for backward compatibility)
    return true;
  }

  return hasPermission(permissions, pageId, requiredLevel);
}

// Get filtered navigation items based on permissions
export function getAccessibleNavItems(permissions, allNavItems) {
  return allNavItems.filter(item => {
    if (!item.route) return true; // Always show items without routes
    return canAccessRoute(permissions, item.route);
  });
}

import React from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessRoute, PERMISSION_LEVELS } from '../utils/PermissionUtils';

// Component to protect routes based on permissions
export default function ProtectedRoute({ 
  children, 
  permissions = {}, 
  route, 
  requiredLevel = PERMISSION_LEVELS.VIEW, 
  fallbackRoute = '/dashboard',
  user 
}) {
  // If user is admin, allow access to everything
  if (user?.is_admin || user?.role === 'admin') {
    return children;
  }

  // Check if user has permission to access this route
  const hasAccess = canAccessRoute(permissions, route, requiredLevel);

  if (!hasAccess) {
    console.log(`Access denied to ${route}. User permissions:`, permissions);
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}

// Higher-order component for route protection
export function withPermissionCheck(Component, route, requiredLevel = PERMISSION_LEVELS.VIEW) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute 
        permissions={props.permissions || {}} 
        route={route}
        requiredLevel={requiredLevel}
        user={props.user}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

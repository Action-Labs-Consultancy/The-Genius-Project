# Plane Integration Options

## Option 1: Sidebar Link (Current Implementation)
- ✅ **Already implemented** in your Dashboard.js
- Clicking "📋 Plane Projects" opens http://localhost:3001 in new tab
- Clean separation between apps

## Option 2: Iframe Integration (Embedded)

### React Component for Plane Iframe:

```jsx
import React, { useState } from 'react';

const PlaneIntegration = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with close button */}
      <div style={{
        background: '#1a1a1a',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ color: '#FFD600', margin: 0 }}>📋 Plane Project Management</h3>
        <button 
          onClick={onClose}
          style={{
            background: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#FFD600',
          fontSize: '18px'
        }}>
          Loading Plane...
        </div>
      )}
      
      {/* Iframe */}
      <iframe
        src="http://localhost:3001"
        style={{
          flex: 1,
          border: 'none',
          width: '100%'
        }}
        onLoad={() => setIsLoading(false)}
        title="Plane Project Management"
      />
    </div>
  );
};

export default PlaneIntegration;
```

### To implement in Dashboard.js:

```jsx
// Add state for Plane modal
const [showPlane, setShowPlane] = useState(false);

// Update the plane-project handler
} else if (id === 'plane-project') {
  // Show Plane in modal instead of new tab
  setShowPlane(true);

// Add to render return (before closing div)
{showPlane && (
  <PlaneIntegration onClose={() => setShowPlane(false)} />
)}
```

## Option 3: Dedicated Route (Integrated Page)

Add to your App.js routes:
```jsx
<Route path="/plane" element={
  <div style={{ height: '100vh' }}>
    <iframe 
      src="http://localhost:3001" 
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="Plane Project Management"
    />
  </div>
} />
```

## Option 4: Split Screen Layout

```jsx
const SplitScreenWithPlane = () => {
  const [showPlane, setShowPlane] = useState(false);
  
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Your main app */}
      <div style={{ 
        width: showPlane ? '50%' : '100%', 
        transition: 'width 0.3s ease' 
      }}>
        {/* Your existing dashboard content */}
      </div>
      
      {/* Plane panel */}
      {showPlane && (
        <div style={{ width: '50%', borderLeft: '2px solid #FFD600' }}>
          <iframe 
            src="http://localhost:3001"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Plane Project Management"
          />
        </div>
      )}
      
      {/* Toggle button */}
      <button 
        onClick={() => setShowPlane(!showPlane)}
        style={{
          position: 'fixed',
          right: showPlane ? '50%' : '20px',
          top: '20px',
          zIndex: 1000,
          background: '#FFD600',
          border: 'none',
          padding: '10px',
          borderRadius: '50%',
          cursor: 'pointer'
        }}
      >
        📋
      </button>
    </div>
  );
};
```

## Recommended Approach

For your use case, I recommend **Option 1 (Sidebar Link)** which is already implemented because:

- ✅ Clean separation of concerns
- ✅ Better performance (no iframe overhead)  
- ✅ Full Plane functionality available
- ✅ Easy to maintain
- ✅ No CORS issues

The button in your sidebar will open Plane in a new tab at http://localhost:3001 once you start the Docker services.

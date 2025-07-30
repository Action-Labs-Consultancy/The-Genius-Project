// test-organized-layout.js - Test the reorganized workflow canvas layout
console.log('=== WORKFLOW CANVAS LAYOUT ORGANIZATION TEST ===');

function testLayoutOrganization() {
  const tests = [
    {
      name: 'Header Layout',
      test: () => {
        const header = document.querySelector('.workflow-header');
        return header && 
               getComputedStyle(header).height === '72px' &&
               getComputedStyle(header).zIndex === '1000' &&
               getComputedStyle(header).position === 'relative';
      }
    },
    {
      name: 'Node Palette Organization',
      test: () => {
        const palette = document.querySelector('.node-palette');
        return palette && 
               getComputedStyle(palette).width === '300px' &&
               getComputedStyle(palette).background.includes('gradient') &&
               palette.querySelector('.node-search');
      }
    },
    {
      name: 'Canvas Area',
      test: () => {
        const canvas = document.querySelector('.canvas-area');
        return canvas && 
               getComputedStyle(canvas).flex === '1 1 0%' &&
               getComputedStyle(canvas).background === 'rgb(15, 15, 15)';
      }
    },
    {
      name: 'Parameter Panel Structure',
      test: () => {
        // Should exist in DOM even if hidden
        const panel = document.querySelector('.parameter-panel');
        return panel && 
               getComputedStyle(panel).width === '400px' &&
               getComputedStyle(panel).position === 'fixed' &&
               getComputedStyle(panel).zIndex === '800';
      }
    },
    {
      name: 'Execution Log Panel',
      test: () => {
        const logPanel = document.querySelector('.execution-log-panel');
        return logPanel && 
               getComputedStyle(logPanel).position === 'fixed' &&
               getComputedStyle(logPanel).bottom === '0px' &&
               getComputedStyle(logPanel).zIndex === '900';
      }
    },
    {
      name: 'Responsive Design',
      test: () => {
        // Check if responsive styles are in the CSS
        const styleSheets = Array.from(document.styleSheets);
        return styleSheets.some(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            return rules.some(rule => 
              rule.type === CSSRule.MEDIA_RULE && 
              rule.conditionText.includes('max-width')
            );
          } catch (e) {
            return false;
          }
        });
      }
    },
    {
      name: 'Action Buttons Styling',
      test: () => {
        const buttons = document.querySelectorAll('.action-btn');
        return buttons.length > 0 && 
               Array.from(buttons).every(btn => 
                 getComputedStyle(btn).borderRadius === '10px' &&
                 getComputedStyle(btn).textTransform === 'uppercase'
               );
      }
    },
    {
      name: 'Visual Enhancements',
      test: () => {
        const container = document.querySelector('.workflow-canvas-container');
        return container && 
               getComputedStyle(container).background === 'rgb(15, 15, 15)' &&
               getComputedStyle(container).height === '100vh';
      }
    }
  ];

  console.log('\n🧪 Running Layout Organization Tests...\n');
  
  let passed = 0;
  let total = tests.length;

  tests.forEach((test, index) => {
    try {
      const result = test.test();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${test.name}: ${status}`);
      if (result) passed++;
    } catch (error) {
      console.log(`${index + 1}. ${test.name}: ❌ ERROR - ${error.message}`);
    }
  });

  console.log(`\n📊 Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All layout organization tests passed! The canvas is properly organized.');
  } else {
    console.log('⚠️  Some layout issues detected. Check the failed tests above.');
  }

  return { passed, total, percentage: Math.round(passed/total*100) };
}

function testVisualHierarchy() {
  console.log('\n🎨 Testing Visual Hierarchy...\n');
  
  const hierarchyTests = [
    {
      name: 'Header is at the top with highest priority',
      test: () => {
        const header = document.querySelector('.workflow-header');
        return header && parseInt(getComputedStyle(header).zIndex) >= 1000;
      }
    },
    {
      name: 'Parameter panel overlays canvas but under header',
      test: () => {
        const panel = document.querySelector('.parameter-panel');
        return panel && parseInt(getComputedStyle(panel).zIndex) === 800;
      }
    },
    {
      name: 'Execution log panel is at bottom with proper z-index',
      test: () => {
        const log = document.querySelector('.execution-log-panel');
        return log && parseInt(getComputedStyle(log).zIndex) === 900;
      }
    },
    {
      name: 'Canvas area uses remaining space',
      test: () => {
        const canvas = document.querySelector('.canvas-area');
        return canvas && getComputedStyle(canvas).flex.includes('1');
      }
    }
  ];

  let passed = 0;
  hierarchyTests.forEach((test, index) => {
    try {
      const result = test.test();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${test.name}: ${status}`);
      if (result) passed++;
    } catch (error) {
      console.log(`${index + 1}. ${test.name}: ❌ ERROR - ${error.message}`);
    }
  });

  console.log(`\n📊 Visual Hierarchy: ${passed}/${hierarchyTests.length} tests passed`);
  return passed === hierarchyTests.length;
}

function analyzeLayoutMetrics() {
  console.log('\n📏 Layout Metrics Analysis...\n');
  
  const metrics = {
    headerHeight: document.querySelector('.workflow-header')?.offsetHeight || 0,
    paletteWidth: document.querySelector('.node-palette')?.offsetWidth || 0,
    canvasWidth: document.querySelector('.canvas-area')?.offsetWidth || 0,
    parameterPanelWidth: 400, // Fixed width
    totalWidth: window.innerWidth,
    totalHeight: window.innerHeight
  };

  console.log('Layout Dimensions:');
  console.log(`- Header Height: ${metrics.headerHeight}px`);
  console.log(`- Node Palette Width: ${metrics.paletteWidth}px`);
  console.log(`- Canvas Width: ${metrics.canvasWidth}px`);
  console.log(`- Parameter Panel Width: ${metrics.parameterPanelWidth}px`);
  console.log(`- Total Viewport: ${metrics.totalWidth}x${metrics.totalHeight}px`);
  
  const layoutEfficiency = (metrics.canvasWidth / metrics.totalWidth) * 100;
  console.log(`\n📈 Canvas Utilization: ${layoutEfficiency.toFixed(1)}%`);
  
  if (layoutEfficiency > 60) {
    console.log('✅ Good canvas space utilization');
  } else {
    console.log('⚠️  Canvas space could be better utilized');
  }

  return metrics;
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        testLayoutOrganization();
        testVisualHierarchy();
        analyzeLayoutMetrics();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      testLayoutOrganization();
      testVisualHierarchy();
      analyzeLayoutMetrics();
    }, 1000);
  }
}

export { testLayoutOrganization, testVisualHierarchy, analyzeLayoutMetrics };

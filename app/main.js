import { process } from '../core/engine.js';
import { init as loggerPlugin } from '../plugins/logger.js';

// Main entry point: wires up core and plugins using the plugin system

// Simple plugin system
const hooks = {};
function registerHook(name, fn) {
  hooks[name] = hooks[name] || [];
  hooks[name].push(fn);
}
function runHook(name, ...args) {
  (hooks[name] || []).forEach(fn => fn(...args));
}

// Compose core and plugins
const core = { process, registerHook };
loggerPlugin(core);

// Example usage
const result = core.process({ foo: 'bar' });
runHook('afterProcess', result);

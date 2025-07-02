# Hybrid Plugin-Based + Functional Core Architecture

## Structure

- `/core` - Pure, functional business logic (no side effects)
- `/plugins` - Plugin modules that extend/modify core behavior
- `/app` - Application entry points, composition, and wiring

## Example

- `core/`  
  - `engine.js` (core logic)
- `plugins/`  
  - `logger.js` (example plugin)
- `app/`  
  - `main.js` (loads core and plugins)

## Plugin API

Plugins export an `init(core, options)` function and can register hooks or extend the core.

## Migration

- Move pure logic to `/core`
- Move integrations/extensions to `/plugins`
- Use `/app/main.js` as the entry point

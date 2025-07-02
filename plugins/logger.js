// Example plugin: logs after core processing
export function init(core) {
  core.registerHook('afterProcess', (result) => {
    console.log('[Logger Plugin] Processed result:', result);
  });
}

// Pure functional core logic (no side effects)
// Example: just return input for now
export function process(input) {
  return { ...input, processed: true };
}

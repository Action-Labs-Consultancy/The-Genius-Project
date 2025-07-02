// Interface for AI plugins
export default class AIPlugin {
  // Pure function: takes input, returns output, no side effects
  generateContent(input) {
    throw new Error('generateContent() must be implemented by plugin');
  }
}

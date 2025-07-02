// OpenAI plugin implementation
import AIPlugin from '../interfaces/AI';

export default class OpenAIPlugin extends AIPlugin {
  async generateContent(answers) {
    const res = await fetch('/api/ai/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    if (!res.ok) throw new Error('Failed to generate content');
    return await res.json();
  }
}

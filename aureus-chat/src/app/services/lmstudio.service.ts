import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  async askStreaming(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    const body = {
      model: 'qwen3-1.7b',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: -1,
      stream: true
    };

    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Processa cada linha (SSE usa \n)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // guarda qualquer linha incompleta

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') return;

          try {
            const data = JSON.parse(dataStr);
            const chunkText = data.choices?.[0]?.delta?.content;
            if (chunkText) onChunk(chunkText);
          } catch (err) {
            console.error('Erro ao analisar chunk JSON:', err, dataStr);
          }
        }
      }
    }
  }
}

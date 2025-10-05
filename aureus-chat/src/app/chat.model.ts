export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
}

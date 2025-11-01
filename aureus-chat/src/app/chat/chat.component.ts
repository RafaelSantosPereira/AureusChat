import {
  Component,
  inject,
  computed,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';

import { AuthService } from '../auth.service';
import { ChatService } from '../services/chat.service';
import { AiService } from '../services/lmstudio.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

  // Injeção de dependências via new Angular inject()
  private cdr = inject(ChangeDetectorRef); // Forçar deteção de mudanças quando necessário
  private zone = inject(NgZone); // Usado para garantir updates de UI a partir de callbacks externos
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>; // Container para scroll automático

  private route = inject(ActivatedRoute); // Para ler parâmetros da rota (ex: id do chat)
  router = inject(Router);
  authService = inject(AuthService);
  private chatService = inject(ChatService);
  private aiService = inject(AiService);

  // Estado do componente
  showMenu = false; // Mostra/oculta menu de opções
  userInput = ''; // Texto atual do textarea
  isLoading = false; // Estado de loading enquanto IA responde
  isChatLoading = true; // Loading inicial das mensagens
  chatId: string = ''; // ID do chat atual vindo da rota
  messages: any[] = []; // Lista de mensagens (user/ai)

  inProgressAiText = ''; // Texto parcial recebido em stream da IA

  // Computed que devolve o username do utilizador atual (reactivo)
  username = computed(() => this.authService.currentUserSig()?.username ?? null);

  private messagesSub: Subscription | undefined; // Subscription para mensagens do chat

  // ...existing code...
  // Rola o container de mensagens para o fundo (usado após receber/enviar mensagens)
  scrollToBottom() {
    setTimeout(() => {
      this.scrollContainer?.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100); // pequeno atraso para garantir que o DOM já foi atualizado
  }

  // Alterna o menu (simples toggle)
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  // Logout: chama serviço e navega para sign-in ao terminar
  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigateByUrl('/sign-in');
    });
  }

  // Método para lidar com eventos de teclado no textarea
  // - Enter sem Shift envia a mensagem
  // - Shift+Enter permite quebra de linha
  // Além disso faz auto-resize do textarea até uma altura máxima
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Enter sem Shift - envia a mensagem
      event.preventDefault();
      this.sendPrompt();
    }
    // Se for Shift+Enter, deixa o comportamento padrão (quebra de linha)
    
    // Auto-resize do textarea
    const textarea = event.target as HTMLTextAreaElement;
    setTimeout(() => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 258); // 258px é a altura máxima permitida
      textarea.style.height = newHeight + 'px';
      
      // Se o conteúdo exceder a altura máxima, permite scroll interno no textarea
      if (textarea.scrollHeight > 258) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }, 0);
  }

  // Ciclo de vida: onInit -> subscreve ao user e às mensagens do chat
  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (!user) {
        // Sem utilizador: limpa estado e cancela subscrições
        this.messages = [];
        this.chatId = '';
        this.isChatLoading = false;
        this.messagesSub?.unsubscribe();
        return;
      }
      console.log(this.username)
      // Observa parâmetros da rota para trocar de chat quando id muda
      this.route.paramMap.subscribe(params => {
        const newChatId = params.get('id') ?? '';
        if (newChatId !== this.chatId) {
          // Novo chat: reinicializa estado e subscreve às mensagens desse chat
          this.chatId = newChatId;
          this.messages = [];
          this.isChatLoading = true;
          this.messagesSub?.unsubscribe();

           this.messagesSub = this.chatService.getMessages(this.chatId).subscribe(msgs => {
            this.messages = msgs;
            this.isChatLoading = false;
            this.cdr.detectChanges(); // Atualiza a view
            this.scrollToBottom(); // Rola para o final das mensagens
          });
        }
      });
    });
  }

  // Cleanup das subscrições ao destruir o componente
  ngOnDestroy() {
    this.messagesSub?.unsubscribe();
  }

  // trackBy para *ngFor (melhora performance, usa o índice)
  trackByIndex(index: number, item: any) {
    return index;
  }

  // Remove blocos <think>...</think> das respostas (filtro/limpeza)
  cleanResponse(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  // Envia o prompt para o chat/IA. Lógica:
  // - valida input
  // - adiciona mensagem do utilizador localmente e no serviço
  // - constrói contexto (histórico)
  // - chama aiService.askStreaming para receber resposta em stream
  // - atualiza inProgressAiText enquanto chegam chunks
  // - ao finalizar adiciona a resposta limpa às mensagens e ao serviço
  async sendPrompt() {
    if (!this.userInput.trim()) return;

    const prompt = this.userInput.trim();

    // Mostra imediatamente a mensagem do user na UI
    this.messages.push({ sender: 'user', text: prompt });
    this.userInput = '';
    this.isLoading = true;
    this.inProgressAiText = '';
    
    // Reset manual da altura do textarea para o valor mínimo após enviar
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = '56px'; // altura mínima
      }
    }, 0);
    
    await this.chatService.addMessage(this.chatId, 'user', prompt);

    // Monta o histórico como texto simples para enviar ao modelo
    const history = this.messages
      .filter(m => m.sender === 'user' || m.sender === 'ai')
      .map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    const fullPrompt = `${history}\nUser: ${prompt}\nAI:`;

    let fullText = '';
    let insideThink = false; // flag para ignorar texto dentro de <think>...</think>

    try {
      // askStreaming envia chunks de resposta; callback é chamado por cada chunk
      await this.aiService.askStreaming(fullPrompt, (chunk: string) => {
        this.zone.run(() => {
          fullText += chunk;

          // Se encontrar <think> marca que estamos dentro e ignora até fechar
          if (/<think>/.test(fullText)) insideThink = true;
          if (/<\/think>/.test(fullText)) {
            insideThink = false;
            fullText = fullText.replace(/<think>[\s\S]*?<\/think>/gi, '');
          }

          if (!insideThink) {
            // Atualiza texto parcial visível na UI, removendo tags <think>
            this.inProgressAiText = fullText.replace(/<think>[\s\S]*?<\/think>/gi, '');
          }

          this.cdr.detectChanges(); // Força atualização da view
          this.scrollToBottom(); // Mantém scroll no fundo enquanto chegam dados
        });
      });

      // Ao terminar o stream, limpa e adiciona a mensagem final
      const cleanFinal = this.cleanResponse(fullText);
      this.messages.push({ sender: 'ai', text: cleanFinal });
      await this.chatService.addMessage(this.chatId, 'ai', cleanFinal);
      this.inProgressAiText = '';

    } catch (e) {
      // Em caso de erro, adiciona mensagem de erro e guarda no serviço
      const errorMsg = '[Erro ao obter resposta da IA]';
      this.messages.push({ sender: 'ai', text: errorMsg });
      await this.chatService.addMessage(this.chatId, 'ai', errorMsg);
      this.inProgressAiText = '';
    } finally {
      this.isLoading = false;
    }
  }
}
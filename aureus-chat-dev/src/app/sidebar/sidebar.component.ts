import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, switchMap, of, combineLatest, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  
  searchTerm = '';
  private searchSubject = new BehaviorSubject<string>('');
  
  chats$: Observable<any[]>;
  selectedChatId: string | null = null;

  constructor(private router: Router) {
    // Observable dos chats base
    const baseChats$ = this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        return this.chatService.getChats();
      })
    );

    // Combina os chats com o termo de pesquisa para filtrar
    this.chats$ = combineLatest([
      baseChats$,
      this.searchSubject.asObservable()
    ]).pipe(
      map(([chats, searchTerm]) => {
        if (!searchTerm.trim()) {
          return chats;
        }
        return chats.filter(chat => 
          chat['title'].toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    );
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  openChat(id: string) {
    this.selectedChatId = id;
    this.router.navigate(['/chat', id]);
  }

  createNewChat() {
    const defaultTitle = 'New Chat';
    this.chatService.createChat(defaultTitle).then((id) => {
      this.openChat(id);
    });
  }
}
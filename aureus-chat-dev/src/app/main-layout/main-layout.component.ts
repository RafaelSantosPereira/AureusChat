import { Component, inject, computed, AfterViewInit } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { AiService } from '../services/lmstudio.service' // ajusta o caminho se necessário
import { FormsModule } from '@angular/forms';
import { ViewChild, ElementRef } from '@angular/core';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NgIf, NgFor, FormsModule, CommonModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
  
})
export class MainLayoutComponent  {
  authService = inject(AuthService);
  router = inject(Router);
  aiService = inject(AiService);

  @ViewChild('chatContainer') chatContainer!: ElementRef;


  

  

  
  
}
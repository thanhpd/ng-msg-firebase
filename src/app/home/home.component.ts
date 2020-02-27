import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  userChatRoom$: Observable<any>;

  constructor(
    public authService: AuthService,
    public chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.userChatRoom$ = this.chatService.getUserChats();
  }
}

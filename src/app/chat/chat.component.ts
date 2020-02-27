import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit {
  chat$: Observable<any>;
  chatForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public chatService: ChatService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.createForm();
    const roomHistory$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => this.chatService.getRoomHistory(id))
    );
    this.chat$ = this.chatService.mapWithUser(roomHistory$);
  }

  get roomLocation() {
    return window.location.href;
  }

  private createForm() {
    this.chatForm = this.fb.group({
      messageCtrl: [null, [Validators.required, Validators.maxLength(100)]]
    });
  }

  submit(roomId) {
    if (this.chatForm.valid) {
      this.chatService.sendMessage(roomId, this.chatForm.value.messageCtrl);
      this.chatForm.reset();
    } else {
      // TODO:
    }
  }

  trackByCreated(i, msg) {
    return msg.createdAt;
  }
}

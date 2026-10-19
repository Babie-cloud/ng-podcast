import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ChatService, type ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements OnInit, OnDestroy {
  private readonly chat = inject(ChatService);

  readonly tab = signal<'community' | 'dm'>('community');
  readonly messages = signal<ChatMessage[]>([]);
  readonly draft = signal('');
  readonly peerId = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    void this.refresh();
    this.pollTimer = setInterval(() => void this.refresh(), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  setTab(tab: 'community' | 'dm'): void {
    this.tab.set(tab);
    void this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      if (this.tab() === 'community') {
        this.messages.set(await this.chat.communityHistory());
      } else {
        const peer = this.peerId().trim();
        if (!peer) {
          this.messages.set([]);
          return;
        }
        this.messages.set(await this.chat.dmHistory(peer));
      }
      this.error.set(null);
    } catch {
      this.error.set('Chat indisponible (Premium requis ou serveur arrêté).');
    }
  }

  async send(): Promise<void> {
    const body = this.draft().trim();
    if (!body || this.busy()) return;

    this.busy.set(true);
    try {
      if (this.tab() === 'community') {
        await this.chat.postCommunity(body);
      } else {
        const peer = this.peerId().trim();
        if (!peer) {
          this.error.set('Indiquez l’ID utilisateur du destinataire.');
          return;
        }
        await this.chat.postDm(peer, body);
      }
      this.draft.set('');
      await this.refresh();
    } finally {
      this.busy.set(false);
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  id: string;
  threadId: string | null;
  channel: string | null;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/chat`;

  communityHistory(): Promise<ChatMessage[]> {
    return firstValueFrom(this.http.get<ChatMessage[]>(`${this.base}/community`));
  }

  postCommunity(body: string): Promise<ChatMessage> {
    return firstValueFrom(this.http.post<ChatMessage>(`${this.base}/community`, { body }));
  }

  dmHistory(peerId: string): Promise<ChatMessage[]> {
    return firstValueFrom(this.http.get<ChatMessage[]>(`${this.base}/dm/${peerId}`));
  }

  postDm(peerId: string, body: string): Promise<ChatMessage> {
    return firstValueFrom(
      this.http.post<ChatMessage>(`${this.base}/dm/${peerId}`, { body }),
    );
  }
}

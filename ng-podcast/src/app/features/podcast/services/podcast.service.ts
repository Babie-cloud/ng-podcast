// src/app/features/podcast/services/podcast.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Podcast } from '../models/podcast.model';
import { UploadProgress, CreatePodcastPayload } from './podcast.service.types';

export type { UploadProgress, CreatePodcastPayload };
@Injectable({ providedIn: 'root' })

export class PodcastService {

  // ─── Données fictives ────────────────────────────────────────
  private mockPodcasts: Podcast[] = [
    {
      id: '1',
      title: 'Les Chroniques du Lundi',
      description: 'Un podcast hebdomadaire sur la tech et la société.',
      coverUrl: 'https://picsum.photos/seed/pod1/300/300',
      authorId: 'user1',
      authorName: 'Karlie',
      episodes: [
        {
          id: 'ep1',
          title: 'Introduction — Bienvenue !',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          duration: 212,
          podcastId: '1',
          createdAt: new Date()
        }
      ],
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Confessions du Soir',
      description: 'Des témoignages authentiques et émouvants.',
      coverUrl: 'https://picsum.photos/seed/pod2/300/300',
      authorId: 'user1',
      authorName: 'Karlie',
      episodes: [],
      createdAt: new Date()
    },
    {
      id: '3',
      title: 'Poèmes & Mots',
      description: 'La poésie lue à voix haute.',
      coverUrl: 'https://picsum.photos/seed/pod3/300/300',
      authorId: 'user1',
      authorName: 'Karlie',
      episodes: [],
      createdAt: new Date()
    }
  ];

  // ─── MÉTHODES MOCKÉES ────────────────────────────────────────

  async getAll(): Promise<Podcast[]> {
    // Simule un délai réseau de 800ms
    return new Promise(resolve =>
      setTimeout(() => resolve(this.mockPodcasts), 800)
    );
  }

  async getMine(): Promise<Podcast[]> {
    return new Promise(resolve =>
      setTimeout(() => resolve(this.mockPodcasts), 800)
    );
  }

  async getById(id: string): Promise<Podcast> {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        const found = this.mockPodcasts.find(p => p.id === id);
        found ? resolve(found) : reject(new Error('Podcast introuvable'));
      }, 500)
    );
  }

  create(payload: CreatePodcastPayload): Observable<UploadProgress> {
    // Simule une progression d'upload
    return new Observable(observer => {
      let percent = 0;
      const interval = setInterval(() => {
        percent += 20;
        observer.next({ percent, done: false });
        if (percent >= 100) {
          clearInterval(interval);
          // Ajoute le podcast à la liste mock
          this.mockPodcasts.unshift({
            id: Date.now().toString(),
            title:       payload.title,
            description: payload.description,
            coverUrl:    payload.coverFile ?? 'https://picsum.photos/seed/new/300/300',
            authorId:    'user1',
            authorName:  'Karlie',
            episodes:    [],
            createdAt:   new Date()
          });
          observer.next({ percent: 100, done: true });
          observer.complete();
        }
      }, 300);
    });
  }

  async update(id: string, payload: Partial<CreatePodcastPayload>): Promise<Podcast> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.mockPodcasts.findIndex(p => p.id === id);
        if (index === -1) { reject(new Error('Introuvable')); return; }
        this.mockPodcasts[index] = {
          ...this.mockPodcasts[index],
          ...payload
        } as Podcast;
        resolve(this.mockPodcasts[index]);
      }, 500);
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise(resolve =>
      setTimeout(() => {
        this.mockPodcasts = this.mockPodcasts.filter(p => p.id !== id);
        resolve();
      }, 300)
    );
  }
}
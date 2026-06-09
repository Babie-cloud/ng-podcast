import {
  Component,
  OnDestroy,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioStudioService } from '../../services/audio-studio.service';
import { SoundLibraryService } from '../../services/sound-library.service';
import { formatTime } from '../../utils/audio-buffer.util';
import type { FreesoundSound, SoundLibraryCategory } from '../../models/freesound.types';
import { SOUND_LIBRARY_DURATION_LIMITS } from '../../models/freesound.types';

@Component({
  selector: 'app-sound-library',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sound-library.html',
  styleUrl: './sound-library.scss',
})
export class SoundLibrary implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  readonly library = inject(SoundLibraryService);
  readonly studio = inject(AudioStudioService);

  readonly searchInput = signal('');
  readonly previewingId = signal<number | null>(null);
  readonly addingId = signal<number | null>(null);
  readonly addError = signal<string | null>(null);

  private previewAudio: HTMLAudioElement | null = null;

  ngOnDestroy(): void {
    this.stopPreview();
  }

  durationLimit(category: SoundLibraryCategory): number {
    return SOUND_LIBRARY_DURATION_LIMITS[category];
  }

  formatDuration(seconds: number): string {
    return formatTime(seconds);
  }

  onCategoryChange(category: SoundLibraryCategory): void {
    this.library.setCategory(category);
    const query = this.searchInput().trim();
    if (query) {
      void this.library.search(query, category);
    }
  }

  async onSearch(): Promise<void> {
    await this.library.search(this.searchInput(), this.library.category());
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.onSearch();
    }
  }

  isPreviewing(sound: FreesoundSound): boolean {
    return this.previewingId() === sound.id;
  }

  isAdding(sound: FreesoundSound): boolean {
    return this.addingId() === sound.id;
  }

  togglePreview(sound: FreesoundSound): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const url = this.library.getPreviewUrl(sound);
    if (!url) {
      this.addError.set('No preview available for this sound.');
      return;
    }

    this.addError.set(null);

    if (this.previewingId() === sound.id) {
      this.stopPreview();
      return;
    }

    this.stopPreview();
    this.previewAudio = new Audio(url);
    this.previewingId.set(sound.id);

    this.previewAudio.onended = () => {
      this.previewingId.set(null);
      this.previewAudio = null;
    };
    this.previewAudio.onerror = () => {
      this.previewingId.set(null);
      this.previewAudio = null;
      this.addError.set('Preview playback failed.');
    };

    void this.previewAudio.play().catch(() => {
      this.previewingId.set(null);
      this.previewAudio = null;
      this.addError.set('Preview playback was blocked.');
    });
  }

  async addToStudio(sound: FreesoundSound): Promise<void> {
    this.addError.set(null);
    this.addingId.set(sound.id);

    try {
      const blob = await this.library.fetchPreviewBlob(sound);
      const category = this.library.category();
      const trackType = category === 'background' ? 'music' : 'imported';
      await this.studio.addTrack(blob, sound.name, trackType);
      this.stopPreview();
    } catch (err: unknown) {
      this.addError.set(err instanceof Error ? err.message : 'Could not add sound.');
    } finally {
      this.addingId.set(null);
    }
  }

  private stopPreview(): void {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio.onended = null;
      this.previewAudio.onerror = null;
      this.previewAudio = null;
    }
    this.previewingId.set(null);
  }
}

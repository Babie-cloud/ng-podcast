import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodePlay } from './episode-play';

describe('EpisodePlay', () => {
  let component: EpisodePlay;
  let fixture: ComponentFixture<EpisodePlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodePlay],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodePlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

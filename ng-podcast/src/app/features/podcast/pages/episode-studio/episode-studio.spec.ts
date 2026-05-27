import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeStudio } from './episode-studio';

describe('EpisodeStudio', () => {
  let component: EpisodeStudio;
  let fixture: ComponentFixture<EpisodeStudio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeStudio],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeStudio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

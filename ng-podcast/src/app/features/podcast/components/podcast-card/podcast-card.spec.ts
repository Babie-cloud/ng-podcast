import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodcastCard } from './podcast-card';

describe('PodcastCard', () => {
  let component: PodcastCard;
  let fixture: ComponentFixture<PodcastCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodcastCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PodcastCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

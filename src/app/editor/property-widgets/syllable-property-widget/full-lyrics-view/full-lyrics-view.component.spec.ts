import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FullLyricsViewComponent } from './full-lyrics-view.component';

describe('FullLyricsViewComponent', () => {
  let component: FullLyricsViewComponent;
  let fixture: ComponentFixture<FullLyricsViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FullLyricsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FullLyricsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FullLyricsViewLineComponent } from './full-lyrics-view-line.component';

describe('FullLyricsViewLineComponent', () => {
  let component: FullLyricsViewLineComponent;
  let fixture: ComponentFixture<FullLyricsViewLineComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FullLyricsViewLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FullLyricsViewLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LyricsSelectTextDialogComponent } from './lyrics-select-text-dialog.component';

describe('LyricsSelectTextDialogComponent', () => {
  let component: LyricsSelectTextDialogComponent;
  let fixture: ComponentFixture<LyricsSelectTextDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LyricsSelectTextDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LyricsSelectTextDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

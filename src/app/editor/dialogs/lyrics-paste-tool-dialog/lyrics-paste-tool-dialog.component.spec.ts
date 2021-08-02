import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LyricsPasteToolDialogComponent } from './lyrics-paste-tool-dialog.component';

describe('LyricsPasteToolDialogComponent', () => {
  let component: LyricsPasteToolDialogComponent;
  let fixture: ComponentFixture<LyricsPasteToolDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LyricsPasteToolDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LyricsPasteToolDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

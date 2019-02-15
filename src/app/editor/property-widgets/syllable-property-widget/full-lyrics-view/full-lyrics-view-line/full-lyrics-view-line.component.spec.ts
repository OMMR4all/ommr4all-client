import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FullLyricsViewLineComponent } from './full-lyrics-view-line.component';

describe('FullLyricsViewLineComponent', () => {
  let component: FullLyricsViewLineComponent;
  let fixture: ComponentFixture<FullLyricsViewLineComponent>;

  beforeEach(async(() => {
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

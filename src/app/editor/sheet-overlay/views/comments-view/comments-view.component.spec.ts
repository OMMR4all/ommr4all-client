import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentsViewComponent } from './comments-view.component';

describe('CommentsViewComponent', () => {
  let component: CommentsViewComponent;
  let fixture: ComponentFixture<CommentsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommentsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

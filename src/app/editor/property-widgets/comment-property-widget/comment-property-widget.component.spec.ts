import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommentPropertyWidgetComponent } from './comment-property-widget.component';

describe('CommentPropertyWidgetComponent', () => {
  let component: CommentPropertyWidgetComponent;
  let fixture: ComponentFixture<CommentPropertyWidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CommentPropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentPropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

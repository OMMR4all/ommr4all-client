import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentPropertyWidgetComponent } from './comment-property-widget.component';

describe('CommentPropertyWidgetComponent', () => {
  let component: CommentPropertyWidgetComponent;
  let fixture: ComponentFixture<CommentPropertyWidgetComponent>;

  beforeEach(async(() => {
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

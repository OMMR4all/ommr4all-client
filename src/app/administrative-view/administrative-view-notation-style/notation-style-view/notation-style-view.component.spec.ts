import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotationStyleViewComponent } from './notation-style-view.component';

describe('NotationStyleViewComponent', () => {
  let component: NotationStyleViewComponent;
  let fixture: ComponentFixture<NotationStyleViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotationStyleViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotationStyleViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookTrainViewComponent } from './book-train-view.component';

describe('BookTrainViewComponent', () => {
  let component: BookTrainViewComponent;
  let fixture: ComponentFixture<BookTrainViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookTrainViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookTrainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookTrainOverviewComponent } from './book-train-overview.component';

describe('BookTrainOverviewComponent', () => {
  let component: BookTrainOverviewComponent;
  let fixture: ComponentFixture<BookTrainOverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookTrainOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookTrainOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

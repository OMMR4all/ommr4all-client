import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookSecurityViewComponent } from './book-security-view.component';

describe('BookSecurityViewComponent', () => {
  let component: BookSecurityViewComponent;
  let fixture: ComponentFixture<BookSecurityViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookSecurityViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookSecurityViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

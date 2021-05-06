import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMonodySelectionComponent } from './document-monody-selection.component';

describe('DocumentMonodySelectionComponent', () => {
  let component: DocumentMonodySelectionComponent;
  let fixture: ComponentFixture<DocumentMonodySelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentMonodySelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentMonodySelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniSurveyFormComponent } from './mini-survey-form.component';

describe('MiniSurveyFormComponent', () => {
  let component: MiniSurveyFormComponent;
  let fixture: ComponentFixture<MiniSurveyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniSurveyFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniSurveyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniSurveyQurstionsComponent } from './mini-survey-qurstions.component';

describe('MiniSurveyQurstionsComponent', () => {
  let component: MiniSurveyQurstionsComponent;
  let fixture: ComponentFixture<MiniSurveyQurstionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniSurveyQurstionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniSurveyQurstionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

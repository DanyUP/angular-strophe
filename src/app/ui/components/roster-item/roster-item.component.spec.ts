import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RosterItemComponent } from './roster-item.component';

describe('RosterItemComponent', () => {
  let component: RosterItemComponent;
  let fixture: ComponentFixture<RosterItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RosterItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RosterItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

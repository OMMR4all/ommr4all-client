import { Component, OnInit } from '@angular/core';
import { StaffsService } from '../staffs.service';

@Component({
  selector: 'app-preprocessing',
  templateUrl: './preprocessing.component.html',
  styleUrls: ['./preprocessing.component.css']
})
export class PreprocessingComponent implements OnInit {

  constructor(public staffService: StaffsService) { }

  ngOnInit() {
  }

}

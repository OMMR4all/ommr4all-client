import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { BookViewService } from './book-view.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {PageResponse} from '../data-types/page';


@Component({
  selector: 'app-book-view',
  templateUrl: './book-view.component.html',
  styleUrls: ['./book-view.component.css']
})
export class BookViewComponent implements OnInit {
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public bookViewService: BookViewService
  ) { }

  ngOnInit() {
  }
}

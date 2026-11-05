import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HomeComponent implements OnInit {
  images = [
    {
      image: 'assets/tutorial/add.png',
      thumbImage: 'assets/tutorial/add.png',
      alt: 'add a new book',
      title: 'Add a new book',
    },
    {
      image: 'assets/tutorial/upload.png',
      thumbImage: 'assets/tutorial/upload.png',
      alt: 'upload manuscripts',
      title: 'Upload manuscripts',
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}

import {Component, Input, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";

@Component({
  selector: 'app-image-text-pair',
  templateUrl: './image-text-pair.component.html',
  styleUrls: ['./image-text-pair.component.scss']
})
export class ImageTextPairComponent implements OnInit {
  @Input() gtText: string;
  @Input() predictText: string;
  @Input() imageResourceUrl: SafeResourceUrl | string;
  @Input() index: number;

  constructor(private _sanitizer: DomSanitizer,
  ) { }

  safeImage(imageText) {
    return this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + imageText);
  }

  ngOnInit(): void {
  }

}

import {Component, Input, OnDestroy, OnInit, Renderer2} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-hover-menu',
  templateUrl: './hover-menu.component.html',
  styleUrls: ['./hover-menu.component.css']
})
export class HoverMenuComponent implements OnInit, OnDestroy {
  private _timeout: any;
  private _isMatMenuOpen = false;
  _enteredButton = false;

  constructor(
    private ren: Renderer2,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
  }

  check(handle: () => void, timeout: number = 0) {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._timeout = setTimeout(handle, timeout);
  }

  menuEnter() {
    this._isMatMenuOpen = true;
  }

  menuLeave(trigger: MatMenuTrigger, button: HTMLButtonElement) {
    this._isMatMenuOpen = false;
    this.check(() => {
      if (!this._enteredButton && trigger.menuOpen) {
        trigger.closeMenu();
        this.ren.removeClass(button['_elementRef'].nativeElement, 'cdk-focused');
        this.ren.removeClass(button['_elementRef'].nativeElement, 'cdk-program-focused');
      }
    }, 100);
  }

  triggerEnter(trigger: MatMenuTrigger) {
    this._enteredButton = true;
    this.check(() => {
      if (!this._isMatMenuOpen && !trigger.menuOpen) {
        trigger.openMenu();
      }
    });
  }

  triggerLeave(trigger: MatMenuTrigger, button: HTMLButtonElement) {
    this.check(() => {
      if (!this._isMatMenuOpen && trigger.menuOpen) {
        trigger.closeMenu();
        this.ren.removeClass(button['_elementRef'].nativeElement, 'cdk-focused');
        this.ren.removeClass(button['_elementRef'].nativeElement, 'cdk-program-focused');
      }
    }, 100);
    this._enteredButton = false;
  }

}

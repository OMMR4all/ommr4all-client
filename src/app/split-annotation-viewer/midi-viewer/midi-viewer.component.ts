import {AfterViewInit, Component, Input, OnDestroy, OnInit} from '@angular/core';
import * as mm from '@magenta/music/es6/core/';
import {PageState} from '../../editor/editor.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
@Component({
  selector: 'app-midi-viewer',
  templateUrl: './midi-viewer.component.html',
  styleUrls: ['./midi-viewer.component.scss']
})
export class MidiViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  private player = null;
  public _playerStatePlaying = false;
  private _currentPageState: PageState = null;
  private _noteSequence = null;
  public loaded = false;
  private _nodeListIndex = 0;
  @Input()
  pageState: PageState;
  @Input()
  svgNodes;
  constructor(private http: HttpClient) {

  }

  ngAfterViewInit() {
    this.player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus', undefined, undefined, undefined, {
      run: (note) => {
        if (this._nodeListIndex > 0) {
          this.svgNodes[this._nodeListIndex - 1].childNodes[0].style.fill = '#FF000000';
        }
        this.svgNodes[this._nodeListIndex].childNodes[0].style.fill = 'red';
        this._nodeListIndex += 1;
      },
      stop: () => {
        this.player.stop();
        if (this._nodeListIndex > 0) {
          this.svgNodes[this._nodeListIndex - 1].childNodes[0].style.fill = '#FF000000';
        }
        this._playerStatePlaying = false;

      }
    });
    // Players can also play at a different tempo

  }

  ngOnInit() {
    if (this.pageState.pcgts !== null && this.pageState.pcgts !== undefined) {
      // tslint:disable-next-line:max-line-length
      if (this._currentPageState === null || (this.pageState.pcgts.page.imageFilename !== this._currentPageState.pcgts.page.imageFilename)) {
        this._currentPageState = this.pageState;
        this.getNodeSequence();
        }

      }
  }

  play_pause() {
    if (this._playerStatePlaying === false) {
      // this.player.setTempo(200);
      this.player.start(this._noteSequence);
      this._playerStatePlaying = true;
    } else if (this._playerStatePlaying === true) {
      this.player.stop();
      this._playerStatePlaying = false;

    }
  }
  isPlaying() {
    return this._playerStatePlaying;
  }
  getNodeSequence() {
    // change current state and load the preview of the next image
    const url = this._currentPageState.pageCom.midi_url();
    this.http.get(url).subscribe(
      s => {
        this.loaded = true;
        this._noteSequence = s;
        }
      , error => {
        console.log('Todo Api Error, while loading note sequence');
      });
  }

  ngOnDestroy(): void {
    if (this._playerStatePlaying === true) {
      this.player.stop();
      this._playerStatePlaying = false;
    }
  }
}

import {AfterViewInit, Component, Input, OnDestroy, OnInit, inject, NgZone} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
    selector: 'app-midi-viewer',
    templateUrl: './midi-viewer.component.html',
    styleUrls: ['./midi-viewer.component.scss'],
    standalone: false
})
export class MidiViewerComponent implements OnInit, OnDestroy{
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  public _playerStatePlaying = false;
  private _noteSequence: any = null;
  public loaded = false;
  private playbackId = 0;
  private Tone: any;
  private sampler: any;
  @Input() url: string;
  @Input() svgNodes: any[];

  async ngOnInit() {
    this.Tone = await import('tone');

    this.initSampler();
    this.getNodeSequence();
  }

  private initSampler() {
    this.ngZone.runOutsideAngular(() => {
      // Use this.Tone instead of Tone
      this.sampler = new this.Tone.Sampler({
        urls: { A0: 'A0.mp3', C1: 'C1.mp3', A1: 'A1.mp3', C2: 'C2.mp3' },
        baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/',
        onload: () => {
          this.ngZone.run(() => this.loaded = true);
        }
      }).toDestination();
    });
  }

  getNodeSequence() {
    this.http.get(this.url).subscribe({
      next: (res: any) => {
        this._noteSequence = res;
        this.loaded = true;
      },
      error: (err) => console.error('API Error loading sequence', err)
    });
  }

  private startPlayback() {
    if (!this._noteSequence?.notes || !this.Tone) { return; }

    this.playbackId++;
    const currentId = this.playbackId;

    this.stopPlaybackInternal();
    this._playerStatePlaying = true;
    const startOffset = 0.1;

    this.ngZone.runOutsideAngular(() => {
      this._noteSequence.notes.forEach((note: any, index: number) => {
        // Use this.Tone
        const noteName = this.Tone.Frequency(note.pitch, 'midi').toNote();
        const duration = note.endTime - note.startTime;

        this.Tone.Transport.schedule((time: any) => {
          this.sampler.triggerAttackRelease(noteName, duration, time);
        }, note.startTime + startOffset);

        this.Tone.Transport.schedule((time: any) => {
          this.Tone.Draw.schedule(() => {
            if (currentId === this.playbackId) {
              this.highlightNode(index);
            }
          }, time);
        }, note.startTime + startOffset);
      });

      const endTime = this._noteSequence.totalTime || this._noteSequence.notes[this._noteSequence.notes.length - 1].endTime;
      this.Tone.Transport.schedule((time: any) => {
        this.Tone.Draw.schedule(() => {
          if (currentId === this.playbackId) {
            this.ngZone.run(() => this.stopPlayback());
          }
        }, time);
      }, endTime + startOffset + 0.1);

      this.Tone.Transport.start();
    });
  }
  private stopPlaybackInternal() {
    if (!this.Tone) return;
    this.Tone.Transport.stop();
    this.Tone.Transport.seconds = 0;
    this.Tone.Transport.cancel(0);
    this.Tone.Draw.cancel(0);
    this.resetStyles();
  }
  private stopPlayback() {
    this.playbackId++;
    this.stopPlaybackInternal();
    if (this.sampler) {
      this.sampler.releaseAll();
    }
    this._playerStatePlaying = false;
  }

  private highlightNode(index: number) {
    if (!this._playerStatePlaying || !this.svgNodes) { return; }

    for (let i = 0; i < this.svgNodes.length; i++) {
      const child = this.svgNodes[i]?.childNodes[0] as HTMLElement;
      if (child) { child.style.fill = 'transparent'; }
    }

    const current = this.svgNodes[index]?.childNodes[0] as HTMLElement;
    if (current) { current.style.fill = 'red'; }
  }
  private resetStyles() {
    this.svgNodes?.forEach(n => {
      if (n.childNodes[0]) { n.childNodes[0].style.fill = 'transparent'; }
    });
  }

  ngOnDestroy() {
    this.stopPlayback();
    this.sampler.dispose();
  }
  isPlaying(): boolean {
    return this._playerStatePlaying;
  }
}

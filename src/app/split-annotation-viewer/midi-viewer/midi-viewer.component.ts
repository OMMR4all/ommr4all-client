import {AfterViewInit, Component, Input, OnDestroy, OnInit, inject, NgZone, ChangeDetectorRef} from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  private Tone: any;
  private sampler: any;
  public _playerStatePlaying = false;
  private _noteSequence: any = null;
  public loaded = false;
  private playbackId = 0;
  private activeSvgNode: Element | null = null;
  @Input() url: string;
  @Input() svgNodes: any[];

  async ngOnInit() {
    const toneModule: any = await import('tone');
    this.Tone = toneModule.default || toneModule;

    this.initSampler();
    this.getNodeSequence();
  }

  private initSampler() {
    this.ngZone.runOutsideAngular(() => {
      this.sampler = new this.Tone.Sampler({
        urls: { A0: 'A0.mp3', C1: 'C1.mp3', A1: 'A1.mp3', C2: 'C2.mp3' },
        baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/',
        onload: () => {
          this.ngZone.run(() => {
            this.loaded = true;
            this.cdr.detectChanges();
          });
        }
      }).toDestination();
    });
  }

  getNodeSequence() {
    this.http.get(this.url).subscribe({
      next: (res: any) => {
        this._noteSequence = res;
      },
      error: (err) => console.error('API Error loading sequence', err)
    });
  }

  async play_pause() {
    if (!this.Tone) return;

    try {
      if (this.Tone.context.state !== 'running') {
        await this.Tone.start();
      }

      if (!this._playerStatePlaying) {
        this.stopPlaybackInternal();
        this.startPlayback();
      } else {
        this.stopPlayback();
      }
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  private startPlayback() {
    if (!this._noteSequence?.notes || !this.Tone) { return; }

    this.playbackId++;
    const currentId = this.playbackId;

    this.stopPlaybackInternal();
    this._playerStatePlaying = true;
    this.cdr.detectChanges();

    const startOffset = 0.1;

    this.ngZone.runOutsideAngular(() => {
      this._noteSequence.notes.forEach((note: any, index: number) => {
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

    try {
      if (this.sampler) this.sampler.releaseAll();
    } catch(e) {}

    this._playerStatePlaying = false;
    this.cdr.detectChanges();
  }

  private highlightNode(index: number) {
    if (!this._playerStatePlaying || !this.svgNodes) { return; }

    this.resetStyles();

    const currentGroup = this.svgNodes[index] as Element;
    if (currentGroup) {
      const useNode = currentGroup.querySelector('use');

      if (useNode) {
        useNode.classList.add('highlighted-midi-note');
        this.activeSvgNode = useNode;
        console.log(`Highlighted note at index ${index}!`); // Uncomment to debug
      } else {
        console.warn(`No <use> tag found for note index ${index}`);
      }
    }
  }

  private resetStyles() {
    if (this.activeSvgNode) {
      this.activeSvgNode.classList.remove('highlighted-midi-note');
      this.activeSvgNode = null;
    }
  }
  ngOnDestroy() {
    this.stopPlayback();
    if (this.sampler) {
      this.sampler.dispose();
    }
  }

  isPlaying(): boolean {
    return this._playerStatePlaying;
  }
}

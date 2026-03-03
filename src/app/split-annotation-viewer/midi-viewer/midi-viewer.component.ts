import { AfterViewInit, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import * as Tone from 'tone';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
    selector: 'app-midi-viewer',
    templateUrl: './midi-viewer.component.html',
    styleUrls: ['./midi-viewer.component.scss'],
    standalone: false
})
export class MidiViewerComponent implements OnInit, OnDestroy{
  private http = inject(HttpClient);

  private sampler: Tone.Sampler;
  public _playerStatePlaying = false;
  private _noteSequence: any = null;
  public loaded = false;
  private playbackId = 0;
  @Input() url: string;
  @Input() svgNodes: any[];

  ngOnInit() {
    this.initSampler();
    this.getNodeSequence();
  }

  private initSampler() {
    this.sampler = new Tone.Sampler({
      urls: { A0: 'A0.mp3', C1: 'C1.mp3', A1: 'A1.mp3', C2: 'C2.mp3' },
      baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/',
      onload: () => { this.loaded = true; }
    }).toDestination();
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

  async play_pause() {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (!this._playerStatePlaying) {
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;
      Tone.Transport.cancel(0);
      this.resetStyles();

      this.startPlayback();
    } else {
      this.stopPlayback();
    }
  }
  private startPlayback() {
    if (!this._noteSequence?.notes) { return; }

    this.playbackId++;
    const currentId = this.playbackId;

    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
    Tone.Transport.cancel(0);
    Tone.Draw.cancel(0);

    this._playerStatePlaying = true;
    const startOffset = 0.1;

    this._noteSequence.notes.forEach((note: any, index: number) => {
      const noteName = Tone.Frequency(note.pitch, 'midi').toNote();
      const duration = note.endTime - note.startTime;

      Tone.Transport.schedule((time) => {
        this.sampler.triggerAttackRelease(noteName, duration, time);
      }, note.startTime + startOffset);

      Tone.Transport.schedule((time) => {
        Tone.Draw.schedule(() => {
          if (currentId === this.playbackId) {
            this.highlightNode(index);
          }
        }, time);
      }, note.startTime + startOffset);
    });

    const endTime = this._noteSequence.totalTime || this._noteSequence.notes[this._noteSequence.notes.length - 1].endTime;
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => {
        if (currentId === this.playbackId) { this.stopPlayback(); }
      }, time);
    }, endTime + startOffset + 0.1);

    Tone.Transport.start();
  }

  private stopPlayback() {
    this.playbackId++;

    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
    Tone.Transport.cancel(0);
    Tone.Draw.cancel(0);

    this.sampler.releaseAll();
    this._playerStatePlaying = false;

    setTimeout(() => this.resetStyles(), 0);
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

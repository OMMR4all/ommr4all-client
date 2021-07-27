import {Component, Inject, OnInit} from '@angular/core';
import {ActionsService} from '../../actions/actions.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {Page} from '../../../data-types/page/page';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {LyricsPasteToolDialogComponent} from '../lyrics-paste-tool-dialog/lyrics-paste-tool-dialog.component';
import {EditorService} from '../../editor.service';

export class LyricsSelectTextData {
  docs: Array<string>;
}
@Component({
  selector: 'app-lyrics-select-text-dialog',
  templateUrl: './lyrics-select-text-dialog.component.html',
  styleUrls: ['./lyrics-select-text-dialog.component.scss']
})


export class LyricsSelectTextDialogComponent implements OnInit {
  currentIndex = 0;

  constructor(    public actions: ActionsService,
                  private modalDialog: MatDialog,
                  private editorService: EditorService,
                  private dialogRef: MatDialogRef<LyricsSelectTextDialogComponent>,
                  @Inject(MAT_DIALOG_DATA) public data: LyricsSelectTextData, ) { }

  getDocs() {
    return this.data.docs;
  }
  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    console.log('tabChangeEvent => ', tabChangeEvent);
    console.log('index => ', tabChangeEvent.index);
    this.currentIndex = tabChangeEvent.index;
  }

  ngOnInit() {
      if (this.data.docs.length <= 0) { close(); }
    }
  close(r: any = false) {
    this.dialogRef.close(r);
  }
  select() {
    this.close();
    this.modalDialog.open(LyricsPasteToolDialogComponent, {
      disableClose: false,
      width: '600px',
      data: {
        page: this.editorService.pcgts.page,
        preData: this.getDocs()[this.currentIndex]

      }
    });
  }

}

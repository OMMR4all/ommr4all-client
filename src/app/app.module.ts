import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SheetOverlayComponent } from './editor/sheet-overlay/sheet-overlay.component';
import { LineEditorComponent } from './editor/sheet-overlay/editor-tools/line-editor/line-editor.component';
import { ToolBarComponent } from './editor/tool-bar/tool-bar.component';
import { StaffGrouperComponent } from './editor/sheet-overlay/editor-tools/staff-grouper/staff-grouper.component';
import { DebugComponent } from './editor/debug/debug.component';
import { SymbolEditorComponent } from './editor/sheet-overlay/editor-tools/symbol-editor/symbol-editor.component';
import { RectEditorComponent } from './editor/sheet-overlay/editors/rect-editor/rect-editor.component';
import {FormsModule} from '@angular/forms';
import { AutoInputResizeDirective } from './autoinputresize.directive';
import { PagesPreviewComponent } from './editor/pages-preview/pages-preview.component';
import { SymbolComponent } from './editor/sheet-overlay/elements/symbol/symbol.component';
import { PreprocessingComponent } from './preprocessing/preprocessing.component';
import { LoaderIconComponent } from './loader-icon/loader-icon.component';
import { SelectionBoxComponent } from './editor/sheet-overlay/editors/selection-box/selection-box.component';
import { BookViewComponent } from './book-view/book-view.component';
import { BooksPreviewComponent } from './book-view/books-preview/books-preview.component';
import { PageUploaderComponent } from './book-view/page-uploader/page-uploader.component';
import { DropzoneModule } from 'ngx-dropzone-wrapper';
import {RouterModule, Routes} from '@angular/router';
import { BookListViewComponent } from './book-list-view/book-list-view.component';
import { EditorComponent } from './editor/editor.component';
import 'reflect-metadata';
import { TextRegionComponent } from './editor/sheet-overlay/editor-tools/text-region/text-region.component';
import { TextLineComponent } from './editor/sheet-overlay/elements/text-line/text-line.component';
import { PolylineComponent } from './editor/sheet-overlay/elements/polyline/polyline.component';
import { PolylineEditorComponent } from './editor/sheet-overlay/editors/polyline-editor/polyline-editor.component';
import { NonScalingPointComponent } from './editor/sheet-overlay/elements/non-scaling-point/non-scaling-point.component';
import { NonScalingComponent } from './editor/sheet-overlay/elements/non-scaling-component/non-scaling.component';
import { LayoutEditorComponent } from './editor/sheet-overlay/editor-tools/layout-editor/layout-editor.component';
import {ContextMenuModule} from 'ngx-contextmenu';
import { RegionTypeContextMenuComponent } from './editor/sheet-overlay/context-menus/region-type-context-menu/region-type-context-menu.component';
import { NotePropertyWidgetComponent } from './editor/property-widgets/note-property-widget/note-property-widget.component';
import { TextEditorComponent } from './editor/sheet-overlay/editor-tools/text-editor/text-editor.component';
import { TextEditorOverlayComponent } from './editor/sheet-overlay/editor-tools/text-editor/text-editor-overlay/text-editor-overlay.component';
import { SyllableEditorComponent } from './editor/sheet-overlay/editor-tools/syllable-editor/syllable-editor.component';
import { SyllableEditorOverlayComponent } from './editor/sheet-overlay/editor-tools/syllable-editor/syllable-editor-overlay/syllable-editor-overlay.component';
import { DebugActionStatisticsComponent } from './editor/debug/debug-action-statistics/debug-action-statistics.component';
import { PagePreviewComponent } from './page-preview/page-preview.component';
import {HttpClientModule} from '@angular/common/http';
import { StaffSplitterComponent } from './editor/sheet-overlay/editor-tools/staff-splitter/staff-splitter.component';
import { ModalDialogModule } from 'ngx-modal-dialog';
import {AddNewDialogComponent} from './book-list-view/dialogs/add-new-dialog/add-new-dialog.component';
import { ErrorMessageComponent } from './common/error-message/error-message.component';
import { ConfirmDeleteBookDialogComponent } from './book-list-view/dialogs/confirm-delete-book-dialog/confirm-delete-book-dialog.component';
import { DetectStaffLinesDialogComponent } from './editor/dialogs/detect-stafflines-dialog/detect-stafflines-dialog.component';
import { DetectSymbolsDialogComponent } from './editor/dialogs/detect-symbols-dialog/detect-symbols-dialog.component';
import { TrainSymbolsDialogComponent } from './editor/dialogs/train-symbols-dialog/train-symbols-dialog.component';
import { ServerStateComponent } from './server-state/server-state.component';

const appRoutes: Routes = [
  { path: 'book', component: BookListViewComponent },
  { path: 'book/:book_id/:page_id/edit', component: EditorComponent },
  { path: 'book/:book_id/:page_id', component: BookViewComponent },
  { path: 'book/:book_id', component: BookViewComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    SheetOverlayComponent,
    LineEditorComponent,
    ToolBarComponent,
    StaffGrouperComponent,
    DebugComponent,
    SymbolEditorComponent,
    RectEditorComponent,
    AutoInputResizeDirective,
    PagesPreviewComponent,
    SymbolComponent,
    PreprocessingComponent,
    LoaderIconComponent,
    SelectionBoxComponent,
    BookViewComponent,
    BooksPreviewComponent,
    PageUploaderComponent,
    BookListViewComponent,
    EditorComponent,
    TextRegionComponent,
    TextLineComponent,
    PolylineComponent,
    PolylineEditorComponent,
    NonScalingPointComponent,
    NonScalingComponent,
    LayoutEditorComponent,
    RegionTypeContextMenuComponent,
    NotePropertyWidgetComponent,
    TextEditorComponent,
    TextEditorOverlayComponent,
    SyllableEditorComponent,
    SyllableEditorOverlayComponent,
    DebugActionStatisticsComponent,
    PagePreviewComponent,
    StaffSplitterComponent,
    AddNewDialogComponent,
    ErrorMessageComponent,
    ConfirmDeleteBookDialogComponent,
    DetectStaffLinesDialogComponent,
    DetectSymbolsDialogComponent,
    TrainSymbolsDialogComponent,
    ServerStateComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    DropzoneModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true }  // Debuggung only
    ),
    ContextMenuModule.forRoot(),
    ModalDialogModule.forRoot(),
  ],
  entryComponents: [
    AddNewDialogComponent,
    ConfirmDeleteBookDialogComponent,
    DetectStaffLinesDialogComponent,
    DetectSymbolsDialogComponent,
    TrainSymbolsDialogComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }

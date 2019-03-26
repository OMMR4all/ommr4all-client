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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
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
import { TextLineComponent } from './editor/sheet-overlay/elements/text-line/text-line.component';
import { PolylineComponent } from './editor/sheet-overlay/elements/polyline/polyline.component';
import { PolylineEditorComponent } from './editor/sheet-overlay/editors/polyline-editor/polyline-editor.component';
import { NonScalingPointComponent } from './editor/sheet-overlay/elements/non-scaling-point/non-scaling-point.component';
import { NonScalingComponent } from './editor/sheet-overlay/elements/non-scaling-component/non-scaling.component';
import { LayoutEditorComponent } from './editor/sheet-overlay/editor-tools/layout-editor/layout-editor.component';
import { RegionTypeContextMenuComponent } from './editor/sheet-overlay/context-menus/region-type-context-menu/region-type-context-menu.component';
import { NotePropertyWidgetComponent } from './editor/property-widgets/note-property-widget/note-property-widget.component';
import { TextEditorComponent } from './editor/sheet-overlay/editor-tools/text-editor/text-editor.component';
import { TextEditorOverlayComponent } from './editor/sheet-overlay/editor-tools/text-editor/text-editor-overlay/text-editor-overlay.component';
import { SyllableEditorComponent } from './editor/sheet-overlay/editor-tools/syllable-editor/syllable-editor.component';
import { SyllableEditorOverlayComponent } from './editor/sheet-overlay/editor-tools/syllable-editor/syllable-editor-overlay/syllable-editor-overlay.component';
import { DebugActionStatisticsComponent } from './editor/debug/debug-action-statistics/debug-action-statistics.component';
import { PagePreviewComponent } from './page-preview/page-preview.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { StaffSplitterComponent } from './editor/sheet-overlay/editor-tools/staff-splitter/staff-splitter.component';
import {AddNewDialogComponent} from './book-list-view/dialogs/add-new-dialog/add-new-dialog.component';
import { ErrorMessageComponent } from './common/error-message/error-message.component';
import { ConfirmDeleteBookDialogComponent } from './book-list-view/dialogs/confirm-delete-book-dialog/confirm-delete-book-dialog.component';
import { DetectStaffLinesDialogComponent } from './editor/dialogs/detect-stafflines-dialog/detect-stafflines-dialog.component';
import { DetectSymbolsDialogComponent } from './editor/dialogs/detect-symbols-dialog/detect-symbols-dialog.component';
import { TrainSymbolsDialogComponent } from './editor/dialogs/train-symbols-dialog/train-symbols-dialog.component';
import { ServerStateComponent } from './server-state/server-state.component';
import {JwtInterceptor} from './authentication/jwt-interceptor';
import { LoginComponent } from './authentication/login/login.component';
import { LogoutComponent } from './authentication/logout/logout.component';
import {ErrorInterceptor} from './authentication/error-inceptor';
import { SecuredImageComponent } from './common/secured-image/secured-image.component';
import { SecuredSvgImageComponent } from './common/secured-svg-image/secured-svg-image.component';
import {SafePipeModule} from 'safe-pipe';
import { ConfirmCleanAllPagesDialogComponent } from './book-view/books-preview/confirm-clean-all-pages-dialog/confirm-clean-all-pages-dialog.component';
import {
  MatBadgeModule,
  MatButtonModule, MatCardModule, MatDialogModule,
  MatDividerModule,
  MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressBarModule,
  MatSelectModule,
  MatSlideToggleModule, MatTableModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { LayoutAnalysisDialogComponent } from './editor/dialogs/layout-analysis-dialog/layout-analysis-dialog.component';
import { LayoutExtractConnectedComponentsComponent } from './editor/sheet-overlay/editor-tools/layout-extract-connected-components/layout-extract-connected-components.component';
import { LayoutPropertyWidgetComponent } from './editor/property-widgets/layout-property-widget/layout-property-widget.component';
import { LayoutLassoAreaComponent } from './editor/sheet-overlay/editor-tools/layout-lasso-area/layout-lasso-area.component';
import { PageViewComponent } from './editor/sheet-overlay/views/page-view/page-view.component';
import { BlockViewComponent } from './editor/sheet-overlay/views/block-view/block-view.component';
import { LineViewComponent } from './editor/sheet-overlay/views/line-view/line-view.component';
import { BackgroundImageViewComponent } from './editor/sheet-overlay/views/background-image-view/background-image-view.component';
import { StaffLinesViewComponent } from './editor/sheet-overlay/views/staff-lines-view/staff-lines-view.component';
import { SymbolsViewComponent } from './editor/sheet-overlay/views/symbols-view/symbols-view.component';
import { AnnotationsViewComponent } from './editor/sheet-overlay/views/annotations-view/annotations-view.component';
import { ViewComponent } from './editor/sheet-overlay/editor-tools/view/view.component';
import { ViewPropertyWidgetComponent } from './editor/property-widgets/view-property-widget/view-property-widget.component';
import { SyllablePropertyWidgetComponent } from './editor/property-widgets/syllable-property-widget/syllable-property-widget.component';
import { FullLyricsViewComponent } from './editor/property-widgets/syllable-property-widget/full-lyrics-view/full-lyrics-view.component';
import { FullLyricsViewLineComponent } from './editor/property-widgets/syllable-property-widget/full-lyrics-view/full-lyrics-view-line/full-lyrics-view-line.component';
import { ReadingOrderViewComponent } from './editor/sheet-overlay/views/reading-order-view/reading-order-view.component';
import { ReadingOrderPropertyWidgetComponent } from './editor/property-widgets/reading-order-property-widget/reading-order-property-widget.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { ReadingOrderViewOverlayComponent } from './editor/sheet-overlay/views/reading-order-view/reading-order-view-overlay/reading-order-view-overlay.component';
import { ReadingOrderContextMenuComponent } from './editor/sheet-overlay/context-menus/reading-order-context-menu/reading-order-context-menu.component';
import { HoverMenuComponent } from './common/hover-menu/hover-menu.component';
import { EditBookInfoDialogComponent } from './book-view/books-preview/edit-book-info-dialog/edit-book-info-dialog.component';
import { ConfirmDeletePageDialogComponent } from './book-view/books-preview/confirm-delete-page-dialog/confirm-delete-page-dialog.component';
import { StaffLinePropertyWidgetComponent } from './editor/property-widgets/staff-line-property-widget/staff-line-property-widget.component';
import { SymbolContextMenuComponent } from './editor/sheet-overlay/context-menus/symbol-context-menu/symbol-context-menu.component';
import { RenamePageDialogComponent } from './book-view/books-preview/rename-page-dialog/rename-page-dialog.component';
import { CommentPropertyWidgetComponent } from './editor/property-widgets/comment-property-widget/comment-property-widget.component';
import { CommentsViewComponent } from './editor/sheet-overlay/views/comments-view/comments-view.component';
import { DeveloperPropertyWidgetComponent } from './editor/property-widgets/developer-property-widget/developer-property-widget.component';
import { ExportPagesDialogComponent } from './book-view/books-preview/export-pages-dialog/export-pages-dialog.component';
import { ImprintComponent } from './imprint/imprint.component';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { HomeComponent } from './home/home.component';
import {VirtualKeyboardComponent} from './common/virtual-keyboard/virtual-keyboard.component';
import { BookCommentsViewComponent } from './book-comments-view/book-comments-view.component';

registerLocaleData(localeDe, 'de');

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'book', component: BookListViewComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'book/:book_id/comments', component: BookCommentsViewComponent },
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
    LoginComponent,
    LogoutComponent,
    SecuredImageComponent,
    SecuredSvgImageComponent,
    ConfirmCleanAllPagesDialogComponent,
    LayoutAnalysisDialogComponent,
    LayoutExtractConnectedComponentsComponent,
    LayoutPropertyWidgetComponent,
    LayoutLassoAreaComponent,
    PageViewComponent,
    BlockViewComponent,
    LineViewComponent,
    BackgroundImageViewComponent,
    StaffLinesViewComponent,
    SymbolsViewComponent,
    AnnotationsViewComponent,
    ViewComponent,
    ViewPropertyWidgetComponent,
    SyllablePropertyWidgetComponent,
    FullLyricsViewComponent,
    FullLyricsViewLineComponent,
    ReadingOrderViewComponent,
    ReadingOrderPropertyWidgetComponent,
    ReadingOrderViewOverlayComponent,
    ReadingOrderContextMenuComponent,
    HoverMenuComponent,
    EditBookInfoDialogComponent,
    ConfirmDeletePageDialogComponent,
    StaffLinePropertyWidgetComponent,
    SymbolContextMenuComponent,
    RenamePageDialogComponent,
    CommentPropertyWidgetComponent,
    CommentsViewComponent,
    DeveloperPropertyWidgetComponent,
    ExportPagesDialogComponent,
    ImprintComponent,
    VirtualKeyboardComponent,
    HomeComponent,
    BookCommentsViewComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    DropzoneModule,
    SafePipeModule,
    DragDropModule,
    MatTooltipModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    MatTableModule,
    MatBadgeModule,
    MatCardModule,
    MatProgressBarModule,
    RouterModule.forRoot(
      appRoutes,
      {enableTracing: true}  // Debugging only
    ),
    MatListModule,
  ],
  entryComponents: [
    AddNewDialogComponent,
    ConfirmDeleteBookDialogComponent,
    ConfirmCleanAllPagesDialogComponent,
    ConfirmDeletePageDialogComponent,
    EditBookInfoDialogComponent,
    DetectStaffLinesDialogComponent,
    DetectSymbolsDialogComponent,
    TrainSymbolsDialogComponent,
    LayoutAnalysisDialogComponent,
    RenamePageDialogComponent,
    ExportPagesDialogComponent,
  ],
  bootstrap: [AppComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
})
export class AppModule { }

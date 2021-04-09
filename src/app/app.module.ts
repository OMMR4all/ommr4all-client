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
import { ConfirmDeleteBookDialogComponent } from './book-view/book-settings-view/confirm-delete-book-dialog/confirm-delete-book-dialog.component';
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
  MatButtonModule, MatCardModule, MatCheckboxModule, MatDialogModule,
  MatDividerModule,
  MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatPaginatorModule, MatProgressBarModule, MatRadioModule,
  MatSelectModule, MatSidenavModule,
  MatSlideToggleModule, MatStepperModule, MatTableModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
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
import { ConfirmDeletePageDialogComponent } from './book-view/books-preview/confirm-delete-page-dialog/confirm-delete-page-dialog.component';
import { StaffLinePropertyWidgetComponent } from './editor/property-widgets/staff-line-property-widget/staff-line-property-widget.component';
import { SymbolContextMenuComponent } from './editor/sheet-overlay/context-menus/symbol-context-menu/symbol-context-menu.component';
import { RenamePageDialogComponent } from './book-view/books-preview/rename-page-dialog/rename-page-dialog.component';
import { CommentPropertyWidgetComponent } from './editor/property-widgets/comment-property-widget/comment-property-widget.component';
import { CommentsViewComponent } from './editor/sheet-overlay/views/comments-view/comments-view.component';
import { DeveloperPropertyWidgetComponent } from './editor/property-widgets/developer-property-widget/developer-property-widget.component';
import { ExportPagesDialogComponent } from './book-view/books-preview/export-pages-dialog/export-pages-dialog.component';
import { ImprintComponent } from './imprint/imprint.component';
import {APP_BASE_HREF, CommonModule, PlatformLocation, registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { HomeComponent } from './home/home.component';
import {VirtualKeyboardComponent} from './common/virtual-keyboard/virtual-keyboard.component';
import { BookCommentsViewComponent } from './book-view/book-comments-view/book-comments-view.component';
import { RenameAllPagesDialogComponent } from './book-view/books-preview/rename-all-pages-dialog/rename-all-pages-dialog.component';
import {LyricsPasteToolDialogComponent} from './editor/dialogs/lyrics-paste-tool-dialog/lyrics-paste-tool-dialog.component';
import { OverrideEditLockDialogComponent } from './editor/dialogs/override-edit-lock-dialog/override-edit-lock-dialog.component';
import { BookSecurityViewComponent } from './book-view/book-security-view/book-security-view.component';
import { BookTrainViewComponent } from './book-view/book-train-view/book-train-view.component';
import {BookSettingsViewComponent} from './book-view/book-settings-view/book-settings-view.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import { BookStepPageSelectorComponent } from './book-view/book-step/book-step-page-selector/book-step-page-selector.component';
import {BookStepTaskControlComponent} from './book-view/book-step/book-step-task-control/book-step-task-control.component';
import {environment} from '../environments/environment';
import { ModelForBookSelectionComponent } from './common/algorithm-steps/model-for-book-selection/model-for-book-selection.component';
import { BookStepWorkflowComponent } from './book-view/book-step/book-step-workflow/book-step-workflow.component';
import { BookTrainOverviewComponent } from './book-view/book-train-overview/book-train-overview.component';
import { ConfirmDialogComponent } from './common/confirm-dialog/confirm-dialog.component';
import { AdministrativeViewComponent } from './administrative-view/administrative-view.component';
import { AdministrativeViewDefaultModelsComponent } from './administrative-view/administrative-view-default-models/administrative-view-default-models.component';
import { ModelForStyleSelectComponent } from './common/algorithm-steps/model-for-style-select/model-for-style-select.component';
import { ApiErrorCardComponent } from './common/api-error-card/api-error-card.component';
import { BookStepViewComponent } from './book-view/book-step/book-step-view/book-step-view.component';
import { AlgorithmTypeForGroupSelectionComponent } from './common/algorithm-steps/algorithm-type-for-group-selection/algorithm-type-for-group-selection.component';
import { PredictDialogComponent } from './editor/dialogs/predict-dialog/predict-dialog.component';
import { AlgorithmPredictorSettingsComponent } from './common/algorithm-steps/algorithm-predictor-settings/algorithm-predictor-settings.component';
import { AdministrativeViewTasksComponent } from './administrative-view/administrative-view-tasks/administrative-view-tasks.component';
import { ImportBookDialogComponent } from './book-list-view/dialogs/import-book-dialog/import-book-dialog.component';
import { AdministrativeViewNotationStyleComponent } from './administrative-view/administrative-view-notation-style/administrative-view-notation-style.component';
import { NotationStyleViewComponent } from './administrative-view/administrative-view-notation-style/notation-style-view/notation-style-view.component';
import { AddNotationStyleViewComponent } from './administrative-view/administrative-view-notation-style/add-notation-style-view/add-notation-style-view.component';
import { BookStatsDialogComponent } from './book-view/book-settings-view/book-stats-dialog/book-stats-dialog.component';
import { HotkeyViewerComponent } from './editor/shortcut-overlay/hotkey-help-viewer/hotkey-viewer/hotkey-viewer.component';
import { SplitAnnotationViewerComponent } from './split-annotation-viewer/split-annotation-viewer.component';
import { OneClickWorkflowComponent } from './book-view/book-step/one-click-workflow/one-click-workflow.component';
import { BookStepTasksControlComponent } from './book-view/book-step/book-step-tasks-control/book-step-tasks-control.component';
import { BookStepTaskProgressComponent } from './book-view/book-step/book-step-task-progress/book-step-task-progress.component';
import { RenderViewComponent } from './editor/sheet-overlay/views/render-view/render-view.component';
import { WorkflowFinishDialogComponent } from './editor/dialogs/workflow-finish-dialog/workflow-finish-dialog.component';

registerLocaleData(localeDe, 'de');

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'administration/view/:view/:sub1',  component: AdministrativeViewComponent },
  { path: 'administration/view/:view',  component: AdministrativeViewComponent },
  { path: 'administration/view', redirectTo: 'administration/view/default_models' },
  { path: 'administration', redirectTo: 'administration/view/default_models' },
  { path: 'book', component: BookListViewComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'book/:book_id/page/:page_id/edit', component: EditorComponent },
  { path: 'book/:book_id/view/:view', component: BookViewComponent },
  { path: 'book/:book_id/view', redirectTo: 'book/:book_id/view/content', pathMatch: 'full' },
  { path: 'book/:book_id', redirectTo: 'book/:book_id/view/content', pathMatch: 'full' },
  { path: 'book/:book_id/page/:page_id/view', component: SplitAnnotationViewerComponent },
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
    ServerStateComponent,
    LoginComponent,
    LogoutComponent,
    SecuredImageComponent,
    SecuredSvgImageComponent,
    ConfirmCleanAllPagesDialogComponent,
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
    RenameAllPagesDialogComponent,
    LyricsPasteToolDialogComponent,
    OverrideEditLockDialogComponent,
    BookSecurityViewComponent,
    BookTrainViewComponent,
    BookSettingsViewComponent,
    BookStepPageSelectorComponent,
    BookStepTaskControlComponent,
    ModelForBookSelectionComponent,
    BookStepWorkflowComponent,
    BookTrainOverviewComponent,
    ConfirmDialogComponent,
    AdministrativeViewComponent,
    AdministrativeViewDefaultModelsComponent,
    ModelForStyleSelectComponent,
    ApiErrorCardComponent,
    BookStepViewComponent,
    AlgorithmTypeForGroupSelectionComponent,
    PredictDialogComponent,
    AlgorithmPredictorSettingsComponent,
    AdministrativeViewTasksComponent,
    ImportBookDialogComponent,
    AdministrativeViewNotationStyleComponent,
    NotationStyleViewComponent,
    AddNotationStyleViewComponent,
    BookStatsDialogComponent,
    HotkeyViewerComponent,
    SplitAnnotationViewerComponent,
    OneClickWorkflowComponent,
    BookStepTasksControlComponent,
    BookStepTaskProgressComponent,
    RenderViewComponent,
    WorkflowFinishDialogComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    FlexLayoutModule,
    HttpClientModule,
    ReactiveFormsModule,
    DropzoneModule,
    SafePipeModule,
    DragDropModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    MatSidenavModule,
    MatTableModule,
    MatBadgeModule,
    MatCardModule,
    MatProgressBarModule,
    MatStepperModule,
    MatPaginatorModule,
    RouterModule.forRoot(
      appRoutes,
      {enableTracing: !environment.production}
    ),
    MatListModule,
  ],
  entryComponents: [
    AddNewDialogComponent,
    BookStatsDialogComponent,
    ConfirmDeleteBookDialogComponent,
    ConfirmCleanAllPagesDialogComponent,
    ConfirmDeletePageDialogComponent,
    ImportBookDialogComponent,
    RenamePageDialogComponent,
    RenameAllPagesDialogComponent,
    ExportPagesDialogComponent,
    LyricsPasteToolDialogComponent,
    OverrideEditLockDialogComponent,
    ConfirmDialogComponent,
    PredictDialogComponent,
    HotkeyViewerComponent,
    WorkflowFinishDialogComponent,

  ],
  bootstrap: [AppComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
})
export class AppModule { }

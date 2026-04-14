import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PatternStyleConfig } from './pattern-style-config/pattern-style-config.component';

interface MusicLineAABB {
  id: string;
  minY: number;
  maxY: number;
}

interface StripData {
  pageId: string;
  lineNum: number;  // 1-based display number
  bitmap: ImageBitmap;
  boxes: { box: any; match: any }[];
  styles: PatternStyleConfig;
  yTop: number;    // height-normalised, includes padding, clamped to [0,1]
  yBottom: number;
  scale: number;
  imgW: number;
  imgH: number;
  renderHeight: number;
}

@Injectable({ providedIn: 'root' })
export class PatternPdfExportService {

  private readonly LABEL_WIDTH  = 120;   // px — left identifier column
  private readonly LABEL_GAP    = 8;     // px — gap between label column and image
  private readonly STRIP_WIDTH  = 900;   // px — rendered width of each image strip
  private readonly STRIP_GAP    = 12;    // px — vertical gap between strips in HTML
  private readonly LINE_PADDING = 0.012; // height-normalised: padding above/below each line
  private readonly PAGE_MARGIN  = 16;    // px — outer margin in print window

  constructor(private http: HttpClient) {}

  async exportToPdf(results: any[], searchedPatterns: any[]): Promise<void> {
    return this.exportResultsToPdf(results, searchedPatterns);
  }

  async exportPageToPdf(result: any, searchedPatterns: any[]): Promise<void> {
    return this.exportResultsToPdf([result], searchedPatterns);
  }

  private async exportResultsToPdf(results: any[], searchedPatterns: any[]): Promise<void> {
    const strips: StripData[] = [];

    for (const result of results) {
      const allBoxes: { box: any; match: any }[] = [];
      for (const match of (result.matches || [])) {
        for (const box of (match.boxes || [])) {
          allBoxes.push({ box, match });
        }
      }
      if (allBoxes.length === 0) continue;

      const imageUrl: string = result.pageCom.image_url('color', 'highres_preproc');
      let bitmap: ImageBitmap;
      try {
        const blob = await firstValueFrom(this.http.get(imageUrl, { responseType: 'blob' }));
        bitmap = await createImageBitmap(blob);
      } catch {
        continue;
      }

      const imgW   = bitmap.width;
      const imgH   = bitmap.height;
      const scale  = this.STRIP_WIDTH / imgW;
      const styles = result.styles as PatternStyleConfig;

      let musicLines = await this.fetchMusicLines(result.pageCom);

      let lineGroups: { lineNum: number; yTop: number; yBottom: number; boxes: { box: any; match: any }[] }[];

      if (musicLines.length > 0) {
        lineGroups = this.groupByMusicLines(allBoxes, musicLines);
      } else {
        lineGroups = this.clusterFallback(allBoxes);
      }

      for (const group of lineGroups) {
        if (group.boxes.length === 0) continue;
        const renderHeight = Math.round((group.yBottom - group.yTop) * imgH * scale);
        if (renderHeight <= 0) continue;
        strips.push({
          pageId: result.page_id,
          lineNum: group.lineNum,
          bitmap, boxes: group.boxes, styles,
          yTop: group.yTop, yBottom: group.yBottom,
          scale, imgW, imgH, renderHeight,
        });
      }
    }

    if (strips.length === 0) return;

    const canvases: HTMLCanvasElement[] = [];

    const overview = this.renderPatternOverview(results, searchedPatterns);
    if (overview) canvases.push(overview);

    canvases.push(...strips.map(s => this.renderStrip(s)));
    this.openPrintWindow(canvases);
  }

  private async fetchMusicLines(pageCom: any): Promise<MusicLineAABB[]> {
    try {
      const url: string = pageCom.content_url('pcgts');
      const json = await firstValueFrom(this.http.get<any>(url));
      const lines: MusicLineAABB[] = [];

      for (const block of (json?.page?.blocks ?? [])) {
        if (block.type !== 'music') continue;
        for (const line of (block.lines ?? [])) {
          if (!line.coords || line.coords.trim().length === 0) continue;

          const ys = line.coords.trim().split(/\s+/).map((pt: string) => {
            const [, y] = pt.split(',').map(Number);
            return y;
          }).filter((v: number) => isFinite(v));

          if (ys.length === 0) continue;
          lines.push({ id: line.id, minY: Math.min(...ys), maxY: Math.max(...ys) });
        }
      }

      lines.sort((a, b) => a.minY - b.minY);
      return lines;
    } catch {
      return [];
    }
  }

  private groupByMusicLines(
    boxes: { box: any; match: any }[],
    musicLines: MusicLineAABB[],
  ): { lineNum: number; yTop: number; yBottom: number; boxes: { box: any; match: any }[] }[] {

    const lineMap = new Map<string, { lineNum: number; yTop: number; yBottom: number; boxes: { box: any; match: any }[] }>();
    musicLines.forEach((ml, idx) => {
      lineMap.set(ml.id, {
        lineNum: idx + 1,
        yTop:    Math.max(0, ml.minY - this.LINE_PADDING),
        yBottom: Math.min(1, ml.maxY + this.LINE_PADDING),
        boxes:   [],
      });
    });

    for (const item of boxes) {
      const cy = item.box.y + item.box.h / 2; // box vertical centre
      let target = musicLines.find(ml => cy >= ml.minY && cy <= ml.maxY);
      if (!target) {
        target = musicLines.reduce((best, ml) => {
          const dbest = Math.abs((best.minY + best.maxY) / 2 - cy);
          const dml   = Math.abs((ml.minY  + ml.maxY)  / 2 - cy);
          return dml < dbest ? ml : best;
        });
      }
      lineMap.get(target.id).boxes.push(item);
    }

    return Array.from(lineMap.values()).filter(g => g.boxes.length > 0);
  }

  private clusterFallback(
    boxes: { box: any; match: any }[],
  ): { lineNum: number; yTop: number; yBottom: number; boxes: { box: any; match: any }[] }[] {
    if (boxes.length === 0) return [];
    const sorted = [...boxes].sort((a, b) => a.box.y - b.box.y);

    const sortedH   = sorted.map(b => b.box.h).sort((a, b) => a - b);
    const medianH   = sortedH[Math.floor(sortedH.length / 2)];
    const threshold = Math.max(medianH * 0.8, 0.005);

    const clusters: { box: any; match: any }[][] = [];
    let current = [sorted[0]];
    let bottom  = sorted[0].box.y + sorted[0].box.h;

    for (let i = 1; i < sorted.length; i++) {
      const item = sorted[i];
      if (item.box.y - bottom > threshold) {
        clusters.push(current);
        current = [item];
        bottom  = item.box.y + item.box.h;
      } else {
        current.push(item);
        bottom = Math.max(bottom, item.box.y + item.box.h);
      }
    }
    clusters.push(current);

    return clusters.map((c, idx) => ({
      lineNum: idx + 1,
      yTop:    Math.max(0, Math.min(...c.map(b => b.box.y))           - this.LINE_PADDING),
      yBottom: Math.min(1, Math.max(...c.map(b => b.box.y + b.box.h)) + this.LINE_PADDING),
      boxes:   c,
    }));
  }

  private renderStrip(strip: StripData): HTMLCanvasElement {
    const { bitmap, boxes, styles, yTop, yBottom, scale, imgW, imgH, renderHeight } = strip;

    const canvasW = this.LABEL_WIDTH + this.LABEL_GAP + this.STRIP_WIDTH;
    const imgX    = this.LABEL_WIDTH + this.LABEL_GAP;

    const canvas   = document.createElement('canvas');
    canvas.width   = canvasW;
    canvas.height  = renderHeight;
    const ctx      = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, renderHeight);

    this.drawLabel(ctx, 0, renderHeight, strip.pageId, strip.lineNum);

    ctx.drawImage(
      bitmap,
      0,    yTop * imgH,
      imgW, (yBottom - yTop) * imgH,
      imgX, 0,
      this.STRIP_WIDTH, renderHeight
    );

    for (const { box, match } of boxes) {
      const bx = imgX + box.x         * imgH * scale;
      const by = (box.y - yTop)       * imgH * scale;
      const bw = box.w                * imgH * scale;
      const bh = box.h                * imgH * scale;

      if (styles?.backgroundColor && styles.backgroundColor !== 'transparent') {
        ctx.globalAlpha = styles.bgOpacity ?? 0.35;
        ctx.fillStyle   = styles.backgroundColor;
        ctx.fillRect(bx, by, bw, bh);
      }

      ctx.globalAlpha = styles?.borderOpacity ?? 1.0;
      ctx.strokeStyle = styles?.borderColor   || '#000000';
      ctx.lineWidth   = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.globalAlpha = 1;

      const badgeSize = Math.max(14, Math.min(22, bw * 0.3));
      const badgeX    = bx + bw - badgeSize;
      const badgeY    = Math.max(0, by - badgeSize);

      this.drawBadge(ctx, badgeX, badgeY, badgeSize, match.patternIndex + 1, styles);
    }

    return canvas;
  }


  private drawBadge(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number,
    label: number,
    styles: PatternStyleConfig,
  ) {
    const bgColor = styles?.labelBgColor;
    if (bgColor && bgColor !== 'transparent') {
      ctx.globalAlpha = styles.labelBgOpacity ?? 1.0;
      ctx.fillStyle   = bgColor;
      ctx.fillRect(x, y, size, size);
    }

    const borderColor = styles?.labelBorderColor;
    if (borderColor && borderColor !== 'transparent') {
      ctx.globalAlpha = styles.labelBorderOpacity ?? 1.0;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth   = 1;
      ctx.strokeRect(x, y, size, size);
    }

    ctx.globalAlpha  = styles?.labelTextOpacity ?? 1.0;
    ctx.fillStyle    = styles?.labelTextColor   || '#ffffff';
    ctx.font         = `bold ${Math.round(size * 0.62)}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(label), x + size / 2, y + size / 2);
    ctx.globalAlpha  = 1;
  }

  private drawLabel(
    ctx: CanvasRenderingContext2D,
    x: number, height: number,
    pageId: string, lineNum: number,
  ) {
    const w = this.LABEL_WIDTH;

    ctx.save();
    ctx.fillStyle   = '#f0f0f0';
    ctx.fillRect(x, 0, w, height);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth   = 1;
    ctx.strokeRect(x, 0, w, height);

    ctx.beginPath();
    ctx.rect(x + 2, 2, w - 4, height - 4);
    ctx.clip();

    const cx       = x + w / 2;
    const maxWidth = w - 8;

    ctx.fillStyle    = '#222222';
    ctx.font         = 'bold 12px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(pageId, cx, 7, maxWidth);

    ctx.fillStyle = '#555555';
    ctx.font      = '11px sans-serif';
    ctx.fillText(`Line ${lineNum}`, cx, 24, maxWidth);

    ctx.restore();
  }

  // ── Pattern overview table ────────────────────────────────────────────────

  // Renders a summary canvas (same pixel width as the strips) listing every
  // unique pattern with a sparkline, its interval notation, and its total
  // occurrence count across all result pages.
  private renderPatternOverview(results: any[], searchedPatterns: any[]): HTMLCanvasElement | null {
    // Aggregate: patternIndex → totalCount
    const agg = new Map<number, number>();
    for (const result of results) {
      for (const match of (result.matches || [])) {
        const idx = match.patternIndex as number;
        agg.set(idx, (agg.get(idx) ?? 0) + ((match.count as number) || 0));
      }
    }
    if (agg.size === 0) return null;

    const rows = Array.from(agg.entries())
      .sort(([a], [b]) => a - b)
      .map(([idx, totalCount]) => ({ idx, sp: searchedPatterns[idx], totalCount }))
      .filter(r => r.sp != null);

    // Canvas width matches strip canvases for a consistent layout
    const CANVAS_W = this.LABEL_WIDTH + this.LABEL_GAP + this.STRIP_WIDTH;
    const MARGIN   = 16;
    const TITLE_H  = 44;
    const HEADER_H = 26;
    const ROW_H    = 68;
    const CANVAS_H = MARGIN + TITLE_H + HEADER_H + rows.length * ROW_H + MARGIN;

    // Column positions
    const COL_BADGE_X = MARGIN;
    const COL_BADGE_W = 44;
    const COL_VIS_X   = COL_BADGE_X + COL_BADGE_W + 14;
    const COL_VIS_W   = 200;
    const COL_INT_X   = COL_VIS_X + COL_VIS_W + 16;
    const COL_COUNT_W = 70;
    const COL_COUNT_X = CANVAS_W - MARGIN - COL_COUNT_W;
    const COL_INT_W   = COL_COUNT_X - COL_INT_X - 12;

    const canvas  = document.createElement('canvas');
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx     = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    ctx.fillStyle    = '#111111';
    ctx.font         = 'bold 17px sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pattern Overview', MARGIN, MARGIN + TITLE_H / 2);

    // Header row
    let curY = MARGIN + TITLE_H;
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(MARGIN, curY, CANVAS_W - MARGIN * 2, HEADER_H);

    ctx.fillStyle    = '#555555';
    ctx.font         = 'bold 11px sans-serif';
    ctx.textBaseline = 'middle';
    const hMid = curY + HEADER_H / 2;
    ctx.textAlign = 'center';
    ctx.fillText('#',         COL_BADGE_X + COL_BADGE_W / 2, hMid);
    ctx.textAlign = 'left';
    ctx.fillText('Pattern',   COL_VIS_X,  hMid);
    ctx.fillText('Intervals', COL_INT_X,  hMid);
    ctx.textAlign = 'right';
    ctx.fillText('Count',     COL_COUNT_X + COL_COUNT_W, hMid);
    curY += HEADER_H;

    // Pattern rows
    for (const row of rows) {
      const color  = row.sp.color as string;
      const rowMid = curY + ROW_H / 2;

      // Alternating tint
      if (row.idx % 2 === 1) {
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(MARGIN, curY, CANVAS_W - MARGIN * 2, ROW_H);
      }

      // Circular badge
      const badgeR  = 14;
      const badgeCX = COL_BADGE_X + COL_BADGE_W / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(badgeCX, rowMid, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.round(badgeR * 1.1)}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(row.idx + 1), badgeCX, rowMid);

      // Sparkline — uses pitchConns so connections are rendered correctly
      this.drawPatternSparkline(
        ctx, COL_VIS_X, curY + 6, COL_VIS_W, ROW_H - 12, row.sp.pitchConns, color,
      );

      // Interval text from pre-computed label  e.g.  "+1l  +2  -1"
      ctx.fillStyle    = '#222222';
      ctx.font         = '13px monospace';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.sp.label as string, COL_INT_X, rowMid, COL_INT_W);

      // Total count (large, coloured)
      ctx.fillStyle = color;
      ctx.font      = 'bold 18px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(row.totalCount), COL_COUNT_X + COL_COUNT_W, rowMid);

      // Row separator
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, curY + ROW_H);
      ctx.lineTo(CANVAS_W - MARGIN, curY + ROW_H);
      ctx.stroke();

      curY += ROW_H;
    }

    // Table border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth   = 1;
    ctx.strokeRect(MARGIN, MARGIN + TITLE_H, CANVAS_W - MARGIN * 2, HEADER_H + rows.length * ROW_H);

    return canvas;
  }

  // Draws a sparkline for a pattern.
  // pitchConns: Array<[interval, conn]> where conn===1 means graphically connected (l).
  // Connected segments are drawn as solid coloured lines; disconnected as light dashed lines.
  private drawPatternSparkline(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    pitchConns: Array<[number, number | null]>, color: string,
  ) {
    if (pitchConns.length === 0) return;

    const pitches: number[] = [0];
    for (const [iv] of pitchConns) { pitches.push(pitches[pitches.length - 1] + iv); }

    const n    = pitches.length;
    const minP = Math.min(...pitches);
    const maxP = Math.max(...pitches);
    const span = Math.max(maxP - minP, 1);

    const DOT_R   = 4;
    const PAD_X   = DOT_R + 2;
    const PAD_Y   = DOT_R + 2;
    // Cap step width at 28 px so long patterns don't overflow
    const usableW = Math.min(w - PAD_X * 2, (n - 1) * 28);
    const stepX   = n > 1 ? usableW / (n - 1) : 0;

    const nx = (i: number) => x + PAD_X + i * stepX;
    const ny = (p: number) => y + PAD_Y + (1 - (p - minP) / span) * (h - PAD_Y * 2);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineJoin  = 'round';

    // Draw segments individually so connected/disconnected can differ
    for (let i = 0; i < pitchConns.length; i++) {
      const connected = pitchConns[i][1] === 1;
      ctx.beginPath();
      ctx.moveTo(nx(i), ny(pitches[i]));
      ctx.lineTo(nx(i + 1), ny(pitches[i + 1]));
      if (connected) {
        ctx.strokeStyle = color;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = '#cccccc';
        ctx.setLineDash([3, 3]);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Dots with white ring so they stand out on top of lines
    pitches.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(nx(i), ny(p), DOT_R, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
    ctx.restore();
  }

  private getPatternColor(pattern: number[]): string {
    if (!pattern || pattern.length === 0) return '#f44336';
    const s = pattern.join(',');
    const palette = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
    let hash = 0;
    for (let i = 0; i < s.length; i++) { hash = s.charCodeAt(i) + ((hash << 5) - hash); }
    return palette[Math.abs(hash) % palette.length];
  }

  private openPrintWindow(canvases: HTMLCanvasElement[]): void {
    const win = window.open('', '_blank');
    if (!win) {
      alert('Pop-up blocked — please allow pop-ups to use the PDF export.');
      return;
    }

    const stripDivs = canvases
      .map(c => `<div class="strip"><img src="${c.toDataURL('image/png')}" alt=""></div>`)
      .join('\n');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pattern Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; padding: ${this.PAGE_MARGIN}px; font-family: sans-serif; }
    .toolbar { margin-bottom: ${this.STRIP_GAP}px; font-size: 14px; color: #444; }
    .toolbar button { margin-left: 12px; padding: 4px 12px; cursor: pointer; }
    .strip {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: ${this.STRIP_GAP}px;
    }
    .strip img { display: block; max-width: 100%; height: auto; border: 1px solid #e0e0e0; }
    @media print {
      body     { padding: 0; }
      .toolbar { display: none; }
      .strip   { margin-bottom: 4px; }
      .strip img { border: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    Pattern Export
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
${stripDivs}
  <script>setTimeout(() => window.print(), 350);</script>
</body>
</html>`);
    win.document.close();
  }
}

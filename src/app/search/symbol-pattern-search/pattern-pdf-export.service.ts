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

  async exportToPdf(results: any[]): Promise<void> {
    return this.exportResultsToPdf(results);
  }

  async exportPageToPdf(result: any): Promise<void> {
    return this.exportResultsToPdf([result]);
  }

  private async exportResultsToPdf(results: any[]): Promise<void> {
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

    const canvases = strips.map(s => this.renderStrip(s));
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

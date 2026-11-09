"use client";

import * as React from "react";
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Box,
  Eye,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Split,
  Palette,
  DoorOpen,
  DoorClosed,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";

export interface PartDefinition {
  id: string;
  name: string;
  nameFa: string;
  material: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  barcode: string;
  status: "CUT" | "EDGED" | "CNC_DONE" | "ASSEMBLED" | "PENDING";
  // مختصات پایه در حالت مونتاژ (سانتیمتر نمایشی)
  pos: [number, number, number]; // [x, y, z]
  // بردار حرکت در حالت انفجاری
  explodeDir: [number, number, number];
  size: [number, number, number]; // [width, height, depth]
}

const DEFAULT_PARTS: PartDefinition[] = [
  {
    id: "part-1",
    name: "Left Side Panel",
    nameFa: "دیواره جانبی سمت چپ",
    material: "MDF ۱۶ میل فرامید کتان",
    lengthMm: 720,
    widthMm: 560,
    thicknessMm: 16,
    barcode: "CUT-CAB-001",
    status: "CNC_DONE",
    pos: [-38, 0, 0],
    explodeDir: [-60, 0, 0],
    size: [2.5, 68, 54],
  },
  {
    id: "part-2",
    name: "Right Side Panel",
    nameFa: "دیواره جانبی سمت راست",
    material: "MDF ۱۶ میل فرامید کتان",
    lengthMm: 720,
    widthMm: 560,
    thicknessMm: 16,
    barcode: "CUT-CAB-002",
    status: "CNC_DONE",
    pos: [38, 0, 0],
    explodeDir: [60, 0, 0],
    size: [2.5, 68, 54],
  },
  {
    id: "part-3",
    name: "Bottom Base Panel",
    nameFa: "کفی و زیره اصلی یونیت",
    material: "MDF ۱۶ میل فرامید کتان",
    lengthMm: 768,
    widthMm: 560,
    thicknessMm: 16,
    barcode: "CUT-CAB-003",
    status: "EDGED",
    pos: [0, -33, 0],
    explodeDir: [0, -45, 0],
    size: [74, 2.5, 54],
  },
  {
    id: "part-4",
    name: "Top Stretcher Rails",
    nameFa: "قیدهای فوقانی مهار صفحه (طاق)",
    material: "MDF ۱۶ میل دوبل شده",
    lengthMm: 768,
    widthMm: 100,
    thicknessMm: 16,
    barcode: "CUT-CAB-004",
    status: "CUT",
    pos: [0, 33, 0],
    explodeDir: [0, 45, 0],
    size: [74, 2.5, 54],
  },
  {
    id: "part-5",
    name: "Back Panel",
    nameFa: "فیبر ۸ میل شیاردار پشت‌بند",
    material: "MDF شیاردار واناچای ضدرطوبت",
    lengthMm: 768,
    widthMm: 704,
    thicknessMm: 8,
    barcode: "CUT-CAB-005",
    status: "CNC_DONE",
    pos: [0, 0, -26],
    explodeDir: [0, 0, -55],
    size: [74, 66, 1.2],
  },
  {
    id: "part-6",
    name: "Adjustable Shelf",
    nameFa: "طبقه متحرک میانی با پیم الیت",
    material: "MDF ۱۶ میل فرامید",
    lengthMm: 764,
    widthMm: 530,
    thicknessMm: 16,
    barcode: "CUT-CAB-006",
    status: "EDGED",
    pos: [0, 2, 0],
    explodeDir: [0, 10, 25],
    size: [73, 2.2, 51],
  },
  {
    id: "part-7",
    name: "Left Cabinet Door",
    nameFa: "درب هایگلاس سمت چپ با لولا بلوم",
    material: "AGT هایگلاس سوپرمات کد ۷۳۰",
    lengthMm: 716,
    widthMm: 396,
    thicknessMm: 18,
    barcode: "CUT-CAB-007",
    status: "ASSEMBLED",
    pos: [-19.5, 0, 28],
    explodeDir: [-30, 0, 65],
    size: [38, 67.5, 2.5],
  },
  {
    id: "part-8",
    name: "Right Cabinet Door",
    nameFa: "درب هایگلاس سمت راست با لولا بلوم",
    material: "AGT هایگلاس سوپرمات کد ۷۳۰",
    lengthMm: 716,
    widthMm: 396,
    thicknessMm: 18,
    barcode: "CUT-CAB-008",
    status: "ASSEMBLED",
    pos: [19.5, 0, 28],
    explodeDir: [30, 0, 65],
    size: [38, 67.5, 2.5],
  },
  {
    id: "part-9",
    name: "Corian Countertop Slab",
    nameFa: "صفحه سنگ یکپارچه کورین ال‌جی",
    material: "سنگ مهندسی کورین ۱۲ میل با لبه دوبل",
    lengthMm: 850,
    widthMm: 620,
    thicknessMm: 50,
    barcode: "CUT-CAB-009",
    status: "ASSEMBLED",
    pos: [0, 37, 2],
    explodeDir: [0, 60, 0],
    size: [82, 5, 60],
  },
];

const FINISHES = [
  { id: "white-gloss", name: "هایگلاس سفید سوپرمات AGT", bodyColor: "#f1f5f9", doorColor: "#ffffff", border: "#cbd5e1" },
  { id: "walnut-wood", name: "روکش طبیعی چوب گردو والیس", bodyColor: "#573a27", doorColor: "#784b2c", border: "#3d2618" },
  { id: "faramid-grey", name: "ام‌دی‌اف کتان طوسی فرامید", bodyColor: "#334155", doorColor: "#475569", border: "#1e293b" },
  { id: "dark-gold", name: "مشکی ذغالی متالیک با نوار برنز", bodyColor: "#18181b", doorColor: "#27272a", border: "#d97706" },
];

interface Cabinet3DExplodedViewerProps {
  projectTitle?: string;
  orderCode?: string;
  parts?: PartDefinition[];
}

export function Cabinet3DExplodedViewer({
  projectTitle = "کابینت مدرن آشپزخانه اصلی (ویلای لواسان)",
  orderCode = "ORD-CAB-001",
  parts = DEFAULT_PARTS,
}: Cabinet3DExplodedViewerProps) {
  const [explodeFactor, setExplodeFactor] = React.useState<number>(0); // 0 to 1
  const [doorsOpen, setDoorsOpen] = React.useState<boolean>(false);
  const [activeFinish, setActiveFinish] = React.useState<string>("white-gloss");
  const [wireframe, setWireframe] = React.useState<boolean>(false);
  const [selectedPart, setSelectedPart] = React.useState<PartDefinition | null>(null);

  // زاویه‌های دوران سه‌بعدی
  const [rotX, setRotX] = React.useState<number>(-18);
  const [rotY, setRotY] = React.useState<number>(32);
  const [zoom, setZoom] = React.useState<number>(1);
  const isDragging = React.useRef(false);
  const lastMousePos = React.useRef({ x: 0, y: 0 });

  const currentFinish = FINISHES.find((f) => f.id === activeFinish) || FINISHES[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setRotY((prev) => prev + dx * 0.6);
    setRotX((prev) => Math.max(-65, Math.min(65, prev - dy * 0.6)));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePos.current.x;
    const dy = e.touches[0].clientY - lastMousePos.current.y;
    setRotY((prev) => prev + dx * 0.8);
    setRotX((prev) => Math.max(-65, Math.min(65, prev - dy * 0.8)));
    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const resetView = () => {
    setRotX(-18);
    setRotY(32);
    setZoom(1);
    setExplodeFactor(0);
    setDoorsOpen(false);
    setSelectedPart(null);
  };

  return (
    <div className="relative flex flex-col rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 shadow-lg overflow-hidden select-none font-sans">
      {/* ───────────────────────── هدر کنترل پنل سه‌بعدی ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/40 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Box className="size-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-sm font-black text-foreground truncate max-w-sm">{projectTitle}</h3>
              <Badge variant="outline" className="font-mono text-[10px] bg-background shrink-0">
                {orderCode}
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px] gap-1 font-bold shrink-0">
                <Sparkles className="size-3" />
                <span>دوقلوی دیجیتال سه‌بعدی</span>
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              نمای تعاملی ۳۶۰ درجه + اسلایدر تفکیک و انفجار قطعات ساخت (Exploded View)
            </p>
          </div>
        </div>

        {/* دکمه‌های اقدام سریع */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDoorsOpen((v) => !v)}
            className="h-8 text-xs gap-1.5 font-bold"
          >
            {doorsOpen ? <DoorClosed className="size-3.5 text-amber-600" /> : <DoorOpen className="size-3.5 text-primary" />}
            {doorsOpen ? "بستن درب‌ها" : "باز کردن درب‌ها"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWireframe((v) => !v)}
            className={cn("h-8 text-xs gap-1.5 font-bold", wireframe && "bg-primary/10 text-primary border-primary/40")}
          >
            <Layers className="size-3.5" />
            {wireframe ? "نمای توپر" : "نمای اسکلتی X-Ray"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={resetView}
            className="size-8 rounded-xl"
            title="بازنشانی زاویه دید"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ───────────────────────── صحنه رندر سه‌بعدی (3D Stage) ───────────────────────── */}
      <div
        className="relative h-[480px] sm:h-[540px] w-full overflow-hidden bg-radial from-slate-900/10 via-background to-muted/40 cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{ perspective: "1100px" }}
      >
        {/* پس‌زمینه شبکه استودیویی (Studio Grid) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* سایه زمینی یونیت */}
        <div
          className="absolute rounded-full bg-black/25 blur-xl transition-all duration-300 pointer-events-none"
          style={{
            width: `${240 * zoom * (1 + explodeFactor * 0.4)}px`,
            height: `${80 * zoom * (1 + explodeFactor * 0.4)}px`,
            bottom: "85px",
            transform: `scale(${1 - Math.abs(rotX) * 0.005})`,
          }}
        />

        {/* ظرف سه‌بعدی یونیت (3D Transform Space) */}
        <div
          className="relative transition-transform duration-75"
          style={{
            transformStyle: "preserve-3d",
            transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {parts.map((p) => {
            const isDoorLeft = p.id === "part-7";
            const isDoorRight = p.id === "part-8";
            const isDoor = isDoorLeft || isDoorRight;
            const isCountertop = p.id === "part-9";

            // محاسبه جابه‌جایی بر اساس فاکتور انفجار
            const exX = p.pos[0] + p.explodeDir[0] * explodeFactor * 1.5;
            const exY = p.pos[1] + p.explodeDir[1] * explodeFactor * 1.5;
            const exZ = p.pos[2] + p.explodeDir[2] * explodeFactor * 1.5;

            // زاویه باز شدن درب‌ها
            const doorAngle = doorsOpen ? (isDoorLeft ? -95 : 95) : 0;
            const doorPivot = isDoorLeft ? "-100% 50%" : "100% 50%";

            const isSelected = selectedPart?.id === p.id;

            // رنگ و جنس متریال
            const baseBg = isCountertop
              ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)"
              : isDoor
                ? currentFinish.doorColor
                : currentFinish.bodyColor;

            return (
              <div
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(isSelected ? null : p);
                }}
                className={cn(
                  "absolute transition-all duration-300 cursor-pointer group",
                  wireframe ? "border border-cyan-400 bg-cyan-500/10" : "shadow-md",
                  isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background",
                )}
                style={{
                  width: `${p.size[0] * 3.6}px`,
                  height: `${p.size[1] * 3.6}px`,
                  left: `-${(p.size[0] * 3.6) / 2}px`,
                  top: `-${(p.size[1] * 3.6) / 2}px`,
                  transformOrigin: isDoor ? doorPivot : "center center",
                  transform: `translate3d(${exX * 3.2}px, ${-exY * 3.2}px, ${exZ * 3.2}px) ${
                    isDoor ? `rotateY(${doorAngle}deg)` : ""
                  }`,
                  background: wireframe ? "transparent" : baseBg,
                  border: wireframe
                    ? "1px solid rgba(6, 182, 212, 0.8)"
                    : `1px solid ${currentFinish.border}`,
                  boxShadow: wireframe
                    ? "0 0 10px rgba(6, 182, 212, 0.3)"
                    : "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
                title={`${p.nameFa} (${p.lengthMm} × ${p.widthMm} mm)`}
              >
                {/* های‌لایت براق و شیب سه‌بعدی روی سطح قطعه */}
                {!wireframe && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none" />
                )}

                {/* دستگیره درب کابینت */}
                {isDoor && !wireframe && (
                  <div
                    className={cn(
                      "absolute top-6 size-2.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 shadow-xs border border-amber-800",
                      isDoorLeft ? "right-3" : "left-3",
                    )}
                  />
                )}

                {/* برچسب مشخصات شناور روی قطعه در حالت انفجاری */}
                {explodeFactor > 0.25 && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card/95 border border-border/80 px-2 py-0.5 rounded-md shadow-md text-[9px] font-bold text-foreground whitespace-nowrap pointer-events-none transition-all"
                    style={{
                      transform: `rotateY(${-rotY}deg) rotateX(${-rotX}deg)`,
                    }}
                  >
                    <span>{p.nameFa}</span>
                    <span className="font-mono text-muted-foreground mr-1 text-[8px]">
                      [{p.lengthMm}×{p.widthMm}]
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* راهنمای لمس روی صحنه */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-background/85 px-2.5 py-1 rounded-lg border border-border/60 pointer-events-none">
          <Scan className="size-3 text-primary animate-pulse" />
          <span>چرخش ۳۶۰ درجه با درگ موس یا لمس گوشی</span>
        </div>
      </div>

      {/* ───────────────────────── اسلایدر اصلی نمای انفجاری (Exploded View Control) ───────────────────────── */}
      <div className="p-4 bg-card border-t border-border/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Split className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                اسلایدر نمای انفجاری (Exploded View):
              </span>
              <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                {toFa(Math.round(explodeFactor * 100))}%
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              با کشیدن این اسلایدر، تمام قطعات کابینت در فضای سه‌بعدی باز شده و بارکد و اتصالات نمایان می‌شوند.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <Slider
              value={[explodeFactor * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) => setExplodeFactor(val / 100)}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* ───────────────────────── انتخاب متریال زنده (Live Swatches) ───────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs">
            <Palette className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">تغییر رنگ و روکش زنده:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFinish(f.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all active:scale-95",
                  activeFinish === f.id
                    ? "bg-primary/10 border-primary text-primary shadow-xs font-bold"
                    : "bg-muted/50 border-border/70 text-muted-foreground hover:bg-muted",
                )}
              >
                <span
                  className="size-3.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: f.doorColor }}
                />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ───────────────────────── کارت مشخصات قطعه انتخاب‌شده ───────────────────────── */}
        {selectedPart && (
          <div className="bg-muted/40 border border-primary/30 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs">
                3D
              </div>
              <div>
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  {selectedPart.nameFa}
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {selectedPart.barcode}
                  </Badge>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  جنس: {selectedPart.material} · ابعاد دقیق: {toFa(selectedPart.lengthMm)} × {toFa(selectedPart.widthMm)} × {toFa(selectedPart.thicknessMm)} میلی‌متر
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white font-bold text-[10px] gap-1">
                <CheckCircle2 className="size-3" />
                وضعیت: برش و CNC تاییدشده
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPart(null)}
                className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
              >
                بستن
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

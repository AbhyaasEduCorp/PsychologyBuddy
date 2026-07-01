'use client';
import * as React from 'react';
import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { Lock, ChevronDown, Pen, Eraser, Trash2, Undo, Redo, Square, Circle, Minus, Triangle, Save, Palette } from 'lucide-react';
import { ArtJournal } from '@prisma/client';
import { toast } from 'sonner';

interface DrawingCanvasProps {
  onSave?: (imageDataUrl: string) => void;
  loading?: boolean;
  config?: {
    enableUndo?: boolean;
    enableRedo?: boolean;
    enableClearCanvas?: boolean;
    enableColorPalette?: boolean;
  };
  prompt?: string;
  onNewPrompt?: () => void;
}

export default function DrawingCanvas({ onSave, loading = false, config, prompt, onNewPrompt }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Use config for color palette, default to true
  const colorPaletteEnabled = config?.enableColorPalette !== false;
  const [opacity, setOpacity] = useState(100);
  const [currentColor, setCurrentColor] = useState('#1F4B43');
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  type ShapeType = 'line' | 'rect' | 'circle' | 'triangle';
  type CanvasTool = 'pen' | 'eraser' | ShapeType;
  const [currentTool, setCurrentTool] = useState<CanvasTool>('pen');
  const [fillShape, setFillShape] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [artJournals, setArtJournals] = useState<ArtJournal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Undo/Redo functionality
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const snapshotRef = useRef<ImageData | null>(null);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);

  const colors = [
    '#1F4B43', // Dark Green
    '#6B5B95', // Purple
    '#FEB236', // Orange/Yellow
    '#F0656B', // Pink/Red
    '#5DADE2', // Blue
    '#58D68D', // Green
  ];

  const paletteGrid = {
    Reds: ['#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
    Oranges: ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'],
    Yellows: ['#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17'],
    Greens: ['#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
    Teals: ['#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40'],
    Blues: ['#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
    Purples: ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
    Pinks: ['#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],
    Neutrals: ['#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121', '#000000'],
  };

  // Initialize canvas and fetch art journals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size — use offsetWidth/Height so flex layout is guaranteed resolved
    const width = canvas.offsetWidth || canvas.getBoundingClientRect().width;
    const height = canvas.offsetHeight || canvas.getBoundingClientRect().height;
    canvas.width = Math.max(width, 1);
    canvas.height = Math.max(height, 1);

    // Set initial canvas background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial state to history
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([imageData]);
    setHistoryStep(0);

    // Attach non-passive touch listeners to prevent page scroll while drawing
    const preventScroll = (e: globalThis.TouchEvent) => e.preventDefault();
    canvas.addEventListener('touchstart', preventScroll, { passive: false });
    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    
    // Fetch art journals on component mount
    fetchArtJournals();

    return () => {
      canvas.removeEventListener('touchstart', preventScroll);
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, []);

const fetchArtJournals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/student/journals/art');
      const result = await response.json();
      
      if (result.success) {
        setArtJournals(result.data);
      } else {
        toast.error('Failed to fetch art journals');
      }
    } catch (error) {
      console.error('Error fetching art journals:', error);
      toast.error('Error loading art journals');
    } finally {
      setIsLoading(false);
    }
  };

  const SHAPE_TOOLS: ShapeType[] = ['line', 'rect', 'circle', 'triangle'];
  const isShapeTool = SHAPE_TOOLS.includes(currentTool as ShapeType);

  const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    if (!shapeStartRef.current) return;
    const { x: startX, y: startY } = shapeStartRef.current;
    ctx.globalAlpha = opacity / 100;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.beginPath();
    if (currentTool === 'line') {
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'rect') {
      if (fillShape) {
        ctx.fillRect(startX, startY, x - startX, y - startY);
      } else {
        ctx.strokeRect(startX, startY, x - startX, y - startY);
      }
    } else if (currentTool === 'circle') {
      const radiusX = Math.abs(x - startX) / 2;
      const radiusY = Math.abs(y - startY) / 2;
      const centerX = startX + (x - startX) / 2;
      const centerY = startY + (y - startY) / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      fillShape ? ctx.fill() : ctx.stroke();
    } else if (currentTool === 'triangle') {
      ctx.moveTo(startX + (x - startX) / 2, startY);
      ctx.lineTo(x, y);
      ctx.lineTo(startX, y);
      ctx.closePath();
      fillShape ? ctx.fill() : ctx.stroke();
    }
  };

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x, y;

    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    if (SHAPE_TOOLS.includes(currentTool as ShapeType)) {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      shapeStartRef.current = { x, y };
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    if (SHAPE_TOOLS.includes(currentTool as ShapeType)) {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      drawShape(ctx, x, y);
      return;
    }

    ctx.globalAlpha = opacity / 100;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      saveToHistory();
    }
    snapshotRef.current = null;
    shapeStartRef.current = null;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save state before clearing
    saveToHistory();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Save current canvas state to history
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyStep <= 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep - 1;
    const imageData = history[newStep];
    
    ctx.putImageData(imageData, 0, 0);
    setHistoryStep(newStep);
  };

  // Redo function
  const redo = () => {
    if (historyStep >= history.length - 1) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep + 1;
    const imageData = history[newStep];
    
    ctx.putImageData(imageData, 0, 0);
    setHistoryStep(newStep);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;

    const imageDataUrl = canvas.toDataURL('image/png');
    onSave(imageDataUrl);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-50 via-white to-blue-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#67CCFF] to-[#1B9EE0] rounded-2xl flex items-center justify-center shadow-md shadow-blue-200/60 text-lg sm:text-xl flex-shrink-0">
            🎨
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-xl leading-tight">Today's Entry</h3>
            <p className="text-[11px] sm:text-sm text-gray-400 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {onNewPrompt && (
            <button
              onClick={onNewPrompt}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-50 text-purple-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-purple-100 transition-all"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Prompt</span>
            </button>
          )}
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 bg-white border border-gray-100 px-2.5 py-1.5 rounded-full shadow-sm">
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">Private</span>
          </span>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#67CCFF] to-[#1B9EE0] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving…' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Prompt Display */}
      {prompt && (
        <div className="px-4 sm:px-6 py-3 bg-purple-50 border-b border-purple-100">
          <div className="flex items-start gap-2">
            <Palette className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-800 font-medium">{prompt}</p>
          </div>
        </div>
      )}

      {/* ── Top Toolbar ── */}
      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-2 px-3 sm:px-5 py-2.5 bg-gray-50/70 border-b border-gray-100">

        {/* Color swatches */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {colors.map((color, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentColor(color)}
              title={color}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all hover:scale-110 ${currentColor === color ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : 'ring-1 ring-white shadow-sm'}`}
              style={{ backgroundColor: color }}
            />
          ))}
          {colorPaletteEnabled && (
            <button
              onClick={() => { setShowColorPicker(!showColorPicker); setShowShapePicker(false); }}
              title="Full palette"
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-sm ${showColorPicker ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : ''}`}
              style={{ backgroundColor: currentColor }}
            >
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Brush sizes */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[3, 6, 10, 15, 22].map((size, idx) => {
            const sizes = [4, 8, 12, 16, 20];
            const real = sizes[idx];
            return (
              <button
                key={real}
                onClick={() => setBrushSize(real)}
                title={`${real}px`}
                className={`rounded-full transition-all hover:scale-110 flex-shrink-0 ${brushSize === real ? 'ring-2 ring-offset-1 ring-[#1B9EE0]' : ''}`}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: brushSize === real ? '#1B9EE0' : '#9CA3AF',
                }}
              />
            );
          })}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Opacity */}
        <div className="flex items-center gap-2 flex-1 min-w-[110px] max-w-[200px]">
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">Opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full cursor-pointer accent-[#1B9EE0]"
          />
          <span className="text-[10px] sm:text-xs text-gray-500 font-semibold w-7 text-right">{opacity}%</span>
        </div>
      </div>

      {/* ── Main Area: Left tool sidebar + Canvas ── */}
      <div className="flex">

        {/* Left Tool Sidebar */}
        <div className="w-12 sm:w-14 flex flex-col items-center gap-1 py-3 border-r border-gray-100 bg-white flex-shrink-0">

          {/* Undo / Redo */}
          {config?.enableUndo !== false && (
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              title="Undo"
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed ${historyStep <= 0 ? 'text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <Undo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
          {config?.enableRedo !== false && (
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              title="Redo"
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed ${historyStep >= history.length - 1 ? 'text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <Redo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          <div className="w-6 h-px bg-gray-100 my-1" />

          {/* Pen */}
          <button
            onClick={() => { setCurrentTool('pen'); setShowShapePicker(false); }}
            title="Pen"
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${currentTool === 'pen' ? 'bg-gradient-to-br from-[#67CCFF] to-[#1B9EE0] text-white shadow-md shadow-blue-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          >
            <Pen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Eraser */}
          <button
            onClick={() => { setCurrentTool('eraser'); setShowShapePicker(false); }}
            title="Eraser"
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${currentTool === 'eraser' ? 'bg-gradient-to-br from-[#67CCFF] to-[#1B9EE0] text-white shadow-md shadow-blue-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          >
            <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="w-6 h-px bg-gray-100 my-1" />

          {/* Shapes toggle */}
          <button
            onClick={() => { setShowShapePicker(!showShapePicker); setShowColorPicker(false); }}
            title="Shapes"
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${isShapeTool ? 'bg-gradient-to-br from-[#67CCFF] to-[#1B9EE0] text-white shadow-md shadow-blue-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          >
            {currentTool === 'line' ? <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
             currentTool === 'circle' ? <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
             currentTool === 'triangle' ? <Triangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
             <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Spacer pushes clear to bottom */}
          <div className="flex-1" />

          {/* Clear */}
          {config?.enableClearCanvas !== false && (
            <button
              onClick={clearCanvas}
              title="Clear canvas"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        {/* Canvas wrapper */}
        <div className="relative flex-1 min-w-0">

          {/* Color Picker Dropdown */}
          {showColorPicker && colorPaletteEnabled && (
            <div className="absolute top-2 left-2 z-20 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-4 w-[256px] sm:w-[296px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Color Palette</span>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm leading-none transition-colors"
                >×</button>
              </div>
              <div className="space-y-1.5 mb-3">
                {Object.entries(paletteGrid).map(([category, shades]) => (
                  <div key={category} className="flex items-center gap-1.5">
                    <span className="text-[8px] text-gray-300 w-9 text-right flex-shrink-0">{category}</span>
                    <div className="flex gap-0.5 sm:gap-1 flex-1">
                      {shades.map((shade, i) => (
                        <button
                          key={i}
                          onClick={() => { setCurrentColor(shade); setShowColorPicker(false); }}
                          className={`flex-1 h-4 sm:h-5 rounded-[3px] hover:scale-110 transition-transform ${currentColor === shade ? 'ring-1 ring-gray-600 ring-offset-1' : ''}`}
                          style={{ backgroundColor: shade }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <div className="w-5 h-5 rounded-lg border border-gray-200 shadow-inner flex-shrink-0" style={{ backgroundColor: currentColor }} />
                <span className="text-xs font-mono text-gray-500 flex-1">{currentColor}</span>
                <span className="text-[10px] text-gray-300">selected</span>
              </div>
            </div>
          )}

          {/* Shape Picker Dropdown */}
          {showShapePicker && (
            <div className="absolute top-2 left-2 z-20 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-[176px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shapes</span>
                <button
                  onClick={() => setShowShapePicker(false)}
                  className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm leading-none transition-colors"
                >×</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                {([
                  { type: 'line' as ShapeType, icon: <Minus className="w-4 h-4" />, label: 'Line' },
                  { type: 'rect' as ShapeType, icon: <Square className="w-4 h-4" />, label: 'Rect' },
                  { type: 'circle' as ShapeType, icon: <Circle className="w-4 h-4" />, label: 'Circle' },
                  { type: 'triangle' as ShapeType, icon: <Triangle className="w-4 h-4" />, label: 'Triangle' },
                ] as { type: ShapeType; icon: React.ReactNode; label: string }[]).map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => { setCurrentTool(type); setShowShapePicker(false); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-all ${
                      currentTool === type
                        ? 'bg-gradient-to-br from-[#67CCFF] to-[#1B9EE0] text-white shadow-md'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-500 font-semibold">Fill</span>
                <button
                  onClick={() => setFillShape(!fillShape)}
                  className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${fillShape ? 'bg-[#1B9EE0]' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${fillShape ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-[360px] sm:h-[460px] lg:h-[520px] bg-white cursor-crosshair block"
            style={{ touchAction: 'none', userSelect: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2 border-t border-gray-100 bg-gray-50/60 text-[10px] sm:text-xs text-gray-400 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: currentColor }} />
          <span className="font-mono">{currentColor}</span>
        </div>
        <span className="text-gray-200">·</span>
        <span className="capitalize font-semibold text-gray-500">{currentTool}</span>
        <span className="text-gray-200">·</span>
        <span>{brushSize}px</span>
        <span className="text-gray-200">·</span>
        <span>{opacity}% opacity</span>
        {isShapeTool && (
          <>
            <span className="text-gray-200">·</span>
            <span className="text-[#1B9EE0] font-semibold">{fillShape ? 'Filled' : 'Outline'}</span>
          </>
        )}
        <div className="flex-1" />
        <span className="text-gray-300 hidden sm:inline">{historyStep} / {Math.max(history.length - 1, 0)} steps</span>
      </div>

    </div>
  );
}


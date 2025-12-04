import React, { useState, useCallback, useEffect } from 'react';
import { SubjectImage, AppSettings, LAYOUTS, SIZES, HAT_TYPES } from './types';
import { ImageUploader } from './components/ImageUploader';
import { ProcessingQueue } from './components/ProcessingQueue';
import { CanvasPreview } from './components/CanvasPreview';
import { generatePattern, processSubjectImage } from './services/geminiService';
import { Gift, Sparkles, Download, Settings as SettingsIcon, RefreshCw, Wand2, Grid, Shuffle, ChevronDown } from 'lucide-react';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  // State
  const [subjects, setSubjects] = useState<SubjectImage[]>([]);
  const [patternUrl, setPatternUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    paperSize: '24x36',
    density: 'medium',
    layout: 'scatter',
    patternPrompt: 'Elegant golden snowflakes and holly berries'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPattern, setIsGeneratingPattern] = useState(false);

  // Handlers
  const handleUpload = (files: FileList) => {
    const newSubjects: SubjectImage[] = Array.from(files).map(file => ({
      id: generateId(),
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      status: 'pending',
      options: {
        addHat: true,
        hatType: 'Santa Hat',
        removeBackground: true
      }
    }));
    setSubjects(prev => [...prev, ...newSubjects]);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateOptions = (id: string, options: Partial<SubjectImage['options']>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, options: { ...s.options, ...options }, status: 'pending' } : s));
  };

  const generateNewPattern = async () => {
    if (!settings.patternPrompt) return;
    setIsGeneratingPattern(true);
    try {
      const url = await generatePattern(settings.patternPrompt);
      setPatternUrl(url);
    } catch (e) {
      alert("Failed to generate pattern. Try a different prompt.");
    } finally {
      setIsGeneratingPattern(false);
    }
  };

  const processPendingSubjects = async () => {
    const pending = subjects.filter(s => s.status === 'pending');
    if (pending.length === 0) return;

    setIsProcessing(true);
    
    // Process one by one to avoid rate limits if any, or strict sequential
    // For demo, parallel is okay but let's be safe with state updates
    const updatedSubjects = [...subjects];

    for (const subject of pending) {
        // Update to processing
        setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, status: 'processing' } : s));
        
        try {
            const processedUrl = await processSubjectImage(subject.originalUrl, subject.options);
            setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, status: 'completed', processedUrl } : s));
        } catch (e) {
            console.error(e);
            setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, status: 'failed' } : s));
        }
    }
    setIsProcessing(false);
  };

  // Initial pattern generation
  useEffect(() => {
    if (!patternUrl && !isGeneratingPattern) {
        // Delay slightly to allow render
        const timer = setTimeout(() => generateNewPattern(), 1000);
        return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900">
      
      {/* Sidebar Controls */}
      <div className="w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-20">
        <div className="p-6 border-b border-slate-100 bg-holired text-white">
          <div className="flex items-center space-x-2 mb-1">
            <Gift size={24} className="text-holigold" />
            <h1 className="font-holiday font-bold text-2xl">Holiday Wrap</h1>
          </div>
          <p className="text-red-100 text-sm">Custom AI Composer</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Upload */}
          <section>
             <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
               <span className="bg-holigreen text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
               Upload Photos
             </h2>
             <ImageUploader onUpload={handleUpload} disabled={isProcessing} />
          </section>

          {/* Section 2: Subjects Queue */}
          <section>
            <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-holigreen text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Customize Subjects
                </h2>
                {subjects.some(s => s.status === 'pending') && (
                    <button 
                        onClick={processPendingSubjects}
                        disabled={isProcessing}
                        className="text-xs bg-holigreen text-white px-3 py-1 rounded-full hover:bg-green-800 disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                        {isProcessing ? <RefreshCw className="animate-spin" size={12}/> : <Wand2 size={12}/>}
                        {isProcessing ? 'Processing...' : 'Apply Magic'}
                    </button>
                )}
            </div>
            <ProcessingQueue 
                subjects={subjects} 
                onRemove={handleRemoveSubject}
                onUpdateOptions={handleUpdateOptions}
            />
          </section>

          {/* Section 3: Pattern & Layout */}
          <section className="space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
               <span className="bg-holigreen text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
               Design Paper
             </h2>
            
            {/* Pattern Generator */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-holigreen"></div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center justify-between">
                    Background Prompt
                    <Sparkles size={12} className="text-holigold" />
                </label>
                <div className="flex gap-2 relative">
                    <textarea 
                        value={settings.patternPrompt}
                        onChange={(e) => setSettings(s => ({...s, patternPrompt: e.target.value}))}
                        className="w-full text-sm border-slate-300 rounded-lg focus:ring-holired focus:border-holired shadow-sm min-h-[80px] p-3 pr-12 resize-none leading-relaxed bg-white text-slate-900"
                        placeholder="Describe your holiday pattern..."
                    />
                    <button 
                        onClick={generateNewPattern}
                        disabled={isGeneratingPattern}
                        className="absolute bottom-2 right-2 bg-slate-100 hover:bg-holigreen hover:text-white p-2 rounded-md text-slate-600 transition-all disabled:opacity-50 shadow-sm"
                        title="Generate Pattern"
                    >
                        {isGeneratingPattern ? <RefreshCw className="animate-spin" size={16}/> : <Wand2 size={16}/>}
                    </button>
                </div>
            </div>

            {/* Layout Controls */}
            <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Density</label>
                    <div className="relative">
                        <select 
                            value={settings.density}
                            onChange={(e) => setSettings(s => ({...s, density: e.target.value as any}))}
                            className="appearance-none w-full text-sm border-slate-300 rounded-lg py-2.5 pl-3 pr-10 focus:ring-holired focus:border-holired bg-white text-slate-900 shadow-sm cursor-pointer"
                        >
                            <option value="sparse">Sparse</option>
                            <option value="medium">Medium</option>
                            <option value="dense">Dense</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Paper Size</label>
                    <div className="relative">
                        <select 
                            value={settings.paperSize}
                            onChange={(e) => setSettings(s => ({...s, paperSize: e.target.value as any}))}
                            className="appearance-none w-full text-sm border-slate-300 rounded-lg py-2.5 pl-3 pr-10 focus:ring-holired focus:border-holired bg-white text-slate-900 shadow-sm cursor-pointer"
                        >
                            {SIZES.map(sz => <option key={sz.id} value={sz.id}>{sz.label}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
            </div>

            {/* Layout Type */}
            <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Arrangement</label>
                 <div className="grid grid-cols-3 gap-2">
                    {LAYOUTS.map(l => (
                        <button
                            key={l.id}
                            onClick={() => setSettings(s => ({...s, layout: l.id as any}))}
                            className={`
                                flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all
                                ${settings.layout === l.id 
                                    ? 'bg-red-50 border-holired text-holired font-medium ring-1 ring-holired' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                            `}
                        >
                            {l.id === 'scatter' && <Shuffle size={16} className="mb-1"/>}
                            {l.id === 'grid' && <Grid size={16} className="mb-1"/>}
                            {l.id === 'diagonal' && <Wand2 size={16} className="mb-1 rotate-45"/>}
                            {l.label}
                        </button>
                    ))}
                 </div>
            </div>

          </section>
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
            <button 
                className="w-full bg-holired text-white py-3 rounded-lg font-bold shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                onClick={() => alert("Download started! In a real app, this would download the full resolution Canvas/PDF.")}
            >
                <Download size={20} />
                Download Print File
            </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <main className="flex-1 h-full relative">
        <CanvasPreview 
            subjects={subjects} 
            patternUrl={patternUrl}
            settings={settings}
        />
      </main>

    </div>
  );
};

export default App;
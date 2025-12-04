import React from 'react';
import { SubjectImage, HAT_TYPES } from '../types';
import { Trash2, Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

interface ProcessingQueueProps {
  subjects: SubjectImage[];
  onRemove: (id: string) => void;
  onUpdateOptions: (id: string, options: Partial<SubjectImage['options']>) => void;
}

export const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ subjects, onRemove, onUpdateOptions }) => {
  if (subjects.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-holiday font-bold text-2xl text-slate-800">Your Stickers</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative overflow-hidden">
            
            {/* Status Indicator */}
            <div className="absolute top-2 right-2">
              {subject.status === 'processing' && <Loader2 className="animate-spin text-holigold" size={20} />}
              {subject.status === 'completed' && <CheckCircle className="text-holigreen" size={20} />}
              {subject.status === 'failed' && <AlertCircle className="text-red-500" size={20} />}
            </div>

            <div className="flex gap-4">
              {/* Image Preview */}
              <div className="w-24 h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <img 
                  src={subject.processedUrl || subject.originalUrl} 
                  alt="Subject" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Controls */}
              <div className="flex-1 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={subject.options.addHat}
                    onChange={(e) => onUpdateOptions(subject.id, { addHat: e.target.checked })}
                    className="rounded text-holired focus:ring-holired"
                  />
                  <span className="text-sm font-medium text-slate-700">Add Holiday Hat</span>
                </label>

                {subject.options.addHat && (
                  <div className="relative">
                      <select 
                        value={subject.options.hatType}
                        onChange={(e) => onUpdateOptions(subject.id, { hatType: e.target.value })}
                        className="appearance-none w-full text-sm border-slate-300 rounded-lg py-2 pl-3 pr-10 focus:ring-holired focus:border-holired bg-white cursor-pointer shadow-sm"
                      >
                        {HAT_TYPES.map(hat => (
                          <option key={hat} value={hat}>{hat}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                )}
                
                <div className="text-xs text-slate-400">
                  {subject.status === 'completed' 
                    ? 'Ready for wrapping!' 
                    : subject.status === 'processing' 
                      ? 'Magic working...' 
                      : 'Waiting to process'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
               <button 
                onClick={() => onRemove(subject.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
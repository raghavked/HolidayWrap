import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (files: FileList) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center group
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:border-holired hover:bg-red-50'}
        ${isDragging ? 'border-holired bg-red-50 scale-[1.02]' : 'border-slate-300 bg-white'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && onUpload(e.target.files)}
        multiple
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className={`
          p-3 rounded-full transition-colors
          ${isDragging ? 'bg-holired text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-holired group-hover:text-white'}
        `}>
          {isDragging ? <ImageIcon size={32} /> : <Upload size={32} />}
        </div>
        <div>
          <p className="font-semibold text-slate-700 text-lg">
            {isDragging ? 'Drop images now' : 'Click or Drag Photos Here'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Supports JPG, PNG. We'll remove the background for you.
          </p>
        </div>
      </div>
    </div>
  );
};

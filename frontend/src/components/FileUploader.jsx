import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FileUploader({ files, onChange, multiple = true, accept = '.pdf,.jpg,.jpeg,.png,.webp' }) {
  const { t } = useTranslation();
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList);
    onChange(multiple ? [...(files || []), ...arr] : arr);
  };

  const removeAt = (idx) => {
    const next = [...files];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-bg-light' : 'border-border hover:border-primary/50'
        }`}
      >
        <UploadCloud className="h-8 w-8 text-primary/60" />
        <p className="text-sm text-slate-500">
          PDF, JPG, JPEG, PNG, WEBP — {t('application.file')}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {files && files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, idx) => (
            <li key={idx} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <FileIcon className="h-4 w-4 text-primary shrink-0" />
              <span className="flex-1 truncate">{f.name}</span>
              <button type="button" onClick={() => removeAt(idx)} className="text-slate-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

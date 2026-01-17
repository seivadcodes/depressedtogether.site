// src/components/TextInput.tsx
'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Paperclip, Send, Smile } from 'lucide-react';
import Picker from 'emoji-picker-react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onFileUpload?: (file: File) => void;
  onEmojiSelect?: (emoji: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextInput({
  value,
  onChange,
  onSubmit,
  onFileUpload,
  onEmojiSelect,
  disabled = false,
  placeholder = "Type a message...",
}: TextInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    onChange(value + emojiData.emoji);
    setShowEmojiPicker(false);
    if (onEmojiSelect) onEmojiSelect(emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-2 md:p-3">
      {/* Emoji Picker - Desktop only */}
      {showEmojiPicker && (
        <div className="absolute bottom-14 left-2 z-50 w-[300px]">
          <Picker
            onEmojiClick={handleEmojiClick}
            searchDisabled
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            style={{ width: '100%' }}
          />
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        {/* Emoji - Desktop only */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          aria-label="Emoji"
        >
          <Smile size={18} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* File Upload - Desktop only */}
        <label
          htmlFor="file-upload"
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
          <input
            id="file-upload"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="hidden"
            disabled={disabled}
          />
        </label>

        {/* Send Button - All screens */}
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            value.trim() && !disabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
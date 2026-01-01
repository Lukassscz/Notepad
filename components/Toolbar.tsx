import React from 'react';
import { Bold, Heading1, Heading2 } from 'lucide-react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { AllowedColor } from '../types';
import { COLORS } from '../constants';

const Toolbar: React.FC = () => {
  const editor = useSlate();

  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor) as Record<string, any>;
    return marks ? marks[format as keyof typeof marks] === true : false;
  };

  const isBlockActive = (format: string) => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === format,
      })
    );

    return !!match;
  };

  const toggleBold = () => {
    const isActive = isMarkActive('bold');
    if (isActive) {
      Editor.removeMark(editor, 'bold');
    } else {
      Editor.addMark(editor, 'bold', true);
    }
  };

  const toggleBlock = (format: string) => {
    const isActive = isBlockActive(format);
    const newProperties: Partial<SlateElement> = {
      type: isActive ? 'paragraph' : (format as any),
    };
    
    Transforms.setNodes(editor, newProperties);
  };

  const toggleColor = (color: AllowedColor) => {
    Editor.addMark(editor, 'color', color);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1A1A1A] p-2 rounded-full shadow-2xl border border-[#333] z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Bold Toggle */}
      <button
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBold();
        }}
        className={`p-2 rounded-full transition-colors ${
          isMarkActive('bold') ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={18} strokeWidth={3} />
      </button>

      {/* Heading 1 Toggle */}
      <button
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock('heading-one');
        }}
        className={`p-2 rounded-full transition-colors ${
          isBlockActive('heading-one') ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Heading 1"
      >
        <Heading1 size={18} strokeWidth={3} />
      </button>

       {/* Heading 2 Toggle */}
      <button
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock('heading-two');
        }}
        className={`p-2 rounded-full transition-colors ${
          isBlockActive('heading-two') ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Heading 2"
      >
        <Heading2 size={18} strokeWidth={3} />
      </button>

      <div className="w-px h-6 bg-[#333] mx-1" />

      {/* Color Palette */}
      <div className="flex gap-1">
        {COLORS.map((color) => (
          <button
            key={color}
            onMouseDown={(event) => {
              event.preventDefault();
              toggleColor(color);
            }}
            className="w-6 h-6 rounded-full border border-transparent hover:scale-110 transition-transform focus:ring-2 ring-white/50"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
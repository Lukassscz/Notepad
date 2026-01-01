import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { createEditor, Descendant, Node, Text, Editor, Transforms, Range, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderLeafProps, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { evaluate } from 'mathjs';
import isUrl from 'is-url';
import Toolbar from './Toolbar';
import { MATH_REGEX } from '../constants';
import { AllowedColor, MathDecoration, CustomText, CustomElement } from '../types';

interface NotepadProps {
  initialContent: Descendant[];
  initialHistory: any;
  onChange: (content: Descendant[], history: any) => void;
  readOnly?: boolean;
}

const Notepad: React.FC<NotepadProps> = ({ initialContent, initialHistory, onChange, readOnly }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  // Hydrate history if available
  useEffect(() => {
      if (initialHistory && initialHistory.undos) {
          editor.history = initialHistory;
      }
  }, [editor, initialHistory]);

  // Element Renderer (Headings & Paragraphs)
  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case 'heading-one':
        return <h1 {...props.attributes} className="text-3xl font-extrabold mb-4 mt-6 text-white leading-tight">{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes} className="text-2xl font-bold mb-3 mt-5 text-white leading-tight">{props.children}</h2>;
      default:
        return <p {...props.attributes} className="mb-1 leading-relaxed">{props.children}</p>;
    }
  }, []);

  // Leaf Renderer (Colors, Bold, Math)
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children, attributes, leaf } = props;
    const customLeaf = leaf as CustomText;

    // Apply Styles
    // Using font-black (900 weight) for maximum visibility on black background
    if (customLeaf.bold) {
      children = <span className="font-black">{children}</span>;
    }

    if (customLeaf.color) {
      children = <span style={{ color: customLeaf.color }}>{children}</span>;
    }

    // Link Rendering (Visual only)
    if (typeof leaf.text === 'string' && isUrl(leaf.text)) {
        children = (
            <a 
                href={leaf.text} 
                onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) return; 
                    e.preventDefault();
                    window.open(leaf.text, '_blank');
                }}
                className="underline underline-offset-4 decoration-1 decoration-gray-500 hover:decoration-white cursor-pointer"
                style={{ color: 'inherit' }}
            >
                {children}
            </a>
        );
    }
    
    // Math Result Rendering (Phantom)
    // @ts-ignore
    if (customLeaf.mathResult) {
        return (
            <span {...attributes} className="relative">
                {children}
                <span 
                    contentEditable={false} 
                    className="absolute left-full top-0 text-white/40 pointer-events-none select-none ml-1 font-mono text-base"
                    style={{ fontWeight: 400 }}
                >
                    {/* @ts-ignore */}
                    {customLeaf.mathResult}
                </span>
            </span>
        )
    }

    return <span {...attributes}>{children}</span>;
  }, []);

  // Decorate for Math Automations
  const decorate = useCallback(([node, path]: [Node, number[]]) => {
    const ranges: (MathDecoration & { [key: string]: any })[] = [];

    if (Text.isText(node)) {
      const text = node.text;
      const match = text.match(MATH_REGEX);

      if (match) {
        // match[0] is the full string like "20*10%="
        let expression = match[0].slice(0, -1); // remove '='
        
        // Handle Percentage: Replace '20%' with '(20/100)' for evaluation
        expression = expression.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

        try {
            const result = evaluate(expression);
            if (typeof result === 'number' && !isNaN(result)) {
                // Formatting: Max 2 decimals, but no decimals if integer.
                const formattedResult = parseFloat(result.toFixed(2)).toString();

                const end = match.index! + match[0].length;
                ranges.push({
                    anchor: { path, offset: end - 1 },
                    focus: { path, offset: end },
                    mathResult: formattedResult, 
                });
            }
        } catch (e) {
            // Ignore invalid math
        }
      }
    }

    return ranges;
  }, []);

  // Handle Paste (Plain Text Only)
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    Editor.insertText(editor, text);
  }, [editor]);

  // Key Handler for Shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { selection } = editor;

    // Headings Shortcuts (# Space, ## Space)
    if (event.key === ' ' && selection && Range.isCollapsed(selection)) {
        const { anchor } = selection;
        const block = Editor.above(editor, {
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });
        const path = block ? block[1] : [];
        const start = Editor.start(editor, path);
        const range = { anchor, focus: start };
        const beforeText = Editor.string(editor, range);

        if (beforeText === '#') {
            event.preventDefault();
            Editor.deleteBackward(editor, { unit: 'character' }); // Delete #
            Transforms.setNodes(
                editor,
                { type: 'heading-one' },
                { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            );
            return;
        }

        if (beforeText === '##') {
            event.preventDefault();
            Editor.deleteBackward(editor, { unit: 'word' }); // Delete ##
            Transforms.setNodes(
                editor,
                { type: 'heading-two' },
                { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            );
            return;
        }
    }

    // Reset heading on Backspace if empty
    if (event.key === 'Backspace' && selection && Range.isCollapsed(selection)) {
        const blockEntry = Editor.above(editor, {
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });
        
        if (blockEntry) {
            const [block, path] = blockEntry;
            const isHeading = (block as CustomElement).type.startsWith('heading');
            
            if (isHeading) {
                const start = Editor.start(editor, path);
                // If cursor is at start of heading
                if (Range.isCollapsed(selection) && JSON.stringify(selection.anchor) === JSON.stringify(start)) {
                    event.preventDefault();
                    Transforms.setNodes(
                        editor,
                        { type: 'paragraph' },
                        { at: path }
                    );
                    return;
                }
            }
        }
    }

    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 'b': {
                event.preventDefault();
                const marks = Editor.marks(editor) as Record<string, boolean>;
                if (marks?.bold) {
                    Editor.removeMark(editor, 'bold');
                } else {
                    Editor.addMark(editor, 'bold', true);
                }
                break;
            }
        }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col relative">
      <Slate 
        editor={editor} 
        initialValue={initialContent} 
        onChange={(val) => onChange(val, editor.history)}
      >
        <Editable
          readOnly={readOnly}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          decorate={decorate}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          spellCheck
          autoFocus
          className="flex-1 w-full h-full p-8 md:p-16 text-lg md:text-xl font-sans text-white focus:outline-none placeholder:text-gray-700"
          placeholder="Start typing... Use # for headings"
        />
        {!readOnly && <Toolbar />}
      </Slate>
    </div>
  );
};

export default Notepad;

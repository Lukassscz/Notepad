import { BaseEditor } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

export type AllowedColor = 
  | '#ffffff' 
  | '#E94079' 
  | '#EBB369' 
  | '#DEF169' 
  | '#73DF5C' 
  | '#55A9D2' 
  | '#64D1FB' 
  | '#8E73EF';

export interface SessionData {
  openTimestamp: number;
  closeTimestamp: number | null;
  durationSeconds: number;
  modified: boolean;
}

export interface NoteFileStructure {
  content: any[]; // Slate Descendant[]
  history: any; // Serialized undo stack
  sessions: SessionData[];
  meta: {
    version: number;
    created: number;
  };
}

// Slate Custom Types
export type CustomText = { 
  text: string; 
  bold?: boolean; 
  color?: AllowedColor;
  mathResult?: string;
};

export type CustomElement = 
  | { type: 'paragraph'; children: CustomText[] }
  | { type: 'heading-one'; children: CustomText[] }
  | { type: 'heading-two'; children: CustomText[] };

export interface MathDecoration {
  anchor: { path: number[]; offset: number };
  focus: { path: number[]; offset: number };
  mathResult: string;
}

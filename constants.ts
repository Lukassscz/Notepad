import { AllowedColor } from './types';

export const COLORS: AllowedColor[] = [
  '#ffffff',
  '#E94079',
  '#EBB369',
  '#DEF169',
  '#73DF5C',
  '#55A9D2',
  '#64D1FB',
  '#8E73EF',
];

// Supports: 20*10=, 20*10%=, 20%-5%=, 2.5+2.5=
// Captures operands with optional percentage sign
export const MATH_REGEX = /((?:\d+(?:\.\d+)?%?))\s*([\+\-\*\/])\s*((?:\d+(?:\.\d+)?%?))\s*=$/;

export const INITIAL_CONTENT = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

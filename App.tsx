import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileService } from './services/fileService';
import Notepad from './components/Notepad';
import HistoryModal from './components/HistoryModal';
import { NoteFileStructure, SessionData } from './types';
import { INITIAL_CONTENT } from './constants';
import { Save, FolderOpen, Clock, FilePlus } from 'lucide-react';
import { Descendant } from 'slate';

const App: React.FC = () => {
  // --- State ---
  const [content, setContent] = useState<Descendant[]>(INITIAL_CONTENT);
  const [historyStack, setHistoryStack] = useState<any>(null); // Slate undo/redo stack
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string>('Untitled');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData>({
    openTimestamp: Date.now(),
    closeTimestamp: null,
    durationSeconds: 0,
    modified: false
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for auto-save debounce and intervals
  const saveTimeoutRef = useRef<any>(null);
  const sessionIntervalRef = useRef<any>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null); // For access inside closure
  const contentRef = useRef<Descendant[]>(INITIAL_CONTENT);
  const historyRef = useRef<any>(null);
  const sessionRef = useRef<SessionData>(currentSession);
  const sessionsListRef = useRef<SessionData[]>([]);

  // Sync refs
  useEffect(() => { fileHandleRef.current = fileHandle; }, [fileHandle]);
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { historyRef.current = historyStack; }, [historyStack]);
  useEffect(() => { sessionRef.current = currentSession; }, [currentSession]);
  useEffect(() => { sessionsListRef.current = sessions; }, [sessions]);


  // --- Session Tracking ---
  useEffect(() => {
    // Update duration every second
    sessionIntervalRef.current = setInterval(() => {
      setCurrentSession(prev => ({
        ...prev,
        durationSeconds: (Date.now() - prev.openTimestamp) / 1000
      }));
    }, 1000);

    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, [currentSession.openTimestamp]);

  // --- Actions ---

  const handleSave = useCallback(async (manual = false) => {
    setIsSaving(true);
    
    // Update session close time for the record (snapshot)
    const currentSessionSnapshot = {
        ...sessionRef.current,
        closeTimestamp: Date.now()
    };
    
    // Prepare file data
    const fileData: NoteFileStructure = {
      content: contentRef.current,
      history: historyRef.current,
      sessions: [...sessionsListRef.current, currentSessionSnapshot],
      meta: {
        version: 1,
        created: Date.now()
      }
    };

    const savedHandle = await FileService.saveFile(fileHandleRef.current, fileData);
    
    if (savedHandle) {
      if (!fileHandleRef.current) {
        setFileHandle(savedHandle);
        setFileName(savedHandle.name);
      }
    }
    
    setIsSaving(false);
  }, []);

  const handleEditorChange = (newContent: Descendant[], newHistory: any) => {
    setContent(newContent);
    setHistoryStack(newHistory);
    
    // Mark session as modified
    if (!currentSession.modified) {
      setCurrentSession(prev => ({ ...prev, modified: true }));
    }

    // Auto-save debounce
    if (fileHandleRef.current) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            handleSave();
        }, 2000);
    }
  };

  const handleOpen = async () => {
    // Save current before opening? 
    // For simplicity in this "minimal" app, we assume user knows what they are doing or auto-save caught it.
    // Ideally we'd prompt if unsaved and no file handle.
    
    const result = await FileService.openFile();
    if (result) {
      const { handle, data } = result;
      setFileHandle(handle);
      setFileName(handle.name);
      
      // Load content
      setContent(data.content || INITIAL_CONTENT);
      setHistoryStack(data.history || { undos: [], redos: [] });
      setSessions(data.sessions || []);
      
      // Start NEW session
      setCurrentSession({
        openTimestamp: Date.now(),
        closeTimestamp: null,
        durationSeconds: 0,
        modified: false
      });
    }
  };

  const handleNew = () => {
      // Reset state
      setFileHandle(null);
      setFileName('Untitled');
      setContent(INITIAL_CONTENT);
      setHistoryStack({ undos: [], redos: [] });
      setSessions([]);
      setCurrentSession({
        openTimestamp: Date.now(),
        closeTimestamp: null,
        durationSeconds: 0,
        modified: false
      });
  };

  const handleSaveAs = async () => {
      const currentSessionSnapshot = {
        ...sessionRef.current,
        closeTimestamp: Date.now()
    };

     const fileData: NoteFileStructure = {
      content: contentRef.current,
      history: historyRef.current,
      sessions: [...sessionsListRef.current, currentSessionSnapshot],
      meta: {
        version: 1,
        created: Date.now()
      }
    };
    
    const savedHandle = await FileService.saveAs(fileData);
    if (savedHandle) {
        setFileHandle(savedHandle);
        setFileName(savedHandle.name);
    }
  };


  return (
    <div className="h-full flex flex-col bg-app-bg text-app-text font-sans selection:bg-white/20">
      
      {/* Minimal Header (Auto-hides or very subtle) */}
      <header className="h-12 flex items-center justify-between px-6 border-b border-[#111] bg-black z-40 select-none">
        <div className="flex items-center gap-4">
           <span className="font-semibold tracking-wide text-sm text-gray-400">{fileName}</span>
           {isSaving && <span className="text-xs text-gray-600 animate-pulse">Saving...</span>}
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={handleNew} className="p-2 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#111]" title="New File">
                <FilePlus size={18} />
            </button>
            <button onClick={handleOpen} className="p-2 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#111]" title="Open File">
                <FolderOpen size={18} />
            </button>
            <button onClick={() => handleSave(true)} className="p-2 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#111]" title="Save (Ctrl+S)">
                <Save size={18} />
            </button>
             <button onClick={handleSaveAs} className="p-2 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#111] text-xs font-mono" title="Save As">
                AS
            </button>
            <div className="w-px h-4 bg-[#222] mx-1"></div>
            <button 
                onClick={() => setIsHistoryOpen(true)} 
                className="p-2 text-gray-500 hover:text-[#FABD40] transition-colors rounded hover:bg-[#111]" 
                title="Session History"
            >
                <Clock size={18} />
            </button>
        </div>
      </header>

      {/* Editor Area */}
      <main className="flex-1 overflow-hidden relative">
        <Notepad 
            key={fileHandle ? fileHandle.name : 'new'} // Force remount on file change to clear internal editor state
            initialContent={content} 
            initialHistory={historyStack}
            onChange={handleEditorChange}
        />
      </main>

      {/* History Modal */}
      {isHistoryOpen && (
        <HistoryModal 
            sessions={[...sessions, currentSession]} 
            currentSessionStart={currentSession.openTimestamp}
            onClose={() => setIsHistoryOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;

import React from 'react';
import { SessionData } from '../types';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { X, Clock } from 'lucide-react';

interface HistoryModalProps {
  sessions: SessionData[];
  onClose: () => void;
  currentSessionStart: number;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ sessions, onClose, currentSessionStart }) => {
  
  // Combine stored sessions with current active session simulation for display
  const allSessions = [...sessions].reverse();

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#333] w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <Clock className="text-[#FABD40]" size={24} />
            <h2 className="text-xl font-medium text-white">Session History</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-4">
            <p className="text-gray-500 text-sm mb-4">
                History is tracked by session (Open to Close).
            </p>
          
          {allSessions.length === 0 ? (
            <div className="text-center text-gray-600 py-10">No history available for this file.</div>
          ) : (
            <div className="space-y-3">
              {allSessions.map((session, idx) => {
                 const duration = intervalToDuration({ start: 0, end: session.durationSeconds * 1000 });
                 const durationStr = formatDuration(duration) || `${session.durationSeconds.toFixed(1)}s`;

                 return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#222] hover:border-[#333] transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-mono text-sm">
                        {format(session.openTimestamp, 'MMM d, yyyy • h:mm aa')}
                      </span>
                      <span className="text-gray-500 text-xs">
                        Closed: {session.closeTimestamp ? format(session.closeTimestamp, 'h:mm aa') : 'Active'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-3 sm:mt-0">
                       <div className="text-right">
                            <span className="block text-xs text-gray-500 uppercase tracking-wider">Duration</span>
                            <span className="text-[#6AD7D6] font-mono text-sm">{durationStr}</span>
                       </div>
                       <div className="text-right w-20">
                           <span className={`text-xs px-2 py-1 rounded-full ${session.modified ? 'bg-[#D51F68]/20 text-[#D51F68]' : 'bg-gray-800 text-gray-400'}`}>
                               {session.modified ? 'EDITED' : 'VIEWED'}
                           </span>
                       </div>
                    </div>
                  </div>
                 )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;

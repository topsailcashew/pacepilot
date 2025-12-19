import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['⌘', 'K'], description: 'Quick search' },
        { keys: ['N'], description: 'Quick add task' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['F'], description: 'Toggle focus mode' },
        { keys: ['⌘', 'Enter'], description: 'Submit form' },
        { keys: ['Esc'], description: 'Close modal/overlay' },
      ]
    },
    {
      category: 'Task Management',
      items: [
        { keys: ['⌘', 'D'], description: 'Duplicate task (when expanded)' },
        { keys: ['⌘', 'Backspace'], description: 'Delete task (when expanded)' },
        { keys: ['Space'], description: 'Toggle task complete' },
      ]
    },
    {
      category: 'Power User',
      items: [
        { keys: ['⌘', 'Z'], description: 'Undo last action' },
        { keys: ['⌘', 'Shift', 'Z'], description: 'Redo last action' },
        { keys: ['⌘', '/'], description: 'Show command palette' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-pilot-orange/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pilot-orange/10 border border-pilot-orange/20 rounded-lg">
              <Keyboard size={24} className="text-pilot-orange" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Keyboard Shortcuts</h2>
              <p className="text-xs text-white/40 mt-1 font-bold uppercase tracking-wider">Master Pace Pilot like a pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcuts.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                  <span className="w-8 h-px bg-pilot-orange/30"></span>
                  {section.category}
                </h3>
                <div className="space-y-3">
                  {section.items.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="bg-white/[0.02] border border-white/5 rounded-lg p-4 hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors flex-1">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {shortcut.keys.map((key, keyIdx) => (
                            <React.Fragment key={keyIdx}>
                              <kbd className="px-2.5 py-1.5 bg-deepnavy border border-white/10 rounded text-xs font-mono text-white/70 shadow-sm min-w-[2rem] text-center">
                                {key}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span className="text-white/20 text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="bg-pilot-orange/10 border border-pilot-orange/20 rounded-lg p-4">
              <p className="text-xs text-white/60 leading-relaxed">
                <span className="font-bold text-pilot-orange">Pro Tip:</span> Most shortcuts work globally,
                but some are context-specific. Press <kbd className="px-2 py-1 bg-deepnavy border border-white/10 rounded text-xs font-mono text-white/70 mx-1">?</kbd> anytime to see this overlay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;

import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TreeResumeRenderer } from './TreeResumeRenderer';
import { computeNumbering } from '../../utils/numbering';

interface TreeResumePanelProps {
  userBasicInfo?: any;
}

export const TreeResumePanel: React.FC<TreeResumePanelProps> = () => {
  const { resumeTree } = useAppStore();
  
  // Ensure numbering is computed
  const treeWithAddresses = useMemo(() => {
    if (resumeTree.length === 0) return [];
    
    // Clone tree and ensure addresses are computed
    const tree = JSON.parse(JSON.stringify(resumeTree));
    const computed = computeNumbering(tree);
    
    // Apply addresses to nodes
    function applyAddresses(nodes: any[]) {
      nodes.forEach(node => {
        node.addr = computed.uidToAddr[node.uid];
        if (node.children) {
          applyAddresses(node.children);
        }
      });
    }
    
    applyAddresses(tree);
    return tree;
  }, [resumeTree]);
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div id="resume-pane" className="rounded-2xl border border-gray-200 bg-white shadow-lg flex flex-col h-[calc(100vh-2rem)]">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          #resume-pane {
            width: 760px !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #fff !important;
            border: 2px solid #3b82f6 !important;
            border-radius: 1rem !important;
            padding: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          #resume-pane .mb-6,
          #resume-pane .mb-4 {
            margin-bottom: 0.75rem !important;
          }
          #resume-pane .p-6 {
            padding: 1rem !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Resume</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-medium text-white shadow hover:from-indigo-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
          >
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Resume Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}>
        <div className="p-6 text-[13px] leading-snug font-[350] tracking-wide print:p-4">
          {treeWithAddresses.length > 0 ? (
            <TreeResumeRenderer tree={treeWithAddresses} />
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p className="text-lg mb-2">No resume content yet</p>
              <p className="text-sm">Start chatting with the AI to build your resume!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
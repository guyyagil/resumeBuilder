import React from 'react';
import { ResumeUpload } from '../Upload/ResumeUpload';
import { JobDescriptionInput } from '../Controls/JobDescriptionInput';
import { UndoRedoButtons } from '../Controls/UndoRedoButtons';
import { ExportButton } from '../Controls/ExportButton';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-full max-w-sm border-r border-gray-200 bg-gray-50 p-4 space-y-6 overflow-y-auto">
      <ResumeUpload />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Target Job Description
        </h2>
        <JobDescriptionInput />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          History
        </h2>
        <UndoRedoButtons />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Export
        </h2>
        <ExportButton />
      </section>
    </aside>
  );
};

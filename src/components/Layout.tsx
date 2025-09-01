import React from 'react';
import { z } from 'zod';
import { ChatPanel } from './ChatPanel';
import { ResumePanel } from './ResumePanel';

const welcomeFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  currentRole: z.string().min(2, 'Please enter your current role'),
  experienceYears: z.string().optional(),
  industry: z.string().optional(),
  keySkills: z.string().optional(),
  targetJobPosting: z.string().optional(),
});

type WelcomeFormData = z.infer<typeof welcomeFormSchema>;

interface LayoutProps {
  userBasicInfo: WelcomeFormData | null;
}

const Layout: React.FC<LayoutProps> = ({ userBasicInfo }) => {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-['Heebo'] text-slate-800">
      <div className="mx-auto max-w-[98rem] px-3 py-4 grid gap-4 lg:grid-cols-2 h-screen">
        <div className="order-1 lg:order-1">
          <ChatPanel userBasicInfo={userBasicInfo} />
        </div>
        <div className="order-2 lg:order-2">
          <ResumePanel userBasicInfo={userBasicInfo} />
        </div>
      </div>
    </div>
  );
};

export default Layout;

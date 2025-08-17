import React from 'react';
import { z } from 'zod';

// Use the same Zod schema as WelcomeForm
const welcomeFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  currentRole: z.string().min(2, 'Please enter your current role'),
  experienceYears: z.string().optional(),
  industry: z.string().optional(),
  keySkills: z.string().optional(),
});

type WelcomeFormData = z.infer<typeof welcomeFormSchema>;

interface LayoutProps {
  userBasicInfo: WelcomeFormData | null;
}

const Layout: React.FC<LayoutProps> = ({ userBasicInfo }) => {
  // Parse skills into array
  const skillsArray = userBasicInfo?.keySkills 
    ? userBasicInfo.keySkills.split(',').map(skill => skill.trim()).filter(skill => skill)
    : ['React', 'TypeScript', 'Node.js']; // fallback

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Resume Builder AI</h1>
        </div>
      </header>

      {/* Main Content - Split Pane Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)]">
          
          {/* Chat Panel - Left Side */}
          <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Chat with AI</h2>
            
            {/* Chat Messages Area */}
            <div className="flex-1 bg-gray-50 rounded-xl p-4 mb-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-blue-100 rounded-lg p-3 max-w-xs">
                  <p className="text-sm">
                    Hello {userBasicInfo?.fullName || 'there'}! I see you're a {userBasicInfo?.currentRole || 'professional'}. 
                    Let's enhance your resume! Tell me about your recent work experience or what you'd like to improve.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Tell me about your experience..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Send
              </button>
            </div>
          </div>

          {/* Resume Preview - Right Side */}
          <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Live Resume Preview</h2>
            
            {/* Resume Content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 overflow-y-auto">
              {/* Resume Content with Real Data */}
              <div className="space-y-6">
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userBasicInfo?.fullName || 'Your Name'}
                  </h1>
                  <p className="text-gray-600">
                    {userBasicInfo?.currentRole || 'Your Title'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {userBasicInfo?.email || 'your.email@email.com'} | {userBasicInfo?.phone || '(555) 123-4567'}
                    {userBasicInfo?.location && ` | ${userBasicInfo.location}`}
                  </p>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h2>
                  <p className="text-gray-700 text-sm">
                    {userBasicInfo?.experienceYears 
                      ? `Experienced ${userBasicInfo.currentRole.toLowerCase()} with ${userBasicInfo.experienceYears} of experience${userBasicInfo.industry ? ` in ${userBasicInfo.industry}` : ''}. Ready to contribute expertise and drive results in a dynamic environment.`
                      : `Professional ${userBasicInfo?.currentRole || 'individual'} ready to contribute expertise and drive results in a dynamic environment.`
                    }
                  </p>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Experience</h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {userBasicInfo?.currentRole || 'Current Role'}
                      </h3>
                      <p className="text-sm text-gray-600">Company Name • 2022 - Present</p>
                      <ul className="text-sm text-gray-700 mt-1 ml-4">
                        <li>• Key achievement or responsibility</li>
                        <li>• Another important contribution</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Export PDF
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Templates
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
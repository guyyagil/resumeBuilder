import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useAppStore } from '../store/useAppStore';
import { sendMessageToAI } from '../services/geminiService';

// ---- Add these type declarations ----
type ResumeOperation = 'reset' | 'redesign' | 'clear' | 'remove' | 'replace' | 'update' | 'add';

interface ExperienceInput {
  id?: string;
  company?: string;
  title?: string;
  duration?: string;
  description?: string[];
}

interface ResumeExperience {
  id?: string;
  company: string;
  title: string;
  duration: string;
  description: string[];
}

interface CompleteResume {
  experiences?: ResumeExperience[];
  skills?: string[];
  summary?: string;
}

interface ResumeUpdates {
  operation?: ResumeOperation;
  completeResume?: CompleteResume;
  clearSections?: ('experiences' | 'skills' | 'summary')[];
  removeExperiences?: string[];
  removeSkills?: string[];
  experiences?: ExperienceInput[];
  skills?: string[];
  summary?: string;
  experience?: ExperienceInput;
}

type AIResponse = string | {
  message: string;
  resumeUpdates?: ResumeUpdates;
};

// Helper to normalize experiences into required shape
const normalizeExperiences = (items: ExperienceInput[] = []) =>
  items
    .filter(e => e.company && e.title) // ensure required
    .map(e => ({
      id: e.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      company: e.company!, // safe due to filter
      title: e.title!,
      duration: e.duration || '2022 - Present',
      description: e.description && e.description.length > 0
        ? e.description
        : ['Add measurable accomplishment or responsibility']
    }));

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
  targetJobPosting: z.string().optional(),
});

type WelcomeFormData = z.infer<typeof welcomeFormSchema>;

interface LayoutProps {
  userBasicInfo: WelcomeFormData | null;
}

const Layout: React.FC<LayoutProps> = ({ userBasicInfo }) => {
  const { 
    chatMessages, 
    addChatMessage, 
    resume,
    // Enhanced resume control methods
    addSkills, 
    addOrUpdateExperience, 
    setSummary,
    removeExperience,
    clearAllExperiences,
    replaceAllExperiences,
    removeSkills,
    replaceSkills,
    clearAllSkills,
    clearSummary,
    resetResume,
    replaceEntireResume
  } = useAppStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialMessageSent = useRef(false);

  // Add initial AI greeting when component mounts
  useEffect(() => {
    if (!initialMessageSent.current && chatMessages.length === 0 && userBasicInfo) {
      const jobPostingMessage = userBasicInfo.targetJobPosting 
        ? "\n\nI see you've provided a target job posting - I'll help tailor your resume to match that specific role!" 
        : "";
      
      addChatMessage(
        `Hello ${userBasicInfo.fullName}! I see you're a ${userBasicInfo.currentRole}. Let's build an amazing resume together!${jobPostingMessage}

To get started, tell me about your current job - what company do you work for and what are your main responsibilities?`,
        'ai'
      );
      initialMessageSent.current = true;
    }
  }, [userBasicInfo, chatMessages.length, addChatMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    addChatMessage(userMessage, 'user');

    // Show context processing message for longer conversations
    const contextProcessingId = chatMessages.length > 3 ? 
      addChatMessage('🧠 Processing conversation context...', 'ai') : null;

    try {
      // Pass existing resume data and chat history to AI for better context
      const aiResponse = await sendMessageToAI(
        userMessage, 
        userBasicInfo, 
        resume,
        chatMessages
      ) as AIResponse;
      
      // Remove context processing message if it was added
      if (contextProcessingId) {
        // Note: We'd need to implement a way to remove messages from the store for this to work
        // For now, we'll just add the response
      }
      
      if (typeof aiResponse === 'object' && aiResponse.message) {
        addChatMessage(aiResponse.message, 'ai');
        
        // Handle enhanced resume operations
        if (aiResponse.resumeUpdates) {
          const updates = aiResponse.resumeUpdates as ResumeUpdates;
          const operation: ResumeOperation = updates.operation || 'add';
          
          console.log('AI Operation:', operation, updates);
          
          // Handle different operats
          switch (operation) {
            case 'reset':
              resetResume();
              addChatMessage('🔄 Resume completely reset!', 'ai');
              break;
              
            case 'redesign':
              if (updates.completeResume) {
                const normalized = {
                  experiences: normalizeExperiences(updates.completeResume.experiences || []),
                  skills: updates.completeResume.skills || [],
                  summary: updates.completeResume.summary || ''
                };
                // cast to any to satisfy store's stricter Resume type
                replaceEntireResume(normalized as any);
                addChatMessage('🎨 Complete resume redesign applied!', 'ai');
              }
              break;
              
            case 'clear':
              if (updates.clearSections && Array.isArray(updates.clearSections)) {
                updates.clearSections.forEach((section: string) => {
                  switch (section) {
                    case 'experiences':
                      clearAllExperiences();
                      break;
                    case 'skills':
                      clearAllSkills();
                      break;
                    case 'summary':
                      clearSummary();
                      break;
                  }
                });
                addChatMessage(`🗑️ Cleared sections: ${updates.clearSections.join(', ')}`, 'ai');
              }
              break;
              
            case 'remove':
              // Remove specific experiences
              if (updates.removeExperiences && Array.isArray(updates.removeExperiences)) {
                updates.removeExperiences.forEach((company: string) => {
                  removeExperience(company);
                });
                addChatMessage(`❌ Removed experiences: ${updates.removeExperiences.join(', ')}`, 'ai');
              }
              
              // Remove specific skills
              if (updates.removeSkills && Array.isArray(updates.removeSkills)) {
                removeSkills(updates.removeSkills);
                addChatMessage(`❌ Removed skills: ${updates.removeSkills.join(', ')}`, 'ai');
              }
              break;
              
            case 'replace':
              if (updates.experiences && Array.isArray(updates.experiences)) {
                const normalized = normalizeExperiences(updates.experiences);
                replaceAllExperiences(normalized as any);
                addChatMessage('🔄 Replaced all experiences with new ones!', 'ai');
              }
              if (updates.skills && Array.isArray(updates.skills)) {
                replaceSkills(updates.skills);
                addChatMessage('🔄 Replaced all skills with new ones!', 'ai');
              }
              if (updates.summary) {
                setSummary(updates.summary);
                addChatMessage('📝 Updated professional summary!', 'ai');
              }
              break;
              
            case 'update':
            case 'add':
            default:
              if (updates.experience) {
                const exp = updates.experience;
                const hasValidCompany = exp.company && exp.company !== 'Company Name' && !exp.company.includes('Needed');
                const hasValidTitle = exp.title && exp.title !== 'Job Title' && !exp.title.includes('Needed');
                if (hasValidCompany && hasValidTitle) {
                  addOrUpdateExperience({
                    company: exp.company!,   // assert non-undefined after validation
                    title: exp.title!,
                    duration: exp.duration || '2022 - Present',
                    description: exp.description && exp.description.length
                      ? exp.description
                      : ['Key responsibility']
                  } as any);
                  addChatMessage(`✅ ${operation === 'update' ? 'Updated' : 'Added'} experience at ${exp.company}!`, 'ai');
                } else {
                  console.log('Skipped adding experience with incomplete data:', exp);
                }
              }
              if (updates.skills && Array.isArray(updates.skills)) {
                addSkills(updates.skills);
                addChatMessage(`✅ Added ${updates.skills.length} new skills!`, 'ai');
              }
              if (updates.summary) {
                setSummary(updates.summary);
                addChatMessage('📝 Updated professional summary!', 'ai');
              }
              break;
          }
        }
      } else {
        // Fallback for plain text response
        const message = typeof aiResponse === 'string' ? aiResponse : aiResponse.message;
        addChatMessage(message, 'ai');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Combine skills from user input and AI suggestions
  const allSkills = [...new Set([
    ...(userBasicInfo?.keySkills?.split(',').map(s => s.trim()).filter(s => s) || []),
    ...resume.skills
  ])];

  // Use professional summary from AI or generate default
  const professionalSummary = resume.summary || 
    (userBasicInfo?.experienceYears 
      ? `Experienced ${userBasicInfo.currentRole?.toLowerCase()} with ${userBasicInfo.experienceYears} of experience${userBasicInfo.industry ? ` in ${userBasicInfo.industry}` : ''}. Ready to contribute expertise and drive results in a dynamic environment.`
      : `Professional ${userBasicInfo?.currentRole || 'individual'} ready to contribute expertise and drive results in a dynamic environment.`
    );

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
            <div className="flex-1 bg-gray-50 rounded-xl p-4 mb-4 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg p-3 max-w-sm ${
                      message.type === 'ai' 
                        ? 'bg-blue-100 text-blue-900' 
                        : 'bg-white ml-auto text-gray-900 border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-blue-100 rounded-lg p-3 max-w-sm">
                    <p className="text-sm text-blue-900">AI is thinking...</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your experience..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
          </div>

          {/* Resume Preview - Right Side */}
          <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Live Resume Preview</h2>
            
            {/* Resume Content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Header Section */}
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
                  {userBasicInfo?.targetJobPosting && (
                    <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
                      🎯 Tailored for Target Role
                    </div>
                  )}
                </div>
                
                {/* Professional Summary */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h2>
                  <p className="text-gray-700 text-sm">
                    {professionalSummary}
                  </p>
                </div>
                
                {/* Experience Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Experience</h2>
                  <div className="space-y-3">
                    {/* AI-generated experiences */}
                    {resume.experiences.map((exp: any) => (
                      <div key={exp.id || exp.company}>
                        <h3 className="font-medium text-gray-900">{exp.title}</h3>
                        <p className="text-sm text-gray-600">{exp.company} • {exp.duration}</p>
                        <ul className="text-sm text-gray-700 mt-1 ml-4">
                          {exp.description.map((desc: string, index: number) => (
                            <li key={index}>• {desc}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    
                    {/* Default experience if none added yet */}
                    {resume.experiences.length === 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {userBasicInfo?.currentRole || 'Current Role'}
                        </h3>
                        <p className="text-sm text-gray-600">Company Name • 2022 - Present</p>
                        <ul className="text-sm text-gray-700 mt-1 ml-4">
                          <li>• Tell me about your current role to populate this section</li>
                          <li>• Share your achievements and responsibilities</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Skills Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.length > 0 ? (
                      allSkills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Share your skills in the chat to populate this section</p>
                    )}
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
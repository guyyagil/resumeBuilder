import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useAppStore } from '../store/useAppStore';
import { sendMessageToAI } from '../services/geminiService';

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
  const { 
    chatMessages, 
    addChatMessage, 
    resumeData, 
    updateSkills, 
    addExperience, 
    updateProfessionalSummary,
    updateExperience  // Add this line
  } = useAppStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialMessageSent = useRef(false);

  // Track conversation count for AI prompting
  const conversationCount = chatMessages.filter(msg => msg.type === 'user').length;

  // Add initial AI greeting when component mounts
  useEffect(() => {
    if (!initialMessageSent.current && chatMessages.length === 0 && userBasicInfo) {
      addChatMessage(
        `Hello ${userBasicInfo.fullName}! I see you're a ${userBasicInfo.currentRole}. Let's build an amazing resume together! 

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

    try {
      // Pass existing resume data to AI for context
      const aiResponse = await sendMessageToAI(
        userMessage, 
        userBasicInfo, 
        conversationCount,
        resumeData // Pass current resume state
      );
      
      if (typeof aiResponse === 'object' && aiResponse.message) {
        addChatMessage(aiResponse.message, 'ai');
        
        // Handle smart updates based on AI's action
        if (aiResponse.resumeUpdates) {
          const updates = aiResponse.resumeUpdates;
          
          // Handle experience updates vs additions
          if (updates.experience) {
            if (aiResponse.action === 'update' && updates.experience.id) {
              // Update existing experience
              updateExperience(updates.experience.id, updates.experience);
            } else if (aiResponse.action === 'add') {
              // Add new experience
              addExperience({
                id: Date.now().toString(),
                ...updates.experience
              });
            }
          }
          
          // Handle skills (only add new ones)
          if (updates.skills && Array.isArray(updates.skills)) {
            const currentSkills = resumeData.skills;
            const newSkills = updates.skills.filter((skill: string) => 
              !currentSkills.some(existing => 
                existing.toLowerCase() === skill.toLowerCase()
              )
            );
            if (newSkills.length > 0) {
              updateSkills([...currentSkills, ...newSkills]);
            }
          }
          
          // Update summary
          if (updates.professionalSummary) {
            updateProfessionalSummary(updates.professionalSummary);
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
    ...resumeData.skills
  ])];

  // Use professional summary from AI or generate default
  const professionalSummary = resumeData.professionalSummary || 
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
                    {resumeData.experiences.map((exp) => (
                      <div key={exp.id}>
                        <h3 className="font-medium text-gray-900">{exp.title}</h3>
                        <p className="text-sm text-gray-600">{exp.company} • {exp.duration}</p>
                        <ul className="text-sm text-gray-700 mt-1 ml-4">
                          {exp.description.map((desc, index) => (
                            <li key={index}>• {desc}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    
                    {/* Default experience if none added yet */}
                    {resumeData.experiences.length === 0 && (
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
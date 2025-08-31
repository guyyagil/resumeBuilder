import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useAppStore } from '../store/useAppStore';
import { sendMessageToAI } from '../services/geminiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [exporting, setExporting] = useState(false);
  const initialMessageSent = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add initial AI greeting when component mounts
  useEffect(() => {
    if (!initialMessageSent.current && chatMessages.length === 0) {
      const name =
        (resume.fullName && resume.fullName.trim()) ||
        (userBasicInfo as any)?.fullName?.trim() ||
        'משתמש';
      addChatMessage(
        `היי ${name}! אני כאן לעזור לך לערוך את קורות החיים שלך ולהתאים אותם בצורה הטובה ביותר למשרה המבוקשת!`,
        'ai'
      );
      initialMessageSent.current = true;
    }
  }, [chatMessages.length, addChatMessage, resume.fullName, userBasicInfo]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

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
      // Pass chat history and resume to AI for better context (match service signature)
      const aiResponse = await sendMessageToAI(
        userMessage,
        chatMessages,
        resume
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

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      // Create a simple temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: -10000px;
        left: 0;
        width: 210mm;
        background-color: #ffffff;
        font-family: 'Heebo', Arial, sans-serif;
        direction: rtl;
        padding: 20mm;
        box-sizing: border-box;
        font-size: 12pt;
        line-height: 1.4;
        color: #111827;
      `;

      // Build simple clean HTML
      const { fullName, title, email, phone, location, summary, experiences, skills } = resume;
      const allSkills = [...new Set([
        ...(userBasicInfo?.keySkills?.split(',').map(s => s.trim()).filter(s => s) || []),
        ...skills
      ])];

      const contactInfo = [email, phone, location].filter(Boolean).join(' | ');

      tempContainer.innerHTML = `
        <div>
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="font-size: 24pt; font-weight: bold; margin: 0 0 8px 0;">${fullName || 'שם מלא'}</h1>
            ${title ? `<p style="font-size: 14pt; margin: 4px 0; color: #666;">${title}</p>` : ''}
            ${contactInfo ? `<p style="font-size: 11pt; color: #666; margin: 4px 0;">${contactInfo}</p>` : ''}
          </div>

          <!-- Professional Summary -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16pt; font-weight: bold; margin: 0 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 3px;">תקציר מקצועי</h2>
            <p style="margin: 0; text-align: justify;">${summary || professionalSummary}</p>
          </div>

          <!-- Experience -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16pt; font-weight: bold; margin: 0 0 15px 0; border-bottom: 1px solid #ccc; padding-bottom: 3px;">ניסיון</h2>
            ${experiences.map(exp => `
              <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14pt; font-weight: bold; margin: 0 0 4px 0;">${exp.title || ''}</h3>
                <p style="font-size: 12pt; color: #666; margin: 0 0 8px 0;">${exp.company || ''} • ${exp.duration || ''}</p>
                ${exp.description.map(desc => {
                  const cleanDesc = desc.replace(/^[•\-\s]+/, '');
                  return `<p style="margin: 4px 0 4px 15px; text-indent: -15px;">• ${cleanDesc}</p>`;
                }).join('')}
              </div>
            `).join('')}
            ${experiences.length === 0 ? '<p style="color: #666;">אין ניסיון להציג</p>' : ''}
          </div>

          <!-- Skills -->
          <div>
            <h2 style="font-size: 16pt; font-weight: bold; margin: 0 0 15px 0; border-bottom: 1px solid #ccc; padding-bottom: 3px;">כישורים</h2>
            <p style="margin: 0;">${allSkills.join(' • ')}</p>
          </div>
        </div>
      `;

      document.body.appendChild(tempContainer);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Simple canvas generation
      const canvas = await html2canvas(tempContainer, {
        scale: 1.2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      document.body.removeChild(tempContainer);

      // Simple PDF creation
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight - (margin * 2)) {
        // Fits on one page
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          imgWidth,
          imgHeight
        );
      } else {
        // Split into pages
        const pageRatio = (pageHeight - margin * 2) / imgHeight;
        const pageCanvasHeight = canvas.height * pageRatio;
        let position = 0;

        while (position < canvas.height) {
          const currentHeight = Math.min(pageCanvasHeight, canvas.height - position);
          
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = currentHeight;
          
          const ctx = pageCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, position, canvas.width, currentHeight, 0, 0, canvas.width, currentHeight);

          if (position > 0) pdf.addPage();
          
          const finalHeight = (currentHeight * imgWidth) / canvas.width;
          pdf.addImage(
            pageCanvas.toDataURL('image/png'),
            'PNG',
            margin,
            margin,
            imgWidth,
            finalHeight
          );

          position += currentHeight;
          if (position >= canvas.height) break;
        }
      }

      const fileName = `${(resume.fullName || 'קורות_חיים').replace(/[^\w\u0590-\u05FF\s]+/g, '_')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF export failed:', error);
      alert('שגיאה ביצוא PDF. אנא נסה שוב.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-['Heebo'] text-slate-800">
      <div className="mx-auto max-w-7xl px-5 py-6 grid gap-6 lg:grid-cols-2 h-screen">
        
        {/* צ'אט - עכשיו ראשון כדי להיות בצד שמאל ב-RTL */}
        <div className="order-1 lg:order-1 rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur-sm shadow-lg flex flex-col h-[calc(100vh-3rem)]">
          <div className="p-4 border-b border-indigo-100 flex-shrink-0">
            <h2 className="font-bold text-lg bg-gradient-to-l from-indigo-600 to-cyan-500 bg-clip-text text-transparent">שיחה עם ה-AI</h2>
          </div>
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}
          >
            {/* הודעות */}
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg p-3 max-w-[85%] ${
                  message.type === 'ai' 
                    ? 'bg-blue-50 text-blue-900 border border-blue-100' 
                    : 'bg-white mr-auto text-gray-900 border border-gray-200 shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 max-w-[85%]">
                <p className="text-sm text-blue-900">AI חושב...</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-indigo-100 flex gap-3 flex-shrink-0">
            <input
              dir="rtl"
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="כתוב הודעה או הוסף פרטים..." 
              className="flex-1 rounded-xl border border-indigo-200 bg-white/70 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              disabled={!inputMessage.trim() || isLoading}
            >
              שלח
            </button>
          </div>
        </div>

        {/* כרטיס קורות חיים - עכשיו שני כדי להיות בצד ימין ב-RTL */}
        <div className="order-2 lg:order-2 rounded-2xl border border-gray-200 bg-white shadow-lg flex flex-col h-[calc(100vh-3rem)]">
          
          {/* שורת כותרת + כפתור ייצוא */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
            <h1 className="text-lg font-bold text-gray-900">
              קורות חיים
            </h1>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-medium text-white shadow hover:from-indigo-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {exporting ? 'מכין PDF...' : 'ייצוא PDF'}
            </button>
          </div>

          {/* תוכן קורות החיים עם גלילה */}
          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}>
            
            {/* Header Section */}
            <div className="text-center border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
               {resume.fullName?.trim() || 'שם מלא'}
              </h1>
              {resume.title?.trim() && (
                <p className="text-lg text-gray-600 mb-2">
                 {resume.title}
                </p>
              )}
              <p className="text-sm text-gray-500">
               {[resume.email, resume.phone, resume.location].filter(Boolean).join(' | ')}
              </p>
              {userBasicInfo?.targetJobPosting && (
                <div className="mt-3 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
                  🎯 מותאם למשרה המבוקשת
                </div>
              )}
            </div>
            
            {/* Professional Summary */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">תקציר מקצועי</h2>
              <p className="text-gray-700 text-sm leading-relaxed text-justify">
                {professionalSummary}
              </p>
            </div>
            
            {/* Experience Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">ניסיון</h3>
              <div className="space-y-4">
                {/* AI-generated experiences */}
                {resume.experiences.map((exp: any) => (
                  <div key={exp.id || exp.company} className="mb-4">
                    <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{exp.company} • {exp.duration}</p>
                    <div className="text-sm text-gray-700 space-y-1">
                      {exp.description.map((desc: string, index: number) => {
                        const cleanDesc = desc.replace(/^[•\-\s]+/, '');
                        return (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1 text-xs">•</span>
                            <span className="flex-1">{cleanDesc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Default experience if none added yet */}
                {resume.experiences.length === 0 && (
                  <div className="text-gray-500 text-sm italic text-center py-4">
                    <p>ספר לי על הניסיון המקצועי שלך כדי למלא חלק זה</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Skills Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">כישורים</h2>
              <div className="text-gray-700">
                {allSkills.length > 0 ? (
                  <p className="text-sm leading-relaxed">
                    {allSkills.join(' • ')}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm italic text-center py-4 w-full">
                    שתף את הכישורים שלך בצ'אט כדי למלא חלק זה
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;

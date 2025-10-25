import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { LAYOUT_STRUCTURES } from '../../phaseUtils/design/templates/layouts';
import { generateLayoutPreview } from '../../phaseUtils/design/templates/layoutPreviewGenerator';

export const LayoutSelectionPhase: React.FC = () => {
  const { setSelectedLayout } = useAppStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewLayout, setPreviewLayout] = useState<string | null>(null);

  // Generate previews for all layouts (memoized)
  const previews = useMemo(() => {
    const previewMap = new Map<string, string>();
    LAYOUT_STRUCTURES.forEach(layout => {
      previewMap.set(layout.type, generateLayoutPreview(layout));
    });
    return previewMap;
  }, []);

  const handleSelectLayout = (layoutType: string) => {
    setSelectedType(layoutType);
    const layout = LAYOUT_STRUCTURES.find(l => l.type === layoutType);
    if (layout) {
      setSelectedLayout(layout);
    }
  };

  const handlePreview = (layoutType: string) => {
    setPreviewLayout(layoutType);
  };

  const handleClosePreview = () => {
    setPreviewLayout(null);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Choose Your Resume Layout</h1>
        <p className="text-gray-600 text-lg">Select a layout structure that best showcases your content</p>
        <p className="text-sm text-blue-600 font-medium mt-2">You'll choose colors in the next step</p>
      </div>

      {/* Layout Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
          {LAYOUT_STRUCTURES.map((layout) => {
            const isSelected = selectedType === layout.type;

            return (
              <div
                key={layout.type}
                className={`group relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border ${
                  isSelected ? 'ring-4 ring-blue-400 shadow-2xl scale-[1.02] border-blue-200' : 'border-blue-100'
                }`}
                onClick={() => handleSelectLayout(layout.type)}
              >
                {/* Preview Thumbnail - Page-like aspect ratio (A4-ish) */}
                <div className="h-[28rem] bg-white overflow-hidden relative border-b-4 border-blue-100">
                  {/* Realistic Resume Preview */}
                  <div className="w-full h-full p-3 text-[8px] leading-tight bg-white font-sans">
                    {layout.structure.hasSidebar ? (
                      // Sidebar Layout
                      <div className={`flex h-full gap-3 ${layout.structure.sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`}>
                        {/* Sidebar */}
                        <div className="w-1/3 bg-gray-200 p-3 space-y-3 border-r border-black">
                          {/* Contact Info */}
                          <div>
                            <div className="font-bold text-black mb-1.5 text-[9px]">CONTACT</div>
                            <div className="text-black space-y-1">
                              <div>📧 john@email.com</div>
                              <div>📱 (555) 123-4567</div>
                              <div>📍 New York, NY</div>
                            </div>
                          </div>

                          {/* Skills */}
                          <div>
                            <div className="font-bold text-black mb-1.5 text-[9px]">SKILLS</div>
                            <div className="space-y-1 text-black">
                              <div>• JavaScript</div>
                              <div>• React</div>
                              <div>• Node.js</div>
                              <div>• Python</div>
                              <div>• SQL</div>
                              <div>• TypeScript</div>
                              <div>• MongoDB</div>
                            </div>
                          </div>

                          {/* Education */}
                          <div>
                            <div className="font-bold text-black mb-1.5 text-[9px]">EDUCATION</div>
                            <div className="text-black">
                              <div className="font-semibold">B.S. Computer Science</div>
                              <div>University Name</div>
                              <div className="text-[7px] text-gray-600 mt-0.5">2018 - 2022</div>
                              <div className="text-[7px] mt-0.5">GPA: 3.8/4.0</div>
                            </div>
                          </div>

                          {/* Certifications */}
                          <div>
                            <div className="font-bold text-black mb-1.5 text-[9px]">CERTIFICATIONS</div>
                            <div className="text-black space-y-0.5">
                              <div>AWS Certified</div>
                              <div>React Developer</div>
                            </div>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 space-y-2.5 py-1">
                          {/* Header */}
                          <div className="text-center pb-2.5 border-b-2 border-black">
                            <div className="text-[12px] font-bold text-black tracking-wide">JOHN DOE</div>
                            <div className="text-black text-[9px] mt-0.5">Software Engineer</div>
                          </div>

                          {/* Profile */}
                          <div>
                            <div className="font-bold text-black mb-1.5 text-[9px]">PROFESSIONAL SUMMARY</div>
                            <div className="text-black leading-relaxed">
                              Results-driven software engineer with 3+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating elegant solutions to complex problems. Proven track record of delivering high-quality software on time.
                            </div>
                          </div>

                          {/* Experience */}
                          <div>
                            <div className="font-bold text-black mb-1.5 text-[9px]">WORK EXPERIENCE</div>
                            <div className="space-y-2.5">
                              <div>
                                <div className="font-semibold text-black">Senior Software Engineer | TechCorp Inc.</div>
                                <div className="text-gray-600 text-[7px]">2021 - Present</div>
                                <div className="text-black mt-1 space-y-0.5">
                                  <div>• Led development of microservices architecture serving 10M+ users</div>
                                  <div>• Improved API response time by 40% through optimization</div>
                                  <div>• Mentored 3 junior developers and conducted code reviews</div>
                                  <div>• Implemented CI/CD pipelines using Jenkins and Docker</div>
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold text-black">Software Engineer | StartupXYZ</div>
                                <div className="text-gray-600 text-[7px]">2019 - 2021</div>
                                <div className="text-black mt-1 space-y-0.5">
                                  <div>• Built responsive web applications using React and TypeScript</div>
                                  <div>• Implemented CI/CD pipelines reducing deployment time by 60%</div>
                                  <div>• Collaborated with design team to improve UX</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : layout.type === 'header-focus' ? (
                      // Bold Header Layout - Large header with content below
                      <div className="h-full flex flex-col">
                        {/* Large Bold Header Section */}
                        <div className="bg-gray-200 border-b-2 border-black p-4 text-center">
                          <div className="text-[16px] font-extrabold tracking-wide mb-1.5 text-black">JOHN DOE</div>
                          <div className="text-[10px] mb-2 text-black">Software Engineer</div>
                          <div className="text-[7px] space-x-2 text-gray-600">
                            <span>📧 john@email.com</span>
                            <span>•</span>
                            <span>📱 (555) 123-4567</span>
                            <span>•</span>
                            <span>📍 New York, NY</span>
                          </div>
                        </div>

                        {/* Content Area Below Header */}
                        <div className="flex-1 grid grid-cols-2 gap-3 p-3 overflow-hidden">
                          {/* Left Column */}
                          <div className="space-y-2.5">
                            {/* Profile */}
                            <div>
                              <div className="font-bold text-black mb-1.5 text-[9px]">PROFESSIONAL SUMMARY</div>
                              <div className="text-black leading-relaxed">
                                Results-driven software engineer with 3+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating elegant solutions.
                              </div>
                            </div>

                            {/* Skills */}
                            <div>
                              <div className="font-bold text-black mb-1.5 text-[9px]">TECHNICAL SKILLS</div>
                              <div className="text-black leading-relaxed space-y-0.5">
                                <div><span className="font-semibold">Languages:</span> JavaScript, Python, TypeScript</div>
                                <div><span className="font-semibold">Frameworks:</span> React, Node.js, Express</div>
                                <div><span className="font-semibold">Tools:</span> Git, Docker, AWS</div>
                              </div>
                            </div>

                            {/* Education */}
                            <div>
                              <div className="font-bold text-black mb-1.5 text-[9px]">EDUCATION</div>
                              <div className="text-black">
                                <div className="font-semibold">B.S. Computer Science</div>
                                <div>University of Technology</div>
                                <div className="text-[7px] text-gray-600 mt-0.5">2018 - 2022 | GPA: 3.8/4.0</div>
                              </div>
                            </div>

                            {/* Certifications */}
                            <div>
                              <div className="font-bold text-black mb-1.5 text-[9px]">CERTIFICATIONS</div>
                              <div className="text-black space-y-0.5">
                                <div>AWS Certified Solutions Architect</div>
                                <div>React Professional Developer</div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div>
                            {/* Experience */}
                            <div>
                              <div className="font-bold text-black mb-1.5 text-[9px]">WORK EXPERIENCE</div>
                              <div className="space-y-2.5">
                                <div>
                                  <div className="font-semibold text-black">Senior Software Engineer</div>
                                  <div className="text-gray-600 text-[7px]">TechCorp Inc. | 2021 - Present</div>
                                  <div className="text-black mt-1 space-y-0.5 leading-relaxed">
                                    <div>• Led development of microservices architecture serving 10M+ users</div>
                                    <div>• Improved API response time by 40% through optimization</div>
                                    <div>• Mentored 3 junior developers and conducted code reviews</div>
                                    <div>• Implemented CI/CD pipelines using Jenkins and Docker</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold text-black">Software Engineer</div>
                                  <div className="text-gray-600 text-[7px]">StartupXYZ | 2019 - 2021</div>
                                  <div className="text-black mt-1 space-y-0.5 leading-relaxed">
                                    <div>• Built responsive web applications using React and TypeScript</div>
                                    <div>• Implemented CI/CD pipelines reducing deployment time by 60%</div>
                                    <div>• Collaborated with design team to improve UX</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold text-black">Junior Developer</div>
                                  <div className="text-gray-600 text-[7px]">TechStart | 2018 - 2019</div>
                                  <div className="text-black mt-1 space-y-0.5 leading-relaxed">
                                    <div>• Developed web features using modern JavaScript</div>
                                    <div>• Participated in agile development processes</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : layout.type === 'modern-split' ? (
                      // Modern Split Layout - Centered header with mixed content
                      <div className="h-full flex flex-col">
                        {/* Centered Header */}
                        <div className="text-center py-4 border-b-2 border-black">
                          <div className="text-[15px] font-bold text-black tracking-wide mb-1">JOHN DOE</div>
                          <div className="text-[9px] text-black mb-1.5">Software Engineer</div>
                          <div className="text-[7px] text-gray-600 space-x-2">
                            <span>john@email.com</span>
                            <span>•</span>
                            <span>(555) 123-4567</span>
                            <span>•</span>
                            <span>New York, NY</span>
                          </div>
                        </div>

                        {/* Content with spacious layout */}
                        <div className="flex-1 p-3 space-y-3 overflow-hidden">
                          {/* Profile - Full width */}
                          <div>
                            <div className="font-bold text-black mb-1.5 text-[9px] bg-gray-200 px-2 py-1 rounded">PROFESSIONAL SUMMARY</div>
                            <div className="text-black leading-relaxed">
                              Results-driven software engineer with 3+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating elegant solutions to complex problems.
                            </div>
                          </div>

                          {/* Two-column section */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Experience - Left */}
                            <div>
                              <div className="font-bold text-black mb-1.5 text-[9px] bg-gray-200 px-2 py-1 rounded">WORK EXPERIENCE</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="font-semibold text-black">Senior Software Engineer</div>
                                  <div className="text-gray-600 text-[7px]">TechCorp Inc. | 2021 - Present</div>
                                  <div className="text-black mt-1 space-y-0.5 leading-relaxed">
                                    <div>• Led microservices serving 10M+ users</div>
                                    <div>• Improved API performance by 40%</div>
                                    <div>• Mentored junior developers</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold text-black">Software Engineer</div>
                                  <div className="text-gray-600 text-[7px]">StartupXYZ | 2019 - 2021</div>
                                  <div className="text-black mt-1 space-y-0.5 leading-relaxed">
                                    <div>• Built responsive web apps</div>
                                    <div>• Reduced deployment time by 60%</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Skills & Education - Right */}
                            <div className="space-y-2.5">
                              <div>
                                <div className="font-bold text-black mb-1.5 text-[9px] bg-gray-200 px-2 py-1 rounded">TECHNICAL SKILLS</div>
                                <div className="text-black leading-relaxed space-y-0.5">
                                  <div><span className="font-semibold">Languages:</span> JavaScript, Python, TypeScript</div>
                                  <div><span className="font-semibold">Frameworks:</span> React, Node.js, Express</div>
                                  <div><span className="font-semibold">Tools:</span> Git, Docker, AWS</div>
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-black mb-1.5 text-[9px] bg-gray-200 px-2 py-1 rounded">EDUCATION</div>
                                <div className="text-black leading-relaxed">
                                  <div className="font-semibold">B.S. Computer Science</div>
                                  <div>University of Technology</div>
                                  <div className="text-[7px] text-gray-600 mt-0.5">2018 - 2022 | GPA: 3.8/4.0</div>
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-black mb-1.5 text-[9px] bg-gray-200 px-2 py-1 rounded">CERTIFICATIONS</div>
                                <div className="text-black space-y-0.5 leading-relaxed">
                                  <div>AWS Certified</div>
                                  <div>React Developer</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Classic Single Column Layout
                      <div className="h-full space-y-2.5 py-1">
                        {/* Header */}
                        <div className={`text-center pb-3 border-b-2 border-black ${layout.structure.hasLargeName ? 'pb-4' : ''}`}>
                          <div className={`font-bold text-black tracking-wide ${layout.structure.hasLargeName ? 'text-[14px] mb-1.5' : 'text-[12px] mb-1'}`}>
                            JOHN DOE
                          </div>
                          <div className="text-black text-[9px]">Software Engineer</div>
                          {layout.structure.hasLargeName && (
                            <div className="mt-1.5 text-gray-600 space-x-2 text-[7px]">
                              <span>📧 john@email.com</span>
                              <span>•</span>
                              <span>📱 (555) 123-4567</span>
                              <span>•</span>
                              <span>📍 New York, NY</span>
                            </div>
                          )}
                        </div>

                        {/* Profile */}
                        <div>
                          <div className="font-bold text-black mb-1.5 text-[9px] border-b border-black pb-0.5">PROFESSIONAL SUMMARY</div>
                          <div className="text-black leading-relaxed">
                            Results-driven software engineer with 3+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating elegant solutions to complex problems.
                          </div>
                        </div>

                        {/* Experience */}
                        <div>
                          <div className="font-bold text-black mb-1.5 text-[9px] border-b border-black pb-0.5">WORK EXPERIENCE</div>
                          <div className="space-y-2.5">
                            <div>
                              <div className="font-semibold text-black">Senior Software Engineer | TechCorp Inc.</div>
                              <div className="text-gray-600 text-[7px]">2021 - Present</div>
                              <div className="text-black mt-1 space-y-0.5 leading-relaxed">
                                <div>• Led development of microservices architecture serving 10M+ users</div>
                                <div>• Improved API response time by 40% through optimization</div>
                                <div>• Mentored 3 junior developers and conducted code reviews</div>
                                <div>• Implemented CI/CD pipelines using Jenkins and Docker</div>
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-black">Software Engineer | StartupXYZ</div>
                              <div className="text-gray-600 text-[7px]">2019 - 2021</div>
                              <div className="text-black mt-1 space-y-0.5 leading-relaxed">
                                <div>• Built responsive web applications using React and TypeScript</div>
                                <div>• Implemented CI/CD pipelines reducing deployment time by 60%</div>
                                <div>• Collaborated with design team to improve UX</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <div className="font-bold text-black mb-1.5 text-[9px] border-b border-black pb-0.5">TECHNICAL SKILLS</div>
                          <div className="text-black leading-relaxed space-y-0.5">
                            <div><span className="font-semibold">Languages:</span> JavaScript, Python, TypeScript, Java</div>
                            <div><span className="font-semibold">Frameworks:</span> React, Node.js, Express, Django</div>
                            <div><span className="font-semibold">Tools:</span> Git, Docker, AWS, Jenkins</div>
                          </div>
                        </div>

                        {/* Education */}
                        <div>
                          <div className="font-bold text-black mb-1.5 text-[9px] border-b border-black pb-0.5">EDUCATION</div>
                          <div>
                            <div className="font-semibold text-black">B.S. Computer Science | University of Technology</div>
                            <div className="text-gray-600 text-[7px] mt-0.5">2018 - 2022 | GPA: 3.8/4.0</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(layout.type);
                      }}
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      Preview Full Size
                    </button>
                  </div>

                  {/* Selection Badge */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-xl flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Selected</span>
                    </div>
                  )}
                </div>

                {/* Layout Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{layout.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{layout.description}</p>

                  {/* Layout Features */}
                  <div className="flex flex-wrap gap-2">
                    {layout.structure.hasSidebar && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {layout.structure.sidebarPosition === 'left' ? 'Left Sidebar' : 'Right Sidebar'}
                      </span>
                    )}
                    {layout.structure.hasLargeName && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        Large Header
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      {layout.typography.bodySpacing === 'spacious' ? 'Spacious' : layout.typography.bodySpacing === 'compact' ? 'Compact' : 'Balanced'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Size Preview Modal */}
      {previewLayout && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={handleClosePreview}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-full overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full Preview */}
            <iframe
              srcDoc={previews.get(previewLayout)}
              className="w-full h-full"
              title="Full size preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};
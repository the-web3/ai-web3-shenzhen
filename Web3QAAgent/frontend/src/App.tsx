import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { StepContainer } from './components/StepContainer';
import { DocumentInput } from './components/steps/DocumentInput';
import { InformationExtraction } from './components/steps/InformationExtraction';
import { KnowledgeGraph } from './components/steps/KnowledgeGraph';
import { QuestionAnswer } from './components/steps/QuestionAnswer';
import { ExtractionProvider } from './context/ExtractionContext';

export type Step = 1 | 2 | 3 | 4;

function App() {
  const [interactiveMode, setInteractiveMode] = useState(true); // 默认直接进入交互式教学模式
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleStepClick = (step: Step) => {
    setCurrentStep(step);
  };

  const toggleInteractiveMode = () => {
    setInteractiveMode(!interactiveMode);
    if (!interactiveMode) {
      // 启用交互式模式时，跳转到第1步
      setCurrentStep(1);
    }
  };

  return (
    <ExtractionProvider>
        <div className="min-h-screen bg-[var(--background)]">
          <>
            <Header
              onToggleInteractive={toggleInteractiveMode}
              isInteractive={interactiveMode}
            />
            {interactiveMode && (
              <ProgressBar
                currentStep={currentStep}
                onStepClick={handleStepClick}
              />
            )}

            <main className="container mx-auto px-6 py-12 max-w-[1400px]">
              <AnimatePresence mode="wait">
                {interactiveMode ? (
                  // 交互式教学模式：显示分步骤流程
                  <>
                    {currentStep === 1 && (
                      <StepContainer key="step1">
                        <DocumentInput
                          onNext={handleNext}
                          selectedDocument={selectedDocument}
                          setSelectedDocument={setSelectedDocument}
                        />
                      </StepContainer>
                    )}
                    {currentStep === 2 && (
                      <StepContainer key="step2">
                        <InformationExtraction
                          onNext={handleNext}
                          onPrevious={handlePrevious}
                          selectedDocument={selectedDocument}
                        />
                      </StepContainer>
                    )}
                    {currentStep === 3 && (
                      <StepContainer key="step3">
                        <KnowledgeGraph
                          onNext={handleNext}
                          onPrevious={handlePrevious}
                          selectedDocument={selectedDocument}
                        />
                      </StepContainer>
                    )}
                    {currentStep === 4 && (
                      <StepContainer key="step4">
                        <QuestionAnswer
                          onPrevious={handlePrevious}
                          selectedDocument={selectedDocument}
                        />
                      </StepContainer>
                    )}
                  </>
                ) : (
                  // 默认模式：直接显示问答页面
                  <StepContainer key="qa-direct">
                    <QuestionAnswer
                      onPrevious={() => {}} // 非交互式模式不需要返回
                      selectedDocument={selectedDocument}
                    />
                  </StepContainer>
                )}
              </AnimatePresence>
            </main>
          </>
        </div>
    </ExtractionProvider>
  );
}

export default App;

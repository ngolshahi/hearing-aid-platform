import React, { useState } from 'react';
import '../styles/ContextualHearingTest.css';

export interface ContextualTest {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  questions: ContextualQuestion[];
  backgroundNoise: 'none' | 'low' | 'medium' | 'high';
}

export interface ContextualQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface ContextualHearingTestProps {
  test: ContextualTest;
  onComplete: (score: number, maxScore: number) => void;
  onCancel: () => void;
}

const ContextualHearingTest: React.FC<ContextualHearingTestProps> = ({ 
  test, 
  onComplete, 
  onCancel 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 means intro screen
  const [testCompleted, setTestCompleted] = useState(false);

  const handlePlayAudio = () => {
    if (isPlaying) return;
    
    // Create an audio element
    const audio = new Audio(test.audioUrl);
    setCurrentAudio(audio);
    
    // Set up event listeners
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      // Show first question after audio ends
      setCurrentQuestionIndex(0);
    });
    audio.addEventListener('error', () => {
      setIsPlaying(false);
      alert('There was an error playing the audio. Please try again.');
    });
    
    // Play the audio
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    });
  };

  const handleStopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    const currentQuestion = test.questions[currentQuestionIndex];
    
    // Make sure user selected an answer for the current question
    if (!answers[currentQuestion.id] && answers[currentQuestion.id] !== 0) {
      alert('Please select an answer before continuing.');
      return;
    }
    
    if (currentQuestionIndex < test.questions.length - 1) {
      // Go to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let correctAnswers = 0;
      test.questions.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      // Call the complete callback with score
      onComplete(correctAnswers, test.questions.length);
      setTestCompleted(true);
    }
  };

  const handleStart = () => {
    setCurrentQuestionIndex(-1); // Show intro
    handlePlayAudio();
  };

  // Render introduction screen
  if (currentQuestionIndex === -1) {
    return (
      <div className="contextual-test-container">
        <h2>{test.title}</h2>
        <div className="test-description">
          <p>{test.description}</p>
          {test.backgroundNoise !== 'none' && (
            <p className="noise-level">
              Background noise level: <span className={`noise-${test.backgroundNoise}`}>{test.backgroundNoise}</span>
            </p>
          )}
        </div>
        
        <div className="instruction">
          <p>You will hear a conversation. Listen carefully and answer questions about what you heard.</p>
          <p>Please use headphones for the best experience.</p>
        </div>
        
        <div className="controls">
          {!isPlaying ? (
            <button 
              className="play-button" 
              onClick={handlePlayAudio}
              disabled={isPlaying}
            >
              Play Audio
            </button>
          ) : (
            <button 
              className="stop-button" 
              onClick={handleStopAudio}
            >
              Stop Audio
            </button>
          )}
          <button className="cancel-button" onClick={onCancel}>
            Cancel Test
          </button>
        </div>
      </div>
    );
  }

  // Render current question
  const currentQuestion = test.questions[currentQuestionIndex];
  
  return (
    <div className="contextual-test-container">
      <h2>{test.title}</h2>
      
      <div className="question-progress">
        Question {currentQuestionIndex + 1} of {test.questions.length}
      </div>
      
      <div className="question">
        <h3>{currentQuestion.text}</h3>
        
        <div className="answer-options">
          {currentQuestion.options.map((option, index) => (
            <div 
              key={index} 
              className={`answer-option ${answers[currentQuestion.id] === index ? 'selected' : ''}`}
              onClick={() => handleSelectAnswer(currentQuestion.id, index)}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="controls">
        <button 
          className="next-button" 
          onClick={handleNextQuestion}
          disabled={answers[currentQuestion.id] === undefined}
        >
          {currentQuestionIndex < test.questions.length - 1 ? 'Next Question' : 'Complete Test'}
        </button>
      </div>
    </div>
  );
};

export default ContextualHearingTest; 
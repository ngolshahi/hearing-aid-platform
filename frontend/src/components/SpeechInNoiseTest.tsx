import React, { useState, useEffect } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import '../styles/SpeechInNoiseTest.css';
import { generateSpeechInNoiseQuestions } from '../services/openAIService';

export interface ConversationQuestion {
  id: string;
  conversation: { text: string; voice: string }[];
  context: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

// Define noise files mapping
const noiseFiles = {
  restaurant: {
    low: '/audio/noise/restaurant-low.mp3',
    medium: '/audio/noise/restaurant-medium.mp3',
    high: '/audio/noise/restaurant-high.mp3'
  },
  street: {
    low: '/audio/noise/street-low.mp3',
    medium: '/audio/noise/street-medium.mp3',
    high: '/audio/noise/street-high.mp3'
  }
};

interface SpeechInNoiseTestProps {
  onComplete: (score: number, recommendation: string) => void;
  onCancel: () => void;
}

const SpeechInNoiseTest: React.FC<SpeechInNoiseTestProps> = ({ onComplete, onCancel }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState<Record<string, number>>({});
  const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [noiseType, setNoiseType] = useState<'restaurant' | 'street'>('restaurant');
  const [testCompleted, setTestCompleted] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isBackgroundNoisePlaying, setIsBackgroundNoisePlaying] = useState(false);
  const [recognizer, setRecognizer] = useState<sdk.SpeechRecognizer | null>(null);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [questions, setQuestions] = useState<ConversationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize speech config
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    import.meta.env.VITE_AZURE_SPEECH_KEY || '',
    import.meta.env.VITE_AZURE_SPEECH_REGION || ''
  );

  // Load questions when component mounts
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        const generatedQuestions = await generateSpeechInNoiseQuestions(5);
        console.log('Loaded questions:', generatedQuestions);
        setQuestions(generatedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const handlePlayConversation = async () => {
    if (isPlaying || !questions.length) return;
    setIsPlaying(true);
    setRecognizedText('');
    let isConversationComplete = false;

    try {
      // Start background noise first
      const noiseAudio = new Audio(noiseFiles[noiseType][noiseLevel]);
      noiseAudio.loop = true;
      noiseAudio.volume = 0.5;
      await noiseAudio.play();

      // Wait for noise to establish
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a single audio element for the entire conversation
      const conversationAudio = new Audio();
      
      // Start conversation sequentially
      for (const part of questions[currentQuestion].conversation) {
        // Set the voice based on the speaker
        const voice = part.voice === 'male' ? 'en-US-GuyNeural' : 'en-US-JennyNeural';
        speechConfig.speechSynthesisVoiceName = voice;
        
        // Create a new synthesizer for each part with a custom audio output
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        
        // Debug logging
        console.log('Voice selection:', {
          partVoice: part.voice,
          selectedVoice: voice,
          text: part.text
        });
        
        // Create a promise that resolves when speech synthesis and playback is complete
        await new Promise<void>((resolve, reject) => {
          synthesizer.speakTextAsync(
            part.text,
            (result) => {
              if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                // Create a blob from the audio data
                const audioData = result.audioData;
                const blob = new Blob([audioData], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                
                // Play the audio and wait for it to end
                conversationAudio.src = url;
                conversationAudio.onended = () => {
                  URL.revokeObjectURL(url);
                  synthesizer.close();
                  resolve();
                };
                
                // Stop any previous playback before starting new one
                conversationAudio.pause();
                conversationAudio.currentTime = 0;
                
                conversationAudio.play().catch(error => {
                  console.error('Error playing audio:', error);
                  synthesizer.close();
                  resolve();
                });
              } else {
                synthesizer.close();
                reject(new Error('Speech synthesis failed'));
              }
            },
            (error) => {
              synthesizer.close();
              reject(error);
            }
          );
        });

        // Add a pause between speakers
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      isConversationComplete = true;

      // Keep noise playing for a few seconds after conversation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clean up
      noiseAudio.pause();
      noiseAudio.currentTime = 0;
      conversationAudio.pause();
      conversationAudio.currentTime = 0;
      setIsPlaying(false);
    } catch (error) {
      console.error('Error playing conversation:', error);
      setIsPlaying(false);
    }
  };

  // Update event handlers
  useEffect(() => {
    if (recognizer) {
      recognizer.canceled = () => {
        if (!isConversationComplete) {
          setIsPlaying(false);
        }
      };

      recognizer.sessionStopped = () => {
        if (!isConversationComplete) {
          setIsPlaying(false);
        }
      };
    }
  }, [recognizer, isConversationComplete]);

  const getNoiseVolume = (level: 'low' | 'medium' | 'high'): number => {
    switch (level) {
      case 'low': return 0.7;
      case 'medium': return 0.85;
      case 'high': return 1.0;
      default: return 0.85;
    }
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    // Log the answer for debugging
    console.log(`Answering question ${questionId} with option ${answerIndex}`);
    
    // Store the answer in the results object
    setResults(prev => {
      const newResults = {
        ...prev,
        [questionId]: answerIndex
      };
      console.log('Updated results:', newResults);
      return newResults;
    });

    // Reset playing state
    setIsPlaying(false);
    setIsBackgroundNoisePlaying(false);
    setRecognizedText('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleCompleteTest();
    }
  };

  const handleCompleteTest = () => {
    // Calculate score based on correct answers
    const totalQuestions = questions.length;
    let correctAnswers = 0;
    
    // Check each question to see if it was answered correctly
    questions.forEach((question, index) => {
      // Use both the question ID and the index to find the answer
      const userAnswer = results[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      console.log(`Question ${index + 1} (ID: ${question.id}):`, {
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        allResults: results
      });
      
      if (isCorrect) {
        correctAnswers++;
      }
    });

    console.log('Test Results:', {
      totalQuestions,
      correctAnswers,
      results,
      questionIds: questions.map(q => q.id)
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const recommendation = getRecommendation(score);
    
    setTestCompleted(true);
    onComplete(score, recommendation);
  };

  const getRecommendation = (score: number): string => {
    if (score >= 80) {
      return "Your ability to understand speech in noisy environments is excellent. You show strong auditory processing skills.";
    } else if (score >= 60) {
      return "You have good speech understanding in noise, but there's room for improvement. Consider practicing in various noisy environments.";
    } else if (score >= 40) {
      return "You may experience some difficulty understanding speech in noisy environments. This is common and can be improved with practice.";
    } else {
      return "You may benefit from a professional hearing assessment, as you're experiencing significant difficulty understanding speech in noise.";
    }
  };

  if (isLoading) {
    return (
      <div className="speech-in-noise-test">
        <h2>Loading Test Questions...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="speech-in-noise-test">
        <h2>Error Loading Test</h2>
        <p>Failed to load test questions. Please try again later.</p>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="speech-in-noise-test">
      <h2>Speech-in-Noise Test</h2>
      
      {!testCompleted ? (
        <>
          <div className="test-progress">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          
          <div className="noise-controls">
            <div className="noise-level">
              <label>Noise Level:</label>
              <select 
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(e.target.value as 'low' | 'medium' | 'high')}
                disabled={isPlaying || isBackgroundNoisePlaying}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="noise-type">
              <label>Environment:</label>
              <select 
                value={noiseType}
                onChange={(e) => setNoiseType(e.target.value as 'restaurant' | 'street')}
                disabled={isPlaying || isBackgroundNoisePlaying}
              >
                <option value="restaurant">Restaurant</option>
                <option value="street">Street</option>
              </select>
            </div>
          </div>
          
          <div className="test-controls">
            {!isPlaying && !isBackgroundNoisePlaying && (
              <button 
                className="play-button"
                onClick={handlePlayConversation}
              >
                Play Conversation
              </button>
            )}
            
            {(isPlaying || isBackgroundNoisePlaying) && (
              <div className="listening-indicator">
                <div className="pulse-animation"></div>
                <p>Playing conversation...</p>
              </div>
            )}
          </div>

          {recognizedText && (
            <div className="recognized-text">
              <h3>Recognized Speech:</h3>
              <p>{recognizedText}</p>
            </div>
          )}
          
          <div className="question-section">
            <h3>Conversation Context:</h3>
            <p className="conversation-context">{questions[currentQuestion].context}</p>
            
            <h3>Question:</h3>
            <p className="question-text">{questions[currentQuestion].question}</p>
            
            <div className="answer-options">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className={`answer-button ${results[questions[currentQuestion].id] === index ? 'selected' : ''}`}
                  onClick={() => handleAnswer(questions[currentQuestion].id, index)}
                  disabled={isPlaying || isBackgroundNoisePlaying}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="test-complete">
          <h3>Test Complete!</h3>
          <p>Your results have been saved.</p>
        </div>
      )}
      
      <div className="test-actions">
        <button 
          className="cancel-button"
          onClick={onCancel}
          disabled={isPlaying || isBackgroundNoisePlaying}
        >
          Cancel Test
        </button>
      </div>
    </div>
  );
};

export default SpeechInNoiseTest; 
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HearingTestPage.css';
import { 
  generateRandomTimedTone, 
  submitHearingTestResults, 
  ToneTestResult,
  getContextualTests,
  getContextualTest,
  submitContextualTestResults,
  ContextualTest,
  ContextualTestResult,
  detectBackgroundNoise,
  detectHeadphones,
  submitSpeechInNoiseTest
} from '../services/hearingTestService';
import ContextualHearingTest from '../components/ContextualHearingTest';
import SpeechInNoiseTest from '../components/SpeechInNoiseTest';
import AudiogramGraph from '../components/AudiogramGraph';

interface TestStep {
  frequency: number;
  description: string;
}

// Fallback test in case API fails
const fallbackContextualTest: ContextualTest = {
  id: "cafe-conversation",
  title: "Café Conversation",
  description: "You are sitting in a busy café. Two people at the next table are having a conversation about their weekend plans.",
  audioUrl: "/audio/cafe-conversation.mp3",
  backgroundNoise: "medium",
  questions: [
    {
      id: "q1",
      text: "What day are they planning to meet?",
      options: ["Friday", "Saturday", "Sunday", "Monday"],
      correctAnswer: 1 // Saturday (index 1)
    },
    {
      id: "q2",
      text: "Where are they planning to go?",
      options: ["Movie theater", "Restaurant", "Museum", "Park"],
      correctAnswer: 3 // Park (index 3)
    },
    {
      id: "q3",
      text: "What time are they planning to meet?",
      options: ["10:00 AM", "12:30 PM", "2:00 PM", "4:30 PM"],
      correctAnswer: 2 // 2:00 PM (index 2)
    }
  ]
};

const HearingTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [testResults, setTestResults] = useState<{ score: number; recommendation: string } | null>(null);
  const [volume, setVolume] = useState<number>(0.5); // Initialize at exactly 50%
  const [loading, setLoading] = useState(false); // Used for API calls
  const prevVolume = useRef<number>(0.5); // To track actual volume changes
  
  // Environment detection states
  const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [usingHeadphones, setUsingHeadphones] = useState<boolean | null>(null);
  const [environmentChecked, setEnvironmentChecked] = useState(false);
  const [showNoiseWarning, setShowNoiseWarning] = useState(false);
  const [showHeadphoneReminder, setShowHeadphoneReminder] = useState(false);
  
  // Random tone generation states
  const toneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [tonePlayingStatus, setTonePlayingStatus] = useState<'idle' | 'listening' | 'played'>('idle');
  const [showResponseButtons, setShowResponseButtons] = useState(false);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for the multi-step test flow
  const [testStage, setTestStage] = useState<'intro' | 'environment-check' | 'tone' | 'speech-in-noise' | 'contextual' | 'results' | 'final-results'>('intro');
  const [showContextualTest, setShowContextualTest] = useState(false);
  const [contextualScore, setContextualScore] = useState<{score: number, maxScore: number} | null>(null);
  
  // State for contextual tests
  const [availableContextualTests, setAvailableContextualTests] = useState<ContextualTest[]>([]);
  const [selectedContextualTest, setSelectedContextualTest] = useState<ContextualTest | null>(null);
  const [contextualTestAnswers, setContextualTestAnswers] = useState<Record<string, number>>({});
  const [speechInNoiseScore, setSpeechInNoiseScore] = useState<number | null>(null);
  const [speechInNoiseRecommendation, setSpeechInNoiseRecommendation] = useState<string | null>(null);

  const testSteps: TestStep[] = [
    { frequency: 250, description: "Low frequency sounds like thunder or bass drums" },
    { frequency: 500, description: "Lower frequencies of human speech" },
    { frequency: 1000, description: "Mid-range speech sounds" },
    { frequency: 2000, description: "Higher speech sounds like women's and children's voices" },
    { frequency: 4000, description: "High frequency sounds like birds chirping" },
    { frequency: 8000, description: "Very high frequency sounds" }
  ];

  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (toneTimerRef.current) {
        clearTimeout(toneTimerRef.current);
      }
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
    };
  }, []);

  // Fetch available contextual tests on component mount
  useEffect(() => {
    const fetchContextualTests = async () => {
      try {
        const tests = await getContextualTests();
        setAvailableContextualTests(tests);
      } catch (error) {
        console.error('Error fetching contextual tests:', error);
        // Use fallback test if API fails
        setAvailableContextualTests([fallbackContextualTest]);
      }
    };
    
    fetchContextualTests();
  }, []);

  // Check environment when moving to environment check stage
  useEffect(() => {
    if (testStage === 'environment-check' && !environmentChecked) {
      checkEnvironment();
    }
  }, [testStage, environmentChecked]);

  const checkEnvironment = async () => {
    setLoading(true);
    
    try {
      // Check if user is using headphones
      const headphonesDetected = await detectHeadphones();
      setUsingHeadphones(headphonesDetected);
      setShowHeadphoneReminder(!headphonesDetected);
      
      // Check background noise
      const noise = await detectBackgroundNoise();
      setNoiseLevel(noise);
      
      // Show warning if noise is medium or high
      if (noise === 'medium' || noise === 'high') {
        setShowNoiseWarning(true);
      } else {
        // If noise is low and headphones are used, proceed automatically
        if (headphonesDetected) {
          setEnvironmentChecked(true);
          setTestStage('tone');
        } else {
          setEnvironmentChecked(true);
        }
      }
    } catch (error) {
      console.error('Error checking environment:', error);
      // Proceed with warnings if checks fail
      setShowHeadphoneReminder(true);
      setShowNoiseWarning(true);
      setEnvironmentChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setCurrentStep(1); // Start at the first actual test (1-indexed for display)
    setResults({});
    setIsTestComplete(false);
    setTestResults(null);
    setTestStage('environment-check');
    setContextualScore(null);
    setContextualTestAnswers({});
    setEnvironmentChecked(false);
    setNoiseLevel(null);
    setUsingHeadphones(null);
  };

  const handleProceedAnyway = () => {
    setEnvironmentChecked(true);
    setTestStage('tone');
    setShowNoiseWarning(false);
    setShowHeadphoneReminder(false);
  };

  const handlePlayRandomTone = () => {
    if (isPlaying || tonePlayingStatus !== 'idle') return;
    
    // Set to listening state
    setIsPlaying(true);
    setTonePlayingStatus('listening');
    setShowResponseButtons(false);
    
    // Get current frequency
    const frequency = testSteps[currentStep - 1].frequency;
    
    // Reset any existing timers
    if (toneTimerRef.current) {
      clearTimeout(toneTimerRef.current);
    }
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }
    
    // Save volume value to ensure consistency
    const currentVolume = volume;
    prevVolume.current = currentVolume;
    
    // Play tone after random delay (0-3 seconds)
    generateRandomTimedTone(frequency, currentVolume, 3, 1)
      .then(() => {
        // Tone has been played
        setTonePlayingStatus('played');
        setShowResponseButtons(true);
        setIsPlaying(false);
      })
      .catch((error) => {
        console.error('Error playing tone:', error);
        setIsPlaying(false);
        setTonePlayingStatus('idle');
      });
    
    // Set a maximum listening time of 8 seconds
    listeningTimeoutRef.current = setTimeout(() => {
      if (tonePlayingStatus === 'listening') {
        setTonePlayingStatus('played');
        setShowResponseButtons(true);
        setIsPlaying(false);
      }
    }, 8000);
  };

  const handleResponse = async (heard: boolean) => {
    // Make sure we're in the right state
    if (tonePlayingStatus !== 'played') return;
    
    // Store this result
    const frequency = testSteps[currentStep - 1].frequency;
    const newResults = { ...results, [frequency]: heard };
    setResults(newResults);
    
    // Reset state for next test
    setTonePlayingStatus('idle');
    setShowResponseButtons(false);
    
    // Clear any lingering timeouts
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    
    // Move to next step or complete test
    if (currentStep < testSteps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Submit pure tone test results
      setLoading(true);
      try {
        // Format results for API
        const formattedResults: ToneTestResult[] = Object.keys(newResults).map(frequencyKey => ({
          frequency: parseInt(frequencyKey),
          heard: newResults[parseInt(frequencyKey)],
          intensity: Math.round(prevVolume.current * 100) // Convert volume (0-1) to intensity (0-100)
        }));
        
        // Submit to backend
        const response = await submitHearingTestResults({
          results: formattedResults
        });
        
        // Store the results for display
        setTestResults({
          score: response.overallScore,
          recommendation: response.recommendation
        });
        
        // Reset tone test state
        setCurrentStep(0);
        setIsTestComplete(true);
        
        // Move directly to speech-in-noise test
        setTestStage('speech-in-noise');
      } catch (error) {
        console.error('Error submitting test results:', error);
        alert('There was a problem submitting your test results. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartContextualTest = async () => {
    setLoading(true);
    
    try {
      // If we have available tests, select the first one
      // In a production app, we could allow the user to choose or randomly select one
      if (availableContextualTests.length > 0) {
        const testId = availableContextualTests[0].id;
        const test = await getContextualTest(testId);
        setSelectedContextualTest(test);
      } else {
        // Use fallback test if no tests available
        setSelectedContextualTest(fallbackContextualTest);
      }
      
      setShowContextualTest(true);
    } catch (error) {
      console.error('Error starting contextual test:', error);
      // Use fallback test if API fails
      setSelectedContextualTest(fallbackContextualTest);
      setShowContextualTest(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContextualTestComplete = async (score: number, maxScore: number) => {
    setContextualScore({ score, maxScore });
    setShowContextualTest(false);
    
    if (selectedContextualTest) {
      try {
        // Submit contextual test results
        const contextualResult: ContextualTestResult = {
          testId: selectedContextualTest.id,
          score,
          maxScore,
          answers: contextualTestAnswers
        };
        
        await submitContextualTestResults(contextualResult);
      } catch (error) {
        console.error('Error submitting contextual test results:', error);
      }
    }
    
    setTestStage('results');
  };

  const handleSpeechInNoiseComplete = (score: number, recommendation: string) => {
    // Update the state with the results
    setSpeechInNoiseScore(score);
    setSpeechInNoiseRecommendation(recommendation);
    setTestStage('final-results');
  };

  const handleSpeechInNoiseCancel = () => {
    setTestStage('tone');
  };

  const handleBookConsultation = () => {
    navigate('/book', { state: { selectedService: 'consultation' } });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value) / 100;
    setVolume(newVolume);
  };

  const handleSkipToResults = () => {
    setTestStage('results');
  };

  // Render the environment check
  if (testStage === 'environment-check') {
    return (
      <div className="hearing-test-page">
        <div className="test-container">
          <h2>Environment Check</h2>
          
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Checking your environment...</p>
              <p className="loading-subtitle">Please allow microphone access if prompted</p>
            </div>
          ) : (
            <>
              <div className="environment-results">
                {noiseLevel && (
                  <div className={`environment-item ${noiseLevel !== 'low' ? 'warning' : 'success'}`}>
                    <div className="environment-icon">
                      {noiseLevel === 'low' ? '✓' : '⚠️'}
                    </div>
                    <div className="environment-info">
                      <h3>Background Noise</h3>
                      <p>
                        {noiseLevel === 'low' 
                          ? 'Your environment is quiet. Perfect for the test!' 
                          : noiseLevel === 'medium'
                            ? 'Moderate background noise detected.'
                            : 'High background noise detected.'}
                      </p>
                    </div>
                  </div>
                )}
                
                {usingHeadphones !== null && (
                  <div className={`environment-item ${!usingHeadphones ? 'warning' : 'success'}`}>
                    <div className="environment-icon">
                      {usingHeadphones ? '✓' : '⚠️'}
                    </div>
                    <div className="environment-info">
                      <h3>Headphones</h3>
                      <p>
                        {usingHeadphones 
                          ? 'Headphones detected. Great!' 
                          : 'No headphones detected. For best results, please use headphones.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {showNoiseWarning && (
                <div className="warning-box">
                  <h3>Background Noise Warning</h3>
                  <p>
                    We've detected {noiseLevel === 'high' ? 'significant' : 'some'} background noise in your environment.
                    For the most accurate test results, please move to a quieter location if possible.
                  </p>
                </div>
              )}
              
              {showHeadphoneReminder && (
                <div className="warning-box">
                  <h3>Headphone Recommendation</h3>
                  <p>
                    For the most accurate hearing test results, we strongly recommend using headphones.
                    Please connect headphones if available.
                  </p>
                </div>
              )}
              
              <div className="volume-setup">
                <h3>Volume Setup</h3>
                <p>Please set your device volume to approximately 50% before continuing.</p>
                <div className="volume-indicator">
                  <div className="volume-bar">
                    <div className="volume-level" style={{ width: '50%' }}></div>
                  </div>
                  <div className="volume-marks">
                    <span>0%</span>
                    <span className="volume-target">50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              <div className="environment-actions">
                <button 
                  className="primary-button"
                  onClick={handleProceedAnyway}
                >
                  Proceed with Test
                </button>
                <button 
                  className="secondary-button"
                  onClick={() => setTestStage('intro')}
                >
                  Go Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Show speech-in-noise test
  if (testStage === 'speech-in-noise') {
    return (
      <div className="hearing-test-page">
        <div className="test-container">
          <SpeechInNoiseTest 
            onComplete={handleSpeechInNoiseComplete}
            onCancel={handleSpeechInNoiseCancel}
          />
        </div>
      </div>
    );
  }

  // Show final results with both tests
  if (testStage === 'final-results') {
    return (
      <div className="hearing-test-page">
        <div className="test-container results-container">
          <h2>Your Complete Hearing Test Results</h2>
          
          <div className="results-summary">
            <div className="test-scores">
              <div className="score-section">
                <h3>Pure Tone Test</h3>
                <div className="score-circle">
                  <span>{testResults?.score || 0}%</span>
                </div>
                <p className="recommendation">{testResults?.recommendation}</p>
              </div>
              
              <div className="score-section">
                <h3>Speech-in-Noise Test</h3>
                <div className="score-circle">
                  <span>{speechInNoiseScore || 0}%</span>
                </div>
                <p className="recommendation">{speechInNoiseRecommendation}</p>
              </div>
            </div>
            
            <div className="audiogram-section">
              <h3>Pure Tone Test Audiogram</h3>
              <AudiogramGraph 
                results={results}
                frequencies={testSteps.map(step => step.frequency)}
              />
            </div>
            
            <div className="frequency-results">
              <h3>Pure Tone Test Details</h3>
              {testSteps.map((step) => (
                <div key={step.frequency} className="frequency-item">
                  <span className="frequency-label">{step.frequency}Hz:</span>
                  <span className={`frequency-result ${results[step.frequency] ? 'heard' : 'not-heard'}`}>
                    {results[step.frequency] ? 'Heard' : 'Not Heard'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="final-actions">
              <button 
                className="primary-button"
                onClick={handleBookConsultation}
              >
                Book Medical Hearing Test
              </button>
              <button 
                className="secondary-button"
                onClick={handleStart}
              >
                Retake Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conditionally render based on the test stage
  if (testStage === 'results' || (isTestComplete && !showContextualTest)) {
    return (
      <div className="hearing-test-page">
        <div className="test-container results-container">
          <h2>Your Hearing Test Results</h2>
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Processing your results...</p>
            </div>
          ) : (
            <div className="results-summary">
              <div className="score-display">
                <div className="score-circle">
                  <span>{testResults?.score || 0}%</span>
                </div>
                <p>Pure Tone Test Score</p>
              </div>
              
              <p className="recommendation">{testResults?.recommendation || "Please consult with a professional for a more accurate assessment."}</p>
              
              <div className="frequency-results">
                <h3>Pure Tone Test Results</h3>
                {testSteps.map((step) => (
                  <div key={step.frequency} className="frequency-item">
                    <span className="frequency-label">{step.frequency}Hz:</span>
                    <span className={`frequency-result ${results[step.frequency] ? 'heard' : 'not-heard'}`}>
                      {results[step.frequency] ? 'Heard' : 'Not Heard'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="next-test">
                <h3>Next: Speech-in-Noise Test</h3>
                <p>This test will evaluate how well you can understand speech in noisy environments.</p>
                <button 
                  className="primary-button"
                  onClick={() => setTestStage('speech-in-noise')}
                >
                  Continue to Speech-in-Noise Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show contextual test
  if (showContextualTest && selectedContextualTest) {
    return (
      <div className="hearing-test-page">
        <div className="test-container">
          <ContextualHearingTest 
            test={selectedContextualTest}
            onComplete={handleContextualTestComplete}
            onCancel={handleSkipToResults}
          />
        </div>
      </div>
    );
  }

  // Intro screen
  if (testStage === 'intro') {
    return (
      <div className="hearing-test-page">
        <div className="test-intro">
          <h1>Online Hearing Test</h1>
          <div className="requirements-card">
            <h2>Before You Begin</h2>
            <ul>
              <li className="headphones-requirement">
                <span className="requirement-icon">🎧</span> 
                <span>Use headphones for accurate results</span>
              </li>
              <li className="volume-requirement">
                <span className="requirement-icon">🔊</span> 
                <span>Set your device volume to 50%</span>
              </li>
              <li className="environment-requirement">
                <span className="requirement-icon">🔇</span> 
                <span>Find a quiet environment</span>
              </li>
              <li className="time-requirement">
                <span className="requirement-icon">⏱️</span> 
                <span>The test takes about 5-10 minutes</span>
              </li>
            </ul>
            <p className="disclaimer">
              This test provides an initial screening and is not a substitute for a 
              professional hearing evaluation. For a comprehensive assessment, 
              please book a consultation with one of our specialists.
            </p>
          </div>
          <div className="test-types">
            <h3>This test has two parts:</h3>
            <div className="test-type">
              <span className="test-number">1</span>
              <div>
                <h4>Pure Tone Test</h4>
                <p>Tests your ability to hear different frequencies of sound</p>
              </div>
            </div>
            <div className="test-type">
              <span className="test-number">2</span>
              <div>
                <h4>Speech-in-Noise Test</h4>
                <p>Tests your ability to understand speech in noisy environments</p>
              </div>
            </div>
          </div>
          <button className="start-button" onClick={handleStart}>
            Start Test
          </button>
        </div>
      </div>
    );
  }

  // Main tone test
  return (
    <div className="hearing-test-page">
      <div className="test-container">
        <div className="test-step">
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${((currentStep - 1) / testSteps.length) * 100}%` }}
            />
          </div>
          
          <h2>Pure Tone Test: Step {currentStep} of {testSteps.length}</h2>
          <p className="frequency-description">
            Testing {testSteps[currentStep - 1].frequency}Hz: {testSteps[currentStep - 1].description}
          </p>

          <div className="volume-control">
            <label htmlFor="volume-slider">Volume</label>
            <input 
              type="range" 
              id="volume-slider" 
              min="0" 
              max="100" 
              value={volume * 100} 
              onChange={handleVolumeChange}
              disabled={isPlaying || tonePlayingStatus !== 'idle'}
            />
            <div className="volume-marks">
              <span>0%</span>
              <span className="volume-target">50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="test-controls">
            {tonePlayingStatus === 'idle' && (
              <div className="instruction-box">
                <p>
                  Click "Listen" and pay close attention. A tone may play at any moment within 
                  the next few seconds. Don't adjust your volume once the test starts.
                </p>
                <button 
                  className="play-button"
                  onClick={handlePlayRandomTone}
                  disabled={isPlaying}
                >
                  Listen
                </button>
              </div>
            )}
            
            {tonePlayingStatus === 'listening' && (
              <div className="listening-indicator">
                <div className="pulse-animation"></div>
                <p>Listening carefully...</p>
              </div>
            )}

            {showResponseButtons && (
              <div className="response-buttons">
                <p>Did you hear a sound?</p>
                <div className="button-group">
                  <button 
                    className="response-button yes"
                    onClick={() => handleResponse(true)}
                  >
                    Yes
                  </button>
                  <button 
                    className="response-button no"
                    onClick={() => handleResponse(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HearingTestPage; 
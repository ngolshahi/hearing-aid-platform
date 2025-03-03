import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HearingTestPage.css';

interface TestStep {
  frequency: number;
  description: string;
}

const HearingTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [isTestComplete, setIsTestComplete] = useState(false);

  const testSteps: TestStep[] = [
    { frequency: 250, description: "Low frequency sounds like thunder or bass drums" },
    { frequency: 500, description: "Lower frequencies of human speech" },
    { frequency: 1000, description: "Mid-range speech sounds" },
    { frequency: 2000, description: "Higher speech sounds like women's and children's voices" },
    { frequency: 4000, description: "High frequency sounds like birds chirping" },
    { frequency: 8000, description: "Very high frequency sounds" }
  ];

  const handleStart = () => {
    setCurrentStep(0);
    setResults({});
    setIsTestComplete(false);
  };

  const handlePlaySound = () => {
    setIsPlaying(true);
    // Simulated sound playing - will be implemented with backend
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  const handleResponse = (heard: boolean) => {
    const newResults = { ...results, [testSteps[currentStep].frequency]: heard };
    setResults(newResults);

    if (currentStep < testSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsTestComplete(true);
    }
  };

  const handleBookConsultation = () => {
    navigate('/book', { state: { selectedService: 'consultation' } });
  };

  if (isTestComplete) {
    return (
      <div className="hearing-test-page">
        <div className="test-container results-container">
          <h2>Your Hearing Test Results</h2>
          <div className="results-summary">
            <p>Based on your responses, here's a summary of your hearing:</p>
            <div className="frequency-results">
              {testSteps.map((step) => (
                <div key={step.frequency} className="frequency-item">
                  <span className="frequency-label">{step.frequency}Hz:</span>
                  <span className={`frequency-result ${results[step.frequency] ? 'heard' : 'not-heard'}`}>
                    {results[step.frequency] ? 'Heard' : 'Not Heard'}
                  </span>
                </div>
              ))}
            </div>
            <div className="recommendation">
              <h3>Recommendation</h3>
              <p>
                For a comprehensive evaluation of your hearing health, we recommend booking
                a professional consultation with our hearing specialists.
              </p>
              <div className="action-buttons">
                <button className="primary-button" onClick={handleBookConsultation}>
                  Book Professional Consultation
                </button>
                <button className="secondary-button" onClick={handleStart}>
                  Retake Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hearing-test-page">
      {currentStep === 0 && (
        <div className="test-intro">
          <h1>Online Hearing Test</h1>
          <div className="requirements-card">
            <h2>Before You Begin</h2>
            <ul>
              <li>Find a quiet environment</li>
              <li>Use headphones for best results</li>
              <li>Set your device volume to 50%</li>
              <li>The test takes about 5 minutes</li>
            </ul>
          </div>
        </div>
      )}

      <div className="test-container">
        {currentStep === 0 ? (
          <button className="start-button" onClick={handleStart}>
            Start Test
          </button>
        ) : (
          <div className="test-step">
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${(currentStep / testSteps.length) * 100}%` }}
              />
            </div>
            
            <h2>Step {currentStep} of {testSteps.length}</h2>
            <p className="frequency-description">
              {testSteps[currentStep - 1].description}
            </p>

            <div className="test-controls">
              <button 
                className={`play-button ${isPlaying ? 'playing' : ''}`}
                onClick={handlePlaySound}
                disabled={isPlaying}
              >
                {isPlaying ? 'Playing...' : 'Play Sound'}
              </button>

              <div className="response-buttons">
                <p>Did you hear the sound?</p>
                <div className="button-group">
                  <button 
                    className="response-button yes"
                    onClick={() => handleResponse(true)}
                    disabled={isPlaying}
                  >
                    Yes
                  </button>
                  <button 
                    className="response-button no"
                    onClick={() => handleResponse(false)}
                    disabled={isPlaying}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HearingTestPage; 
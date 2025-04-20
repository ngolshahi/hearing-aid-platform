import { API_BASE_URL } from './config';
import { SpeechConfig, SpeechSynthesizer, AudioConfig, ResultReason, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

export interface ToneTestResult {
  frequency: number;
  heard: boolean;
  intensity: number;
}

export interface HearingTestRequest {
  userId?: string;
  results: ToneTestResult[];
}

export interface HearingTestResponse {
  testId: string;
  overallScore: number;
  recommendation: string;
}

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

export interface ContextualTestResult {
  userId?: string;
  testId: string;
  score: number;
  maxScore: number;
  answers: Record<string, number>;
}

export interface CompleteHearingTestResult {
  userId?: string;
  toneResults: ToneTestResult[];
  contextualResult?: ContextualTestResult;
  toneScore: number;
  recommendation?: string;
}

export interface SpeechInNoiseTest {
  id: string;
  sentences: string[];
  noiseLevel: 'low' | 'medium' | 'high';
  noiseType: 'cafe' | 'street' | 'restaurant';
}

export interface SpeechInNoiseResult {
  sentence: string;
  recognizedText: string;
  isCorrect: boolean;
}

export interface SpeechInNoiseTestRequest {
  userId?: string;
  results: SpeechInNoiseResult[];
  noiseLevel: 'low' | 'medium' | 'high';
  noiseType: 'cafe' | 'street' | 'restaurant';
}

export interface SpeechInNoiseTestResponse {
  testId: string;
  overallScore: number;
  recommendation: string;
}

/**
 * Submit hearing test results to the backend
 */
export const submitHearingTestResults = async (testData: HearingTestRequest): Promise<HearingTestResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hearing-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit hearing test results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting hearing test results:', error);
    throw error;
  }
};

/**
 * Get hearing test history for a user
 */
export const getHearingTestHistory = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hearing-test/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to retrieve hearing test history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error retrieving hearing test history:', error);
    throw error;
  }
};

/**
 * Get available contextual tests
 */
export const getContextualTests = async (): Promise<ContextualTest[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hearing-test/contextual`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to retrieve contextual tests');
    }

    return await response.json();
  } catch (error) {
    console.error('Error retrieving contextual tests:', error);
    throw error;
  }
};

/**
 * Get a specific contextual test by ID
 */
export const getContextualTest = async (testId: string): Promise<ContextualTest> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hearing-test/contextual/${testId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to retrieve contextual test');
    }

    return await response.json();
  } catch (error) {
    console.error('Error retrieving contextual test:', error);
    throw error;
  }
};

/**
 * Submit contextual test results
 */
export const submitContextualTestResults = async (testResult: ContextualTestResult): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hearing-test/contextual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testResult),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit contextual test results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting contextual test results:', error);
    throw error;
  }
};

/**
 * Submit complete hearing test results
 */
export const submitCompleteHearingTest = async (testResult: CompleteHearingTestResult): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hearing-test/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testResult),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit complete hearing test results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting complete hearing test results:', error);
    throw error;
  }
};

/**
 * Generate a tone at the specified frequency and volume with random timing
 * @param frequency - Frequency of the tone in Hz
 * @param volume - Volume from 0 to 1
 * @param maxWaitTime - Maximum time to wait before playing the tone (in seconds)
 * @param duration - Duration of the tone in seconds
 * @returns Promise that resolves when the tone is finished playing
 */
export const generateRandomTimedTone = (
  frequency: number, 
  volume: number = 0.5, 
  maxWaitTime: number = 3,
  duration: number = 1
): Promise<void> => {
  return new Promise((resolve) => {
    try {
      // Random wait time between 0 and maxWaitTime seconds
      const waitTime = Math.random() * maxWaitTime * 1000;
      
      setTimeout(() => {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Set oscillator properties
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        // Set volume (0 to 1)
        gainNode.gain.value = volume;
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start and stop the oscillator
        oscillator.start();
        
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
          resolve();
        }, duration * 1000);
      }, waitTime);
    } catch (error) {
      console.error('Error generating tone:', error);
      resolve(); // Resolve anyway to continue the test
    }
  });
};

/**
 * Generate a tone at the specified frequency and volume
 * @deprecated Use generateRandomTimedTone instead for more accurate testing
 */
export const generateTone = (frequency: number, volume: number = 0.5, duration: number = 2): Promise<void> => {
  return new Promise((resolve) => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Set oscillator properties
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      // Set volume (0 to 1)
      gainNode.gain.value = volume;
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start tone and stop after duration
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        resolve();
      }, duration * 1000);
    } catch (error) {
      console.error('Error generating tone:', error);
      resolve(); // Resolve anyway to continue the test
    }
  });
};

/**
 * Detect background noise level using the microphone
 * @returns Promise that resolves to a noise level: 'low', 'medium', or 'high'
 */
export const detectBackgroundNoise = async (): Promise<'low' | 'medium' | 'high'> => {
  return new Promise(async (resolve) => {
    try {
      // Check if the API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia API not supported, assuming medium noise level');
        resolve('medium');
        return;
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      // Connect microphone to analyzer
      microphone.connect(analyzer);
      
      // Configure analyzer
      analyzer.fftSize = 256;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Sample the volume multiple times
      let sampleCount = 0;
      let totalVolume = 0;
      
      const sampleInterval = setInterval(() => {
        // Get volume data
        analyzer.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avgVolume = sum / bufferLength;
        
        totalVolume += avgVolume;
        sampleCount++;
        
        // After 10 samples, determine noise level
        if (sampleCount >= 10) {
          clearInterval(sampleInterval);
          
          // Stop microphone
          stream.getTracks().forEach(track => track.stop());
          
          // Calculate final average
          const finalAvg = totalVolume / sampleCount;
          
          // Determine noise level
          let noiseLevel: 'low' | 'medium' | 'high';
          if (finalAvg < 20) {
            noiseLevel = 'low';
          } else if (finalAvg < 50) {
            noiseLevel = 'medium';
          } else {
            noiseLevel = 'high';
          }
          
          resolve(noiseLevel);
        }
      }, 100);
      
      // Timeout after 3 seconds if something goes wrong
      setTimeout(() => {
        clearInterval(sampleInterval);
        if (sampleCount === 0) {
          resolve('medium'); // Default if detection fails
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error detecting background noise:', error);
      resolve('medium'); // Default if permission denied or error
    }
  });
};

/**
 * Check if user is using headphones
 * This is a best-effort detection and not 100% reliable
 * @returns Promise that resolves to a boolean indicating if headphones are likely being used
 */
export const detectHeadphones = async (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    try {
      // Check if the API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('MediaDevices API not supported, assuming no headphones');
        resolve(false);
        return;
      }
      
      // Try to get the list of audio output devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
      
      // If we have multiple audio outputs and at least one has "headphone" in the name
      const hasHeadphones = audioOutputDevices.some(device => 
        device.label.toLowerCase().includes('headphone') || 
        device.label.toLowerCase().includes('earphone') ||
        device.label.toLowerCase().includes('headset')
      );
      
      if (hasHeadphones) {
        resolve(true);
        return;
      }
      
      // If we couldn't detect from device names, try a heuristic approach
      // This is much less reliable, but can sometimes help
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      
      oscillator.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // Laptop/desktop speakers typically have poor bass response
      // So we test with a very low frequency that headphones can reproduce better
      oscillator.frequency.value = 40; // 40 Hz, very low bass
      oscillator.type = 'sine';
      
      // Check the frequency response
      analyser.fftSize = 1024;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Play a very short tone
      oscillator.start();
      
      setTimeout(() => {
        analyser.getByteFrequencyData(dataArray);
        oscillator.stop();
        audioContext.close();
        
        // Look at the bass response in the first few frequency bins
        const bassResponse = dataArray.slice(0, 5).reduce((sum, val) => sum + val, 0) / 5;
        
        // This is a very rough heuristic - if bass response is good, likely headphones
        resolve(bassResponse > 50);
      }, 200);
      
    } catch (error) {
      console.error('Error detecting headphones:', error);
      resolve(false); // Default to assuming no headphones if detection fails
    }
  });
};

// Azure Speech Service configuration
const speechConfig = SpeechConfig.fromSubscription(
  import.meta.env.VITE_AZURE_SPEECH_KEY || '',
  import.meta.env.VITE_AZURE_SPEECH_REGION || ''
);

// Function to play a sentence with background noise
export const playSpeechInNoise = async (
  sentence: string,
  noiseLevel: 'low' | 'medium' | 'high',
  noiseType: 'cafe' | 'street' | 'restaurant'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create audio config for output
      const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

      // Load background noise audio
      const noiseAudio = new Audio(`/audio/noise/${noiseType}-${noiseLevel}.mp3`);
      noiseAudio.loop = true;
      noiseAudio.volume = getNoiseVolume(noiseLevel);

      // Start playing background noise
      noiseAudio.play();

      // Synthesize and play the speech
      synthesizer.speakTextAsync(
        sentence,
        (result) => {
          if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            // Stop background noise after speech is complete
            noiseAudio.pause();
            noiseAudio.currentTime = 0;
            synthesizer.close();
            resolve();
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
    } catch (error) {
      reject(error);
    }
  });
};

// Function to recognize speech
export const recognizeSpeech = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === ResultReason.RecognizedSpeech) {
            resolve(result.text);
          } else {
            reject(new Error('Speech recognition failed'));
          }
          recognizer.close();
        },
        (error) => {
          recognizer.close();
          reject(error);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to get noise volume based on level
const getNoiseVolume = (level: 'low' | 'medium' | 'high'): number => {
  switch (level) {
    case 'low':
      return 0.3;
    case 'medium':
      return 0.5;
    case 'high':
      return 0.7;
    default:
      return 0.5;
  }
};

// Function to submit speech-in-noise test results
export const submitSpeechInNoiseTest = async (
  testData: SpeechInNoiseTestRequest
): Promise<SpeechInNoiseTestResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hearing-test/speech-in-noise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit speech-in-noise test results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting speech-in-noise test results:', error);
    throw error;
  }
}; 
import React, { useState } from 'react';
import '../styles/Quiz.css';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface QuizProps {
  type: 'appointment' | 'hearing-aid';
  onClose: () => void;
  onComplete: (results: any) => void;
}

const appointmentQuestions: QuizQuestion[] = [
  {
    id: '1',
    text: 'What is your main concern regarding your hearing?',
    options: [
      { id: 'difficulty', text: 'I have difficulty hearing in certain situations' },
      { id: 'wax', text: 'I think I might have ear wax buildup' },
      { id: 'tinnitus', text: 'I experience ringing or buzzing in my ears' },
      { id: 'existing', text: 'I need help with my existing hearing aids' },
    ],
  },
  {
    id: '2',
    text: 'How long have you been experiencing this?',
    options: [
      { id: 'recent', text: 'Recently (within the last month)' },
      { id: 'few-months', text: 'A few months' },
      { id: 'long-time', text: 'A long time (more than a year)' },
      { id: 'varies', text: 'It comes and goes' },
    ],
  },
  {
    id: '3',
    text: 'Have you had a hearing test before?',
    options: [
      { id: 'never', text: 'No, never' },
      { id: 'recent', text: 'Yes, within the last year' },
      { id: 'old', text: 'Yes, but it was more than a year ago' },
      { id: 'unsure', text: 'I\'m not sure' },
    ],
  }
];

const hearingAidQuestions: QuizQuestion[] = [
  {
    id: '1',
    text: 'What type of hearing aid are you looking for?',
    options: [
      { id: 'ite', text: 'In-the-Ear (ITE) - Fits in the outer ear' },
      { id: 'bte', text: 'Behind-the-Ear (BTE) - Sits behind the ear' },
      { id: 'itc', text: 'In-the-Canal (ITC) - Fits partially in ear canal' },
      { id: 'cic', text: 'Completely-in-Canal (CIC) - Nearly invisible in ear canal' },
      { id: 'any', text: 'I\'m not sure - Show me all options' },
    ],
  },
  {
    id: '2',
    text: 'Do you have a preferred hearing aid brand?',
    options: [
      { id: 'phonak', text: 'Phonak - Known for innovative technology' },
      { id: 'oticon', text: 'Oticon - Specializes in premium solutions' },
      { id: 'starkey', text: 'Starkey - Leaders in custom hearing aids' },
      { id: 'resound', text: 'ReSound - Experts in natural sound' },
      { id: 'any', text: 'No preference - Show me all brands' },
    ],
  },
  {
    id: '3',
    text: 'What color would you prefer?',
    options: [
      { id: 'beige', text: 'Beige - Classic and subtle' },
      { id: 'black', text: 'Black - Modern and sleek' },
      { id: 'silver', text: 'Silver - Contemporary and stylish' },
      { id: 'brown', text: 'Brown - Natural and discreet' },
      { id: 'any', text: 'No preference - Show me all colors' },
    ],
  },
  {
    id: '4',
    text: 'What is your budget range for hearing aids?',
    options: [
      { id: 'budget', text: '£500 - £1,500 (Basic features)' },
      { id: 'mid', text: '£1,500 - £2,500 (Mid-range features)' },
      { id: 'premium', text: '£2,500 - £4,000 (Premium features)' },
      { id: 'luxury', text: '£4,000+ (Top-of-the-line technology)' },
      { id: 'any', text: 'Show me all price ranges' },
    ],
  }
];

const Quiz: React.FC<QuizProps> = ({ type, onClose, onComplete }) => {
  const questions = type === 'appointment' ? appointmentQuestions : hearingAidQuestions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Process results
      const results = processQuizResults(type, answers);
      onComplete(results);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const processQuizResults = (quizType: string, answers: Record<string, string>) => {
    if (quizType === 'hearing-aid') {
      const results = {
        types: [] as string[],
        brands: [] as string[],
        colors: [] as string[],
        priceRange: [0, 5000] as [number, number]
      };

      // Map hearing aid types
      const typeMap: Record<string, string> = {
        'ite': 'In-the-Ear (ITE)',
        'bte': 'Behind-the-Ear (BTE)',
        'itc': 'In-the-Canal (ITC)',
        'cic': 'Completely-in-Canal (CIC)'
      };
      if (answers['1'] !== 'any' && typeMap[answers['1']]) {
        results.types.push(typeMap[answers['1']]);
      }

      // Map brands
      const brandMap: Record<string, string> = {
        'phonak': 'Phonak',
        'oticon': 'Oticon',
        'starkey': 'Starkey',
        'resound': 'ReSound'
      };
      if (answers['2'] !== 'any' && brandMap[answers['2']]) {
        results.brands.push(brandMap[answers['2']]);
      }

      // Map colors
      const colorMap: Record<string, string> = {
        'beige': 'Beige',
        'black': 'Black',
        'silver': 'Silver',
        'brown': 'Brown'
      };
      if (answers['3'] !== 'any' && colorMap[answers['3']]) {
        results.colors.push(colorMap[answers['3']]);
      }

      // Map price ranges
      switch (answers['4']) {
        case 'budget':
          results.priceRange = [500, 1500];
          break;
        case 'mid':
          results.priceRange = [1500, 2500];
          break;
        case 'premium':
          results.priceRange = [2500, 4000];
          break;
        case 'luxury':
          results.priceRange = [4000, 5000];
          break;
        // 'any' will keep the default [0, 5000]
      }

      return results;
    } else {
      // Map appointment quiz answers to appointment types based on multiple questions
      if (answers['1'] === 'wax') {
        return { appointmentType: 'wax-removal' };
      }
      if (answers['1'] === 'existing') {
        return { appointmentType: 'aftercare' };
      }
      if (answers['1'] === 'difficulty' || answers['1'] === 'tinnitus') {
        if (answers['3'] === 'never' || answers['3'] === 'old') {
          return { appointmentType: 'consultation' };
        }
        if (answers['3'] === 'recent') {
          return { appointmentType: 'fitting' };
        }
      }
      
      // Default to consultation if no clear match
      return { appointmentType: 'consultation' };
    }
  };

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="quiz-modal">
        <div className="quiz-header">
          <h1>{type === 'appointment' ? 'Find Your Ideal Service' : 'Find Your Perfect Hearing Aid'}</h1>
          <button className="quiz-close" onClick={onClose}>×</button>
        </div>

        <div className="quiz-content">
          <div className="quiz-question">
            <h2>{currentQuestionData.text}</h2>
            <div className="quiz-options">
              {currentQuestionData.options.map(option => (
                <button
                  key={option.id}
                  className={`quiz-option-button ${answers[currentQuestionData.id] === option.id ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(currentQuestionData.id, option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="quiz-footer">
          <div className="quiz-progress">
            <span>{currentQuestion + 1} of {questions.length}</span>
            <div className="quiz-progress-bar">
              <div 
                className="quiz-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="button-group">
            {currentQuestion > 0 && (
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
            )}
            <button
              className="next-button"
              onClick={handleNext}
              disabled={!answers[currentQuestionData.id]}
            >
              {currentQuestion === questions.length - 1 ? 'See Results' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;

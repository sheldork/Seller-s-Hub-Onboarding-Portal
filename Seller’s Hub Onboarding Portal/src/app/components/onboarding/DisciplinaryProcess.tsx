import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { toast } from 'sonner';
import { serverUrl } from '../../supabaseClient';
import { publicAnonKey } from '/utils/supabase/info';
import ProgressBar from '../ProgressBar';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const offenses = [
  {
    type: 'Minor Offenses',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    examples: [
      'Tardiness (up to 3 times)',
      'Minor dress code violations',
      'Unexcused absence (first occurrence)',
      'Minor safety violations',
    ]
  },
  {
    type: 'Medium Offenses',
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    examples: [
      'Repeated tardiness (4-6 times)',
      'Insubordination',
      'Failure to follow procedures',
      'Disrespectful behavior',
    ]
  },
  {
    type: 'Major Offenses',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    examples: [
      'Theft or fraud',
      'Workplace harassment',
      'Gross negligence',
      'Falsification of records',
      'Serious safety violations'
    ]
  }
];

const processSteps = [
  {
    title: 'Violation Occurs',
    description: 'An offense or policy violation is identified'
  },
  {
    title: 'Evidence Gathering',
    description: 'Documentation and witness statements collected'
  },
  {
    title: 'Initial Report',
    description: 'Incident reported to immediate supervisor or HR'
  },
  {
    title: 'Review & Investigation',
    description: 'Management reviews evidence and conducts investigation'
  },
  {
    title: 'Employee Notification',
    description: 'Employee is informed and given opportunity to respond'
  },
  {
    title: 'Decision & Action',
    description: 'Appropriate disciplinary action determined and implemented'
  }
];

export default function DisciplinaryProcess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    if (flippedCards.includes(index)) {
      setFlippedCards(flippedCards.filter(i => i !== index));
    } else {
      setFlippedCards([...flippedCards, index]);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/onboarding/progress/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ 
          step_completed: 5,
          completed_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('Onboarding completed successfully!');
        navigate(`/workmate/${id}`);
      } else {
        toast.error('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <ProgressBar currentStep={5} totalSteps={5} />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Offenses & Disciplinary Process</h1>
          <p className="text-gray-600">Understanding our policies and procedures</p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Types of Offenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offenses.map((offense, index) => {
              const Icon = offense.icon;
              const isFlipped = flippedCards.includes(index);

              return (
                <div
                  key={index}
                  className="relative h-64 cursor-pointer"
                  onClick={() => toggleCard(index)}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="relative w-full h-full transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front */}
                    <Card
                      className={`absolute w-full h-full ${offense.borderColor} border-2`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <CardContent className={`p-6 h-full flex flex-col items-center justify-center ${offense.bgColor}`}>
                        <Icon className={`w-16 h-16 ${offense.color} mb-4`} />
                        <h3 className="text-xl font-bold text-center">{offense.type}</h3>
                        <p className="text-sm text-gray-600 mt-2">Click to view examples</p>
                      </CardContent>
                    </Card>

                    {/* Back */}
                    <Card
                      className={`absolute w-full h-full ${offense.borderColor} border-2`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <CardContent className={`p-6 h-full ${offense.bgColor}`}>
                        <h3 className={`text-lg font-bold mb-3 ${offense.color}`}>Examples:</h3>
                        <ul className="space-y-2">
                          {offense.examples.map((example, idx) => (
                            <li key={idx} className="text-sm flex items-start">
                              <span className="mr-2">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Disciplinary Process Timeline</h2>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4"
                      style={{ backgroundColor: '#FBB704' }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                    {index < processSteps.length - 1 && (
                      <div className="ml-5 h-12 border-l-2 border-gray-300 -mb-6"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-green-500 border-2">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-2xl font-bold">Onboarding Complete!</h3>
            </div>
            <p className="text-gray-700 mb-4">
              You have successfully completed all onboarding steps. Please proceed to the next step 
              as advised by the Recruitment Team.
            </p>
            <p className="text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg">
              <strong>Next Steps:</strong> Contact your supervisor or the HR department for your 
              official start date and any additional requirements before beginning your role.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/workmate/${id}`)}
            disabled={loading}
          >
            Return Home
          </Button>
          <Button
            onClick={handleComplete}
            style={{ backgroundColor: '#FBB704' }}
            disabled={loading}
          >
            {loading ? 'Completing...' : 'Complete Onboarding'}
          </Button>
        </div>
      </div>
    </div>
  );
}

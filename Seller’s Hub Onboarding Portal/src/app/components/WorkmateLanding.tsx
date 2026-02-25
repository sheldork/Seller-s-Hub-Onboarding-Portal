import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { serverUrl } from '../supabaseClient';
import { publicAnonKey } from '/utils/supabase/info';
import { CheckCircle2, Circle, LogOut } from 'lucide-react';

export default function WorkmateLanding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workmate, setWorkmate] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [video, setVideo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch workmate
      const wmResponse = await fetch(`${serverUrl}/workmate/${id}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const wmData = await wmResponse.json();

      if (!wmResponse.ok) {
        toast.error('Workmate not found');
        navigate('/');
        return;
      }

      setWorkmate(wmData.workmate);

      // Fetch progress
      const progResponse = await fetch(`${serverUrl}/onboarding/progress/${id}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const progData = await progResponse.json();

      if (progResponse.ok) {
        setProgress(progData.progress);
      }

      // Fetch video
      const videoResponse = await fetch(`${serverUrl}/video/current`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const videoData = await videoResponse.json();
      setVideo(videoData.video);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const step = progress?.step_completed || 1;
    
    if (step === 1) {
      navigate(`/onboarding/${id}/rules`);
    } else if (step === 2) {
      navigate(`/onboarding/${id}/video`);
    } else if (step === 3) {
      navigate(`/onboarding/${id}/quiz`);
    } else if (step === 4) {
      navigate(`/onboarding/${id}/discipline`);
    } else if (step === 5) {
      toast.info('You have completed all onboarding steps!');
    }
  };

  const getStepStatus = (stepNumber: number) => {
    const current = progress?.step_completed || 1;
    if (stepNumber < current) return 'completed';
    if (stepNumber === current) return 'current';
    return 'pending';
  };

  const steps = [
    { number: 1, name: 'Workmate Entry' },
    { number: 2, name: 'Company Rules' },
    { number: 3, name: 'Training Video' },
    { number: 4, name: 'Knowledge Check' },
    { number: 5, name: 'Disciplinary Process' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentStep = progress?.step_completed || 1;
  const progressPercent = ((currentStep - 1) / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome to Seller's Hub</h1>
            <p className="text-gray-600 mt-2">Complete your onboarding journey</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workmate Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{workmate?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-semibold">{workmate?.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold">{workmate?.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Step {currentStep} of 5</span>
                    <span className="text-sm font-semibold">{progressPercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
                {progress?.quiz_passed && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    <span className="text-sm">Quiz Passed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                {video ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    <span>Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <Circle className="w-5 h-5 mr-2" />
                    <span>Not available</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Onboarding Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step) => {
                const status = getStepStatus(step.number);
                return (
                  <div
                    key={step.number}
                    className={`flex items-center p-4 rounded-lg border-2 ${
                      status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : status === 'current'
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 mr-4" />
                    ) : (
                      <Circle
                        className={`w-6 h-6 mr-4 ${
                          status === 'current' ? 'text-yellow-600' : 'text-gray-400'
                        }`}
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">Step {step.number}: {step.name}</p>
                      <p className="text-sm text-gray-600">
                        {status === 'completed' ? 'Completed' : status === 'current' ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={handleContinue}
            className="flex-1"
            style={{ backgroundColor: '#FBB704' }}
            disabled={progress?.step_completed === 5 && progress?.completed_at}
          >
            {progress?.step_completed === 5 && progress?.completed_at
              ? 'Onboarding Complete'
              : 'Continue Onboarding'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}

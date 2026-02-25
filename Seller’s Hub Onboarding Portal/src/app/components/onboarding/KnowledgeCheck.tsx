import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { serverUrl } from '../../supabaseClient';
import { publicAnonKey } from '/utils/supabase/info';
import ProgressBar from '../ProgressBar';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function KnowledgeCheck() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${serverUrl}/quiz/questions`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        toast.error('No quiz questions available');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load quiz');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const submissionData = questions.map(q => ({
        question_id: q.id,
        selected_option_id: answers[q.id]
      }));

      const response = await fetch(`${serverUrl}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          workmate_id: id,
          answers: submissionData
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.passed) {
          toast.success(`Congratulations! You passed with ${data.percentage}%`);
        } else {
          toast.error(`You scored ${data.percentage}%. Please try again.`);
        }
      } else {
        toast.error(data.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    navigate(`/onboarding/${id}/discipline`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <ProgressBar currentStep={4} totalSteps={5} />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Knowledge Check</h1>
          <p className="text-gray-600">Test your understanding</p>
        </div>

        {result && (
          <Card className={`mb-8 ${result.passed ? 'border-green-500' : 'border-red-500'} border-2`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {result.passed ? (
                    <CheckCircle2 className="w-12 h-12 text-green-600 mr-4" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-600 mr-4" />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold">
                      {result.passed ? 'Passed!' : 'Not Passed'}
                    </h3>
                    <p className="text-gray-600">
                      Score: {result.score} / {result.total} ({result.percentage}%)
                    </p>
                  </div>
                </div>
              </div>

              {result.passed && (
                <div className="mt-4">
                  <Button
                    onClick={handleNext}
                    style={{ backgroundColor: '#FBB704' }}
                    className="w-full"
                  >
                    Continue to Next Step
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">No Questions Available</h3>
              <p className="text-gray-600">
                Quiz questions have not been set up yet. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 mb-8">
            {questions.map((question, index) => {
              const selectedAnswer = result?.answers?.find((a: any) => a.question_id === question.id);
              
              return (
                <Card key={question.id}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Question {index + 1}: {question.question_text}
                    </h3>

                    <RadioGroup
                      value={answers[question.id] || ''}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                      disabled={!!result}
                    >
                      {question.quiz_options?.map((option: any) => {
                        const isSelected = answers[question.id] === option.id;
                        const isCorrect = option.is_correct;
                        const showFeedback = result && isSelected;

                        return (
                          <div
                            key={option.id}
                            className={`flex items-center space-x-2 p-3 rounded-lg border ${
                              showFeedback
                                ? isCorrect
                                  ? 'bg-green-50 border-green-500'
                                  : 'bg-red-50 border-red-500'
                                : 'border-gray-200'
                            }`}
                          >
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                              {option.option_text}
                            </Label>
                            {showFeedback && (
                              isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/workmate/${id}`)}
            disabled={submitting}
          >
            Back to Dashboard
          </Button>
          {!result && questions.length > 0 && (
            <Button
              onClick={handleSubmit}
              style={{ backgroundColor: '#FBB704' }}
              disabled={submitting || Object.keys(answers).length !== questions.length}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

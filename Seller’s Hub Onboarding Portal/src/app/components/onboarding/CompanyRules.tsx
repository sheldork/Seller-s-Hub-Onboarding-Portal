import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { toast } from 'sonner';
import { serverUrl } from '../../supabaseClient';
import { publicAnonKey } from '/utils/supabase/info';
import ProgressBar from '../ProgressBar';

export default function CompanyRules() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/onboarding/progress/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ step_completed: 2 })
      });

      if (response.ok) {
        toast.success('Step completed!');
        navigate(`/onboarding/${id}/video`);
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
      <div className="max-w-4xl mx-auto">
        <ProgressBar currentStep={2} totalSteps={5} />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Rules</h1>
          <p className="text-gray-600">Understanding our foundation</p>
        </div>

        <div className="space-y-6 mb-8">
          <Card style={{ borderLeft: '4px solid #FBB704' }}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Seller's Hub! We are committed to creating a workplace where every team member can thrive. 
                This onboarding portal will help you understand our expectations, culture, and the values that drive 
                our success. Your role is essential to achieving our collective goals.
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderLeft: '4px solid #FBB704' }}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Your Role Matters</h2>
              <p className="text-gray-700 leading-relaxed">
                Every position at Seller's Hub contributes to our overall success. Whether you're part of our sales team, 
                logistics, production, or support services, your work directly impacts our ability to deliver excellence 
                to our customers. We expect professionalism, dedication, and a commitment to continuous improvement from 
                every team member.
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderLeft: '4px solid #FBB704' }}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Core Values</h2>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Integrity</h3>
                  <p className="text-gray-700">
                    We operate with honesty and transparency in all our interactions. Our reputation is built on trust, 
                    and we expect every team member to uphold the highest ethical standards.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Driven</h3>
                  <p className="text-gray-700">
                    We are motivated by results and dedicated to achieving our goals. Excellence is not just expected; 
                    it's a standard we hold ourselves to every day.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Ownership</h3>
                  <p className="text-gray-700">
                    Take responsibility for your work and decisions. We empower our team members to act with autonomy 
                    while being accountable for outcomes.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Learner</h3>
                  <p className="text-gray-700">
                    Continuous learning and improvement are essential. We encourage curiosity, embrace feedback, and 
                    invest in developing our skills and knowledge.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/workmate/${id}`)}
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={handleNext}
            style={{ backgroundColor: '#FBB704' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Next: Training Video'}
          </Button>
        </div>
      </div>
    </div>
  );
}

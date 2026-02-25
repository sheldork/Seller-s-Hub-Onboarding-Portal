import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { toast } from 'sonner';
import { serverUrl } from '../../supabaseClient';
import { publicAnonKey } from '/utils/supabase/info';
import ProgressBar from '../ProgressBar';
import { PlayCircle } from 'lucide-react';

export default function TrainingVideo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [video, setVideo] = useState<any>(null);
  const [videoCompleted, setVideoCompleted] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, []);

  const fetchVideo = async () => {
    try {
      const response = await fetch(`${serverUrl}/video/current`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();

      if (data.video) {
        setVideo(data.video);
      } else {
        toast.error('No training video available');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching video:', error);
      toast.error('Failed to load video');
      setLoading(false);
    }
  };

  const handleVideoComplete = () => {
    setVideoCompleted(true);
    toast.success('Video marked as complete');
  };

  const handleNext = async () => {
    if (!videoCompleted) {
      toast.error('Please watch the complete video before proceeding');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${serverUrl}/onboarding/progress/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ step_completed: 3 })
      });

      if (response.ok) {
        toast.success('Step completed!');
        navigate(`/onboarding/${id}/quiz`);
      } else {
        toast.error('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <ProgressBar currentStep={3} totalSteps={5} />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Training Video</h1>
          <p className="text-gray-600">Watch the complete training session</p>
        </div>

        {video ? (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">{video.title}</h2>
              
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <iframe
                  src={video.embed_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {!videoCompleted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    Please watch the complete video before proceeding to the next step.
                  </p>
                </div>
              )}

              <Button
                onClick={handleVideoComplete}
                variant={videoCompleted ? 'outline' : 'default'}
                className="w-full"
                style={!videoCompleted ? { backgroundColor: '#FBB704' } : {}}
                disabled={videoCompleted}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {videoCompleted ? 'Video Completed ✓' : 'Mark Video as Complete'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-12 text-center">
              <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Video Available</h3>
              <p className="text-gray-600">
                The training video has not been uploaded yet. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        )}

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
            disabled={!videoCompleted || saving}
          >
            {saving ? 'Saving...' : 'Next: Knowledge Check'}
          </Button>
        </div>
      </div>
    </div>
  );
}

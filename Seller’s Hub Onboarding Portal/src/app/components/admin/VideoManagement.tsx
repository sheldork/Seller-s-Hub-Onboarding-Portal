import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { serverUrl, supabase } from '../../supabaseClient';
import AdminLayout from './AdminLayout';
import { Video, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VideoManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    embed_url: ''
  });

  useEffect(() => {
    fetchCurrentVideo();
  }, []);

  const fetchCurrentVideo = async () => {
    try {
      const response = await fetch(`${serverUrl}/video/current`, {
        headers: { 'Authorization': `Bearer ${await getToken()}` }
      });

      const data = await response.json();

      if (data.video) {
        setCurrentVideo(data.video);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.embed_url) {
      toast.error('Title and embed URL are required');
      return;
    }

    // Validate YouTube URL
    if (!formData.embed_url.includes('youtube.com') && !formData.embed_url.includes('youtu.be')) {
      toast.error('Please provide a valid YouTube URL');
      return;
    }

    setSaving(true);

    try {
      const token = await getToken();
      const response = await fetch(`${serverUrl}/admin/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Video updated successfully!');
        setCurrentVideo(data.video);
        setFormData({ title: '', embed_url: '' });
        fetchCurrentVideo();
      } else {
        toast.error(data.error || 'Failed to update video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const convertToEmbedUrl = (url: string) => {
    // Convert regular YouTube URL to embed URL
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Video Management</h1>
          <p className="text-gray-600">Manage the onboarding training video</p>
        </div>

        {/* Current Active Video */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Current Active Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentVideo ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{currentVideo.title}</h3>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={currentVideo.embed_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="text-sm">Video is active and visible to workmates</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No active video</p>
                <p className="text-sm text-gray-500">Upload a video below to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Video Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Training Video</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Video Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Onboarding Training Session"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="embed_url">YouTube URL *</Label>
                <Input
                  id="embed_url"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.embed_url}
                  onChange={(e) => {
                    const embedUrl = convertToEmbedUrl(e.target.value);
                    setFormData({ ...formData, embed_url: embedUrl });
                  }}
                  className="mt-1"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Paste a YouTube video URL (will be automatically converted to embed format)
                </p>
              </div>

              {formData.embed_url && (
                <div>
                  <Label>Preview</Label>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mt-2">
                    <iframe
                      src={formData.embed_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>
                    Updating the video will replace the current active video. The new video will 
                    immediately be available to all workmates in the onboarding process.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                style={{ backgroundColor: '#FBB704' }}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Updating...' : 'Update Video'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

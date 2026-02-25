import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import { ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        toast.error(error.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, must_change_password')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast.error('Unauthorized access');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success('Login successful');
      
      if (profile?.must_change_password) {
        navigate('/admin/settings');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Seller's Hub Onboarding Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Admin Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: '#FBB704' }}
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an admin account?{' '}
              <button
                onClick={() => navigate('/admin-signup')}
                className="text-gray-900 hover:underline font-semibold"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
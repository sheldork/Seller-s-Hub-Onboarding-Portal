import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { serverUrl, supabase } from '../../supabaseClient';
import AdminLayout from './AdminLayout';
import { Lock, Percent } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passingScore, setPassingScore] = useState('70');
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${serverUrl}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setPassingScore(data.passingScore || '70');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePassingScoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const score = parseFloat(passingScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Passing score must be between 0 and 100');
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${serverUrl}/admin/settings/passing-score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ passing_score: score })
      });

      if (response.ok) {
        toast.success('Passing score updated!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update passing score');
      }
    } catch (error) {
      console.error('Error updating passing score:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.password) {
      toast.error('Password is required');
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(passwordData.password);
    const hasLowerCase = /[a-z]/.test(passwordData.password);
    const hasNumber = /[0-9]/.test(passwordData.password);
    const hasSymbol = /[^A-Za-z0-9]/.test(passwordData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      toast.error('Password must contain uppercase, lowercase, number, and symbol');
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${serverUrl}/admin/settings/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ password: passwordData.password })
      });

      if (response.ok) {
        toast.success('Password updated! Please login again.');
        setTimeout(async () => {
          await supabase.auth.signOut();
          window.location.href = '/admin-login';
        }, 2000);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage admin account and quiz settings</p>
        </div>

        <div className="space-y-6">
          {/* Passing Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Percent className="w-5 h-5 mr-2" />
                Quiz Passing Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassingScoreUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="passingScore">Passing Score Percentage</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    className="mt-1"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Workmates must score at least this percentage to pass the quiz
                  </p>
                </div>

                <Button
                  type="submit"
                  style={{ backgroundColor: '#FBB704' }}
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Update Passing Score'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="mt-1"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 8 characters with uppercase, lowercase, number, and symbol
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    <strong>Note:</strong> After changing your password, you will be logged out and 
                    need to login again with your new password.
                  </p>
                </div>

                <Button
                  type="submit"
                  style={{ backgroundColor: '#FBB704' }}
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

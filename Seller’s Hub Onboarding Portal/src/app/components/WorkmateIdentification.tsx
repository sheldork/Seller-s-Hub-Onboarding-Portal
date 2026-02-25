import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { serverUrl, supabase } from '../supabaseClient';
import { publicAnonKey } from '/utils/supabase/info';

const departments = [
  'Human Capital',
  'Finance & Accounting',
  'Logistics',
  'Fulfillment',
  'Production (SH Brands)',
  'Creatives (SH Brands)',
  'Facebook Sales',
  'Telesales',
  'Customer Retention'
];

export default function WorkmateIdentification() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    department: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.position || !formData.department) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${serverUrl}/workmate/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to register');
        setLoading(false);
        return;
      }

      toast.success('Welcome to Seller\'s Hub!');
      navigate(`/workmate/${data.workmate.id}`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller's Hub</h1>
            <p className="text-gray-600">Onboarding Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                type="text"
                placeholder="Enter your position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <button
              onClick={() => navigate('/admin-login')}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

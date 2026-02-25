import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { serverUrl, supabase } from '../../supabaseClient';
import AdminLayout from './AdminLayout';
import { Search, CheckCircle2, XCircle } from 'lucide-react';

export default function OnboardingRecords() {
  const [loading, setLoading] = useState(true);
  const [workmates, setWorkmates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWorkmates();
  }, []);

  const fetchWorkmates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${serverUrl}/admin/workmates`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setWorkmates(data.workmates || []);
      } else {
        toast.error('Failed to load records');
      }
    } catch (error) {
      console.error('Error fetching workmates:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkmates = workmates.filter(wm =>
    wm.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wm.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wm.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Onboarding Records</h1>
          <p className="text-gray-600">View all workmate onboarding progress</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, position, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Records ({filteredWorkmates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading records...</p>
              </div>
            ) : filteredWorkmates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Position</th>
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-left py-3 px-4">Step</th>
                      <th className="text-left py-3 px-4">Quiz</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkmates.map((workmate) => {
                      const progress = Array.isArray(workmate.onboarding_progress)
                        ? workmate.onboarding_progress[0]
                        : workmate.onboarding_progress;
                      const isCompleted = progress?.completed_at != null;

                      return (
                        <tr key={workmate.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{workmate.full_name}</td>
                          <td className="py-3 px-4">{workmate.position}</td>
                          <td className="py-3 px-4">{workmate.department}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                              {progress?.step_completed || 1} / 5
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {progress?.quiz_passed ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                <span className="text-sm">{progress.quiz_score || 0}</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400">
                                <XCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">Not taken</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isCompleted ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                In Progress
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {new Date(workmate.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No records match your search' : 'No records found'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { serverUrl, supabase } from '../../supabaseClient';
import AdminLayout from './AdminLayout';
import { Users, CheckCircle2, BarChart3, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${serverUrl}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        toast.error('Failed to load stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Workmates',
      value: stats?.totalWorkmates || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Completed Onboarding',
      value: stats?.completedCount || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Completion Rate',
      value: `${stats?.completionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Avg Quiz Score',
      value: `${stats?.avgQuizScore || 0}%`,
      icon: BarChart3,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of onboarding metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Position</th>
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-left py-3 px-4">Step</th>
                      <th className="text-left py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSubmissions.map((workmate: any) => {
                      const progress = Array.isArray(workmate.onboarding_progress) 
                        ? workmate.onboarding_progress[0] 
                        : workmate.onboarding_progress;

                      return (
                        <tr key={workmate.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{workmate.full_name}</td>
                          <td className="py-3 px-4">{workmate.position}</td>
                          <td className="py-3 px-4">{workmate.department}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                              Step {progress?.step_completed || 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
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
                No submissions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

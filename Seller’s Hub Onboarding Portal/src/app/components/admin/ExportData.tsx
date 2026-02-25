import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { serverUrl, supabase } from '../../supabaseClient';
import AdminLayout from './AdminLayout';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

export default function ExportData() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${serverUrl}/admin/export`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `onboarding-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Data exported successfully!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('An error occurred');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Export Data</h1>
          <p className="text-gray-600">Download onboarding records as CSV</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              CSV Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Export includes:</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Full Name</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Position</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Department</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Current Step</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Quiz Score</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Quiz Status (Passed/Not Passed)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Completion Date</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Registration Date</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                The exported CSV file can be opened in Excel, Google Sheets, or any spreadsheet application 
                for further analysis and reporting.
              </p>
            </div>

            <Button
              onClick={handleExport}
              style={{ backgroundColor: '#FBB704' }}
              disabled={exporting}
              className="w-full"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              {exporting ? 'Exporting...' : 'Export All Data to CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Export Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>File Format:</strong> The exported file is in CSV (Comma-Separated Values) format, 
              compatible with all major spreadsheet applications.
            </div>
            <div>
              <strong>Data Accuracy:</strong> The export includes all workmates registered in the system 
              with their latest onboarding progress.
            </div>
            <div>
              <strong>Privacy:</strong> Please handle exported data responsibly and in accordance with 
              your organization's data privacy policies.
            </div>
            <div>
              <strong>Frequency:</strong> You can export data as often as needed. Each export generates 
              a new file with the current date in the filename.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

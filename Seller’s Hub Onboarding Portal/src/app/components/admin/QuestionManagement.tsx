import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { serverUrl, supabase } from '../../supabaseClient';
import AdminLayout from './AdminLayout';
import { Plus, Trash2, Edit, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export default function QuestionManagement() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [formData, setFormData] = useState({
    question_text: '',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${serverUrl}/quiz/questions`, {
        headers: { 'Authorization': `Bearer ${await getToken()}` }
      });

      const data = await response.json();

      if (response.ok) {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { option_text: '', is_correct: false }]
    });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...formData.options];
    if (field === 'is_correct' && value) {
      // Only one correct answer allowed
      newOptions.forEach((opt, i) => {
        opt.is_correct = i === index;
      });
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value };
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question_text) {
      toast.error('Question text is required');
      return;
    }

    if (formData.options.length < 2) {
      toast.error('At least 2 options required');
      return;
    }

    if (!formData.options.some(opt => opt.option_text.trim())) {
      toast.error('Options cannot be empty');
      return;
    }

    if (!formData.options.some(opt => opt.is_correct)) {
      toast.error('Please mark one option as correct');
      return;
    }

    try {
      const token = await getToken();
      const url = editingQuestion
        ? `${serverUrl}/admin/question/${editingQuestion.id}`
        : `${serverUrl}/admin/question`;
      
      const response = await fetch(url, {
        method: editingQuestion ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingQuestion ? 'Question updated!' : 'Question added!');
        setDialogOpen(false);
        resetForm();
        fetchQuestions();
      } else {
        toast.error(data.error || 'Failed to save question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('An error occurred');
    }
  };

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      options: question.quiz_options || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${serverUrl}/admin/question/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Question deleted!');
        fetchQuestions();
      } else {
        toast.error('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('An error occurred');
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Question Management</h1>
            <p className="text-gray-600">Manage quiz questions and answers</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#FBB704' }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="question_text">Question *</Label>
                  <Input
                    id="question_text"
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    placeholder="Enter your question"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label>Options (mark one as correct) *</Label>
                    <Button
                      type="button"
                      onClick={handleAddOption}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleOptionChange(index, 'is_correct', true)}
                          className="mt-2"
                        >
                          {option.is_correct ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </button>
                        
                        <Input
                          value={option.option_text}
                          onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                        
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Click the circle to mark the correct answer
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    style={{ backgroundColor: '#FBB704' }}
                    className="flex-1"
                  >
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">No Questions Yet</h3>
                <p className="text-gray-600 mb-4">
                  Add your first quiz question to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question, qIndex) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex-1">
                      Question {qIndex + 1}: {question.question_text}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(question)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(question.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {question.quiz_options?.map((option: any, oIndex: number) => (
                      <div
                        key={option.id}
                        className={`flex items-center p-3 rounded-lg border ${
                          option.is_correct
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {option.is_correct ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 mr-3" />
                        )}
                        <span className="flex-1">{option.option_text}</span>
                        {option.is_correct && (
                          <span className="text-xs text-green-600 font-semibold">CORRECT</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

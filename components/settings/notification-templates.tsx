import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  isDefault: boolean;
  isActive: boolean;
  variables?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationTemplatesProps {
  companySlug: string;
}

export function NotificationTemplates({ companySlug }: NotificationTemplatesProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [availableVariables, setAvailableVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    bodyText: '',
    bodyHtml: '',
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    fetchTemplates();
  }, [companySlug]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${companySlug}/notification-templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
      setAvailableVariables(data.availableVariables || {});
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load notification templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '[{{ticketNumber}}] {{originalSubject}}',
      bodyText: `Hello {{customerName}},

We have received your message and created ticket #{{ticketNumber}} for your inquiry.

Original Subject: {{originalSubject}}
Priority: {{priority}}
Status: {{status}}
Created: {{createdAt}}

We will review your request and respond as soon as possible.

Best regards,
{{companyName}} Support Team`,
      bodyHtml: '',
      isDefault: templates.length === 0,
      isActive: true
    });
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setIsCreating(false);
    setFormData({
      name: template.name,
      subject: template.subject,
      bodyText: template.bodyText,
      bodyHtml: template.bodyHtml,
      isDefault: template.isDefault,
      isActive: template.isActive
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.subject.trim() || !formData.bodyText.trim()) {
        toast({
          title: "Validation Error",
          description: "Name, subject, and body text are required",
          variant: "destructive"
        });
        return;
      }

      const url = editingTemplate 
        ? `/api/${companySlug}/notification-templates/${editingTemplate.id}`
        : `/api/${companySlug}/notification-templates`;
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      await fetchTemplates();
      setEditingTemplate(null);
      setIsCreating(false);
      
      toast({
        title: "Success",
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`
      });
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (template: NotificationTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${companySlug}/notification-templates/${template.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      await fetchTemplates();
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading notification templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Notification Templates</h2>
          <p className="text-sm text-muted-foreground">
            Configure email notifications sent to customers when tickets are created
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Available Variables Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(availableVariables).map(([key, description]) => (
              <div key={key} className="flex flex-col">
                <code className="bg-muted px-1 py-0.5 rounded">{`{{${key}}}`}</code>
                <span className="text-muted-foreground mt-1">{description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {(isCreating || editingTemplate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {isCreating ? 'Create New Template' : 'Edit Template'}
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Default Notification"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject Template</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="[{{ticketNumber}}] {{originalSubject}}"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email Body (Text)</label>
              <Textarea
                value={formData.bodyText}
                onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                rows={8}
                placeholder="Enter the notification email body..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email Body (HTML) - Optional</label>
              <Textarea
                value={formData.bodyHtml}
                onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                rows={6}
                placeholder="Enter HTML version (optional, will use text version if empty)"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <label className="text-sm font-medium">Default Template</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <label className="text-sm font-medium">Active</label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No notification templates configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a template to send notification emails to customers
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex gap-1">
                      {template.isDefault && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                      {!template.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(template)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(template)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Subject:</span>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Body Preview:</span>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.bodyText.substring(0, 200)}...
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated: {new Date(template.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

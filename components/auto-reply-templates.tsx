"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AutoReplyTemplate, DEFAULT_AUTO_REPLY_VARIABLES } from "@/types/auto-reply";

interface AutoReplyTemplatesProps {
  companySlug: string;
}

export default function AutoReplyTemplates({ companySlug }: AutoReplyTemplatesProps) {
  const [templates, setTemplates] = useState<AutoReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<AutoReplyTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; text: string; html: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: 'Re: {{subject}}',
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
      const response = await fetch(`/api/${companySlug}/auto-reply-templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load auto-reply templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      const response = await fetch(`/api/${companySlug}/auto-reply-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      await fetchTemplates();
      resetForm();
      setIsCreating(false);
      toast({
        title: 'Success',
        description: 'Auto-reply template created successfully'
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create template',
        variant: 'destructive'
      });
    }
  };

  const updateTemplate = async (template: AutoReplyTemplate) => {
    try {
      const response = await fetch(`/api/${companySlug}/auto-reply-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }

      await fetchTemplates();
      setSelectedTemplate(null);
      setIsEditing(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Auto-reply template updated successfully'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update template',
        variant: 'destructive'
      });
    }
  };

  const deleteTemplate = async (template: AutoReplyTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${companySlug}/auto-reply-templates/${template.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      await fetchTemplates();
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
        setIsEditing(false);
        resetForm();
      }
      toast({
        title: 'Success',
        description: 'Auto-reply template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const previewTemplate = async () => {
    try {
      const response = await fetch(`/api/${companySlug}/auto-reply-templates/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          bodyText: formData.bodyText,
          bodyHtml: formData.bodyHtml
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to preview template');
      }

      const data = await response.json();
      setPreview(data.preview);
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to preview template',
        variant: 'destructive'
      });
    }
  };

  const initializeDefaultTemplate = async () => {
    try {
      const response = await fetch(`/api/${companySlug}/auto-reply-templates/init-default`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize default template');
      }

      await fetchTemplates();
      toast({
        title: 'Success',
        description: 'Default auto-reply template created successfully'
      });
    } catch (error) {
      console.error('Error initializing default template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initialize default template',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: 'Re: {{subject}}',
      bodyText: '',
      bodyHtml: '',
      isDefault: false,
      isActive: true
    });
    setPreview(null);
  };

  const selectTemplate = (template: AutoReplyTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      bodyText: template.bodyText,
      bodyHtml: template.bodyHtml,
      isDefault: template.isDefault,
      isActive: template.isActive
    });
    setIsEditing(false);
    setIsCreating(false);
    setPreview(null);
  };

  const startEditing = () => {
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setIsCreating(false);
    if (selectedTemplate) {
      selectTemplate(selectedTemplate);
    } else {
      resetForm();
    }
  };

  if (loading) {
    return <div>Loading auto-reply templates...</div>;
  }

  return (
    <div className="space-y-6">
      {templates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Auto-Reply Templates</CardTitle>
            <CardDescription>
              Create your first auto-reply template to automatically respond to new tickets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={initializeDefaultTemplate}>
              Create Default Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Auto-Reply Templates</h3>
            <Button onClick={startCreating}>
              Create New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template List */}
            <div className="space-y-4">
              <h4 className="font-medium">Templates</h4>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => selectTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        {template.isDefault && <Badge variant="default">Default</Badge>}
                        {!template.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground truncate">
                      {template.subject}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Template Editor */}
            <div className="space-y-4">
              {(selectedTemplate || isCreating) && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">
                        {isCreating ? 'Create New Template' : isEditing ? 'Edit Template' : 'Template Details'}
                      </CardTitle>
                      <div className="flex gap-2">
                        {!isCreating && !isEditing && (
                          <>
                            <Button size="sm" variant="outline" onClick={startEditing}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectedTemplate && deleteTemplate(selectedTemplate)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        {(isCreating || isEditing) && (
                          <>
                            <Button size="sm" variant="outline" onClick={previewTemplate}>
                              Preview
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={isCreating ? createTemplate : () => selectedTemplate && updateTemplate(selectedTemplate)}
                            >
                              {isCreating ? 'Create' : 'Save'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium">
                        Template Name
                      </label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isCreating && !isEditing}
                        placeholder="e.g., Default Auto-Reply"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject Template
                      </label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        disabled={!isCreating && !isEditing}
                        placeholder="Re: {{subject}}"
                      />
                    </div>

                    <div>
                      <label htmlFor="bodyText" className="text-sm font-medium">
                        Text Body Template
                      </label>
                      <Textarea
                        id="bodyText"
                        value={formData.bodyText}
                        onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                        disabled={!isCreating && !isEditing}
                        rows={6}
                        placeholder="Thank you for contacting {{companyName}} support..."
                      />
                    </div>

                    <div>
                      <label htmlFor="bodyHtml" className="text-sm font-medium">
                        HTML Body Template
                      </label>
                      <Textarea
                        id="bodyHtml"
                        value={formData.bodyHtml}
                        onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                        disabled={!isCreating && !isEditing}
                        rows={6}
                        placeholder="<p>Thank you for contacting {{companyName}} support...</p>"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          disabled={!isCreating && !isEditing}
                        />
                        <span className="text-sm">Set as default template</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          disabled={!isCreating && !isEditing}
                        />
                        <span className="text-sm">Active</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Available Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Available Variables</CardTitle>
                  <CardDescription>
                    Use these variables in your templates. Click to copy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(DEFAULT_AUTO_REPLY_VARIABLES).map(([key, description]) => (
                      <div
                        key={key}
                        className="p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${key}}}`);
                          toast({ title: 'Copied', description: `{{${key}}} copied to clipboard` });
                        }}
                      >
                        <code className="text-xs font-mono">{'{{' + key + '}}'}</code>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              {preview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <p className="text-sm bg-muted p-2 rounded">{preview.subject}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Text Body:</label>
                      <pre className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">{preview.text}</pre>
                    </div>
                    <div>
                      <label className="text-sm font-medium">HTML Body:</label>
                      <div 
                        className="text-sm bg-muted p-2 rounded"
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

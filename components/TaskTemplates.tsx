import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, X, Save } from 'lucide-react';
import { TaskTemplate, EnergyLevel, Project } from '../types';

interface TaskTemplatesProps {
  templates: TaskTemplate[];
  projects: Project[];
  onCreateTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt'>) => void;
  onUpdateTemplate: (id: string, template: Partial<TaskTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (template: TaskTemplate) => void;
  onClose: () => void;
}

const TaskTemplates: React.FC<TaskTemplatesProps> = ({
  templates,
  projects,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    projectId: string;
    energyRequired: EnergyLevel;
    isRecurring: boolean;
    recurringInterval: 'Daily' | 'Weekly' | 'Monthly';
    collaboration: string;
    subtasksList: string; // Comma-separated list
  }>({
    name: '',
    description: '',
    category: '',
    projectId: '',
    energyRequired: 'Medium',
    isRecurring: false,
    recurringInterval: 'Daily',
    collaboration: '',
    subtasksList: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      projectId: '',
      energyRequired: 'Medium',
      isRecurring: false,
      recurringInterval: 'Daily',
      collaboration: '',
      subtasksList: '',
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      projectId: template.projectId || '',
      energyRequired: template.energyRequired,
      isRecurring: template.isRecurring || false,
      recurringInterval: template.recurringInterval || 'Daily',
      collaboration: template.collaboration || '',
      subtasksList: template.subtasks?.map(s => s.title).join(', ') || '',
    });
  };

  const handleSave = () => {
    const subtasks = formData.subtasksList
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
      .map(title => ({ title }));

    const templateData = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      projectId: formData.projectId || undefined,
      energyRequired: formData.energyRequired,
      isRecurring: formData.isRecurring || undefined,
      recurringInterval: formData.isRecurring ? formData.recurringInterval : undefined,
      collaboration: formData.collaboration || undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    };

    if (editingId) {
      onUpdateTemplate(editingId, templateData);
    } else {
      onCreateTemplate(templateData);
    }

    resetForm();
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    onUseTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Task Templates</h3>
            <p className="text-xs text-white/40 mt-0.5">Save and reuse common task structures</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} className="text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <div className="mb-6 p-6 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  {editingId ? 'Edit Template' : 'Create Template'}
                </h4>
                <button
                  onClick={resetForm}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Report"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-pilot-orange/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Template description..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-pilot-orange/50 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-2">
                    Project
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-pilot-orange/50 transition-colors"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.icon} {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-2">
                    Energy Level *
                  </label>
                  <select
                    value={formData.energyRequired}
                    onChange={(e) => setFormData({ ...formData, energyRequired: e.target.value as EnergyLevel })}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-pilot-orange/50 transition-colors"
                  >
                    <option value="Low">Low Energy</option>
                    <option value="Medium">Medium Energy</option>
                    <option value="High">High Energy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Documentation"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-pilot-orange/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-2">
                  Collaboration
                </label>
                <input
                  type="text"
                  value={formData.collaboration}
                  onChange={(e) => setFormData({ ...formData, collaboration: e.target.value })}
                  placeholder="e.g., Team members..."
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-pilot-orange/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-2">
                  Subtasks (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.subtasksList}
                  onChange={(e) => setFormData({ ...formData, subtasksList: e.target.value })}
                  placeholder="e.g., Review data, Create charts, Write summary"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-pilot-orange/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.02] text-pilot-orange focus:ring-pilot-orange/50"
                />
                <label htmlFor="isRecurring" className="text-sm text-white/70 cursor-pointer">
                  Recurring Task
                </label>
                {formData.isRecurring && (
                  <select
                    value={formData.recurringInterval}
                    onChange={(e) => setFormData({ ...formData, recurringInterval: e.target.value as 'Daily' | 'Weekly' | 'Monthly' })}
                    className="px-3 py-1.5 bg-white/[0.02] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-pilot-orange/50"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="w-full py-3 bg-pilot-orange hover:bg-pilot-orange/90 disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed rounded-lg text-sm font-bold text-white uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {editingId ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          )}

          {/* Create New Button */}
          {!isCreating && !editingId && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-6 py-4 bg-pilot-orange/10 hover:bg-pilot-orange/20 border border-pilot-orange/20 rounded-xl text-sm font-bold text-pilot-orange uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create New Template
            </button>
          )}

          {/* Templates List */}
          {templates.length === 0 && !isCreating && !editingId ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy size={24} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-1">No templates yet</p>
              <p className="text-xs text-white/30">Create your first template to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-pilot-orange/20 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold text-white">{template.name}</h4>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                          template.energyRequired === 'High' ? 'bg-red-500/20 text-red-400' :
                          template.energyRequired === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {template.energyRequired}
                        </span>
                      </div>

                      {template.description && (
                        <p className="text-xs text-white/50 mb-2">{template.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/40">
                        {template.projectId && (
                          <span>
                            {projects.find(p => p.id === template.projectId)?.icon}{' '}
                            {projects.find(p => p.id === template.projectId)?.name}
                          </span>
                        )}
                        {template.category && <span>📁 {template.category}</span>}
                        {template.isRecurring && <span>🔄 {template.recurringInterval}</span>}
                        {template.subtasks && template.subtasks.length > 0 && (
                          <span>✓ {template.subtasks.length} subtasks</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs font-bold text-green-400 uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} className="text-white/40 hover:text-white/60" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete template "${template.name}"?`)) {
                            onDeleteTemplate(template.id);
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400/60 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskTemplates;

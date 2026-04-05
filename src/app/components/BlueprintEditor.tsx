'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Blueprint,
  BlueprintDataModel,
  BlueprintFeature,
  BlueprintField,
  BlueprintPage,
} from '@/validators/blueprint.validator';

interface BlueprintEditorProps {
  blueprint: Blueprint;
  onRegenerate: (blueprint: Blueprint) => void | Promise<void>;
  isLoading: boolean;
}

const FIELD_TYPES: Array<BlueprintField['type']> = [
  'string',
  'number',
  'boolean',
  'date',
  'relation',
];

const PRIORITIES: Array<BlueprintFeature['priority']> = [
  'core',
  'important',
  'nice-to-have',
];

function cloneBlueprint(blueprint: Blueprint): Blueprint {
  return JSON.parse(JSON.stringify(blueprint)) as Blueprint;
}

export default function BlueprintEditor({
  blueprint,
  onRegenerate,
  isLoading,
}: BlueprintEditorProps) {
  const [draft, setDraft] = useState<Blueprint>(() => cloneBlueprint(blueprint));

  useEffect(() => {
    setDraft(cloneBlueprint(blueprint));
  }, [blueprint]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(blueprint);

  return (
    <div className="glass-panel flex max-h-[85vh] flex-col overflow-hidden rounded-[30px] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:max-h-[calc(100dvh-6rem)]">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
            Smart Blueprint Editor
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            Edit the generated JSON without leaving the builder
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Manually update features, pages, and database schema, then regenerate the website from your edited blueprint.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="theme-chip-muted rounded-full px-3 py-2">
            {draft.features.length} features
          </span>
          <span className="theme-chip-muted rounded-full px-3 py-2">
            {draft.pages.length} pages
          </span>
          <span className="theme-chip-muted rounded-full px-3 py-2">
            {draft.dataModels.length} models
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
        <div className="space-y-6">
          <section className="theme-card-muted rounded-[26px] p-4">
            <h4 className="text-sm font-semibold text-slate-900">Project Basics</h4>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Field
                label="Project name"
                value={draft.projectName}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    projectName: value,
                  }))
                }
                placeholder="project-name"
              />
              <Field
                label="Description"
                value={draft.description}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    description: value,
                  }))
                }
                placeholder="What does this app do?"
              />
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">Features</h4>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    features: [
                      ...current.features,
                      {
                        name: 'New feature',
                        description: 'Describe this capability',
                        priority: 'important',
                      },
                    ],
                  }))
                }
                className="theme-button-secondary rounded-full px-3 py-2 text-xs font-medium"
              >
                Add feature
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {draft.features.map((feature, index) => (
                <div key={`${feature.name}-${index}`} className="theme-card rounded-[20px] p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_160px_auto]">
                    <Field
                      label="Name"
                      value={feature.name}
                      onChange={(value) =>
                        updateFeature(setDraft, index, {
                          ...feature,
                          name: value,
                        })
                      }
                      placeholder="Feature name"
                    />
                    <SelectField
                      label="Priority"
                      value={feature.priority}
                      onChange={(value) =>
                        updateFeature(setDraft, index, {
                          ...feature,
                          priority: value as BlueprintFeature['priority'],
                        })
                      }
                      options={PRIORITIES}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          features: current.features.filter((_, featureIndex) => featureIndex !== index),
                        }))
                      }
                      className="theme-status-danger mt-6 rounded-full px-4 py-2 text-xs font-medium transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4">
                    <TextAreaField
                      label="Description"
                      value={feature.description}
                      onChange={(value) =>
                        updateFeature(setDraft, index, {
                          ...feature,
                          description: value,
                        })
                      }
                      placeholder="Explain the feature"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="theme-card-muted rounded-[26px] p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">Pages</h4>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    pages: [
                      ...current.pages,
                      {
                        name: 'New Page',
                        route: '/new-page',
                        description: 'Describe the page purpose',
                        components: ['NewPageView'],
                      },
                    ],
                  }))
                }
                className="theme-button-secondary rounded-full px-3 py-2 text-xs font-medium"
              >
                Add page
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {draft.pages.map((page, index) => (
                <div key={`${page.route}-${index}`} className="theme-card rounded-[20px] p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field
                      label="Page name"
                      value={page.name}
                      onChange={(value) =>
                        updatePage(setDraft, index, {
                          ...page,
                          name: value,
                        })
                      }
                      placeholder="Dashboard"
                    />
                    <Field
                      label="Route"
                      value={page.route}
                      onChange={(value) =>
                        updatePage(setDraft, index, {
                          ...page,
                          route: value,
                        })
                      }
                      placeholder="/dashboard"
                    />
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                    <TextAreaField
                      label="Description"
                      value={page.description}
                      onChange={(value) =>
                        updatePage(setDraft, index, {
                          ...page,
                          description: value,
                        })
                      }
                      placeholder="Describe what users do here"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          pages: current.pages.filter((_, pageIndex) => pageIndex !== index),
                        }))
                      }
                      className="theme-status-danger mt-6 rounded-full px-4 py-2 text-xs font-medium transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4">
                    <Field
                      label="Components (comma separated)"
                      value={page.components.join(', ')}
                      onChange={(value) =>
                        updatePage(setDraft, index, {
                          ...page,
                          components: value
                            .split(',')
                            .map((entry) => entry.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="DashboardHero, AnalyticsGrid"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="theme-card-muted rounded-[26px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Database Schema</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Modify models and fields directly. Relation fields can target another model name.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    dataModels: [
                      ...current.dataModels,
                      {
                        name: 'NewModel',
                        fields: [
                          { name: 'title', type: 'string', required: true },
                          { name: 'createdAt', type: 'date', required: true },
                        ],
                      },
                    ],
                  }))
                }
                className="theme-button-secondary rounded-full px-3 py-2 text-xs font-medium"
              >
                Add model
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {draft.dataModels.map((model, modelIndex) => (
                <div key={`${model.name}-${modelIndex}`} className="theme-card rounded-[20px] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="w-full lg:max-w-sm">
                      <Field
                        label="Model name"
                        value={model.name}
                        onChange={(value) =>
                          updateModel(setDraft, modelIndex, {
                            ...model,
                            name: value,
                          })
                        }
                        placeholder="Invoice"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateModel(setDraft, modelIndex, {
                            ...model,
                            fields: [
                              ...model.fields,
                              { name: 'newField', type: 'string', required: true },
                            ],
                          })
                        }
                        className="theme-button-secondary rounded-full px-3 py-2 text-xs font-medium"
                      >
                        Add field
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            dataModels: current.dataModels.filter((_, index) => index !== modelIndex),
                          }))
                        }
                        className="theme-status-danger rounded-full px-3 py-2 text-xs font-medium transition hover:bg-rose-100"
                      >
                        Remove model
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {model.fields.map((field, fieldIndex) => (
                      <div key={`${field.name}-${fieldIndex}`} className="theme-card-muted rounded-2xl p-3">
                        <div className="grid gap-3 lg:grid-cols-[1.1fr_180px_120px_auto]">
                          <Field
                            label="Field name"
                            value={field.name}
                            onChange={(value) =>
                              updateField(setDraft, modelIndex, fieldIndex, {
                                ...field,
                                name: value,
                              })
                            }
                            placeholder="customerName"
                          />
                          <SelectField
                            label="Type"
                            value={field.type}
                            onChange={(value) =>
                              updateField(setDraft, modelIndex, fieldIndex, {
                                ...field,
                                type: value as BlueprintField['type'],
                                relation: value === 'relation' ? field.relation ?? 'RelatedModel' : undefined,
                              })
                            }
                            options={FIELD_TYPES}
                          />
                          <ToggleField
                            label="Required"
                            checked={field.required}
                            onChange={(checked) =>
                              updateField(setDraft, modelIndex, fieldIndex, {
                                ...field,
                                required: checked,
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateModel(setDraft, modelIndex, {
                                ...model,
                                fields: model.fields.filter((_, index) => index !== fieldIndex),
                              })
                            }
                            className="theme-status-danger mt-6 rounded-full px-4 py-2 text-xs font-medium transition hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                        {field.type === 'relation' ? (
                          <div className="mt-3 lg:max-w-sm">
                            <Field
                              label="Relation target"
                              value={field.relation ?? ''}
                              onChange={(value) =>
                                updateField(setDraft, modelIndex, fieldIndex, {
                                  ...field,
                                  relation: value,
                                })
                              }
                              placeholder="Customer"
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Manual edits make the builder flexible and keep you in control of the generated architecture.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDraft(cloneBlueprint(blueprint))}
            disabled={!isDirty || isLoading}
            className="theme-button-secondary rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset changes
          </button>
          <button
            type="button"
            onClick={() => {
              void onRegenerate(draft);
            }}
            disabled={isLoading}
            className="theme-button-primary rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Regenerating...' : 'Regenerate from blueprint'}
          </button>
        </div>
      </div>
    </div>
  );
}

function updateFeature(
  setDraft: Dispatch<SetStateAction<Blueprint>>,
  index: number,
  nextFeature: BlueprintFeature
) {
  setDraft((current) => ({
    ...current,
    features: current.features.map((feature, featureIndex) =>
      featureIndex === index ? nextFeature : feature
    ),
  }));
}

function updatePage(
  setDraft: Dispatch<SetStateAction<Blueprint>>,
  index: number,
  nextPage: BlueprintPage
) {
  setDraft((current) => ({
    ...current,
    pages: current.pages.map((page, pageIndex) => (pageIndex === index ? nextPage : page)),
  }));
}

function updateModel(
  setDraft: Dispatch<SetStateAction<Blueprint>>,
  index: number,
  nextModel: BlueprintDataModel
) {
  setDraft((current) => ({
    ...current,
    dataModels: current.dataModels.map((model, modelIndex) =>
      modelIndex === index ? nextModel : model
    ),
  }));
}

function updateField(
  setDraft: Dispatch<SetStateAction<Blueprint>>,
  modelIndex: number,
  fieldIndex: number,
  nextField: BlueprintField
) {
  setDraft((current) => ({
    ...current,
    dataModels: current.dataModels.map((model, currentModelIndex) =>
      currentModelIndex === modelIndex
        ? {
            ...model,
            fields: model.fields.map((field, currentFieldIndex) =>
              currentFieldIndex === fieldIndex ? nextField : field
            ),
          }
        : model
    ),
  }));
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-6"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mt-6 flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
        style={{ accentColor: 'var(--brand-secondary)' }}
      />
      {label}
    </label>
  );
}

import React from "react";
 
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Description,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Types based on our backend schema
interface Source {
  id: number;
  name: string;
  sourceType: string;
  url: string | null;
  country: string;
  category: string;
  apiKey: string | null;
  notes: string | null;
  isEnabled: boolean;
  intervalMinutes: number;
  lastRun: string | null; // ISO string
  jobsImported: number;
  createdAt: string;
  updatedAt: string;
}

// Fetch all sources
async function fetchSources(): Promise<Source[]> {
  const res = await fetch("/admin/source", {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch sources");
  }
  const data = await res.json();
  return data.sources;
}

// Create a new source
async function createSource(data: Omit<Source, "id" | "createdAt" | "updatedAt" | "lastRun" | "jobsImported">): Promise<Source> {
  const res = await fetch("/admin/source", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      // Set defaults for fields not provided
      lastRun: null,
      jobsImported: 0,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to create source");
  }
  const result = await res.json();
  return result.source;
}

// Update an existing source
async function updateSource(id: number, data: Partial<Source>): Promise<Source> {
  const res = await fetch(`/admin/source/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update source");
  }
  const result = await res.json();
  return result.source;
}

export default function SourcesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [sourceTypeOptions, setSourceTypeOptions] = useState<string[]>(['']);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSourceId, setEditSourceId] = useState<number | null>(null);
  const [deleteSourceId, setDeleteSourceId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    sourceType: "",
    country: "",
    category: "",
    intervalMinutes: "",
    status: "",
    apiKey: "",
    notes: "",
  });

  // Fetch sources
  const { data: sources = [], isLoading, error } = useQuery<Source[], Error>({
    queryKey: ["sources"],
    queryFn: fetchSources,
  });

  // Populate source type options when sources change
  useEffect(() => {
    if (sources.length > 0) {
      // Get unique source types
      const uniqueTypes = [...new Set(sources.map(source => source.sourceType))];
      // Sort alphabetically for better UX
      uniqueTypes.sort();
      setSourceTypeOptions(['', ...uniqueTypes]);
    } else {
      setSourceTypeOptions(['']);
    }
  }, [sources]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({ title: "Source created successfully" });
      setIsAddOpen(false);
      // Reset form
      setFormData({
        name: "",
        url: "",
        sourceType: "",
        country: "",
        category: "",
        intervalMinutes: "",
        status: "",
        apiKey: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast({ title: "Failed to create source", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Source> }) => updateSource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({ title: "Source updated successfully" });
      setIsEditOpen(false);
      setEditSourceId(null);
      // Reset form
      setFormData({
        name: "",
        url: "",
        sourceType: "",
        country: "",
        category: "",
        intervalMinutes: "",
        status: "",
        apiKey: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast({ title: "Failed to update source", description: error.message, variant: "destructive" });
    },
  });

  // Delete source mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/admin/source/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to delete source");
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({ title: "Source deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete source", description: error.message, variant: "destructive" });
    },
  });

  // Enable source mutation
  const enableMutation = useMutation({
    mutationFn: (id: number) => fetch(`/admin/source/${id}/enable`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to enable source");
      }
      return res.json();
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({ title: "Source enabled successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to enable source", description: error.message, variant: "destructive" });
    },
  });

  // Disable source mutation
  const disableMutation = useMutation({
    mutationFn: (id: number) => fetch(`/admin/source/${id}/disable`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to disable source");
      }
      return res.json();
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast({ title: "Source disabled successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to disable source", description: error.message, variant: "destructive" });
    },
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast({ title: "Source Name is required", variant: "destructive" });
      return;
    }

    if (!formData.url.trim()) {
      toast({ title: "Website URL is required", variant: "destructive" });
      return;
    }

    if (!formData.sourceType.trim()) {
      toast({ title: "Source Type is required", variant: "destructive" });
      return;
    }

    if (!formData.country.trim()) {
      toast({ title: "Country is required", variant: "destructive" });
      return;
    }

    if (!formData.category.trim()) {
      toast({ title: "Job Category is required", variant: "destructive" });
      return;
    }

    if (!formData.intervalMinutes.trim() || isNaN(Number(formData.intervalMinutes))) {
      toast({ title: "Import Interval must be a valid number", variant: "destructive" });
      return;
    }

    if (!formData.status.trim()) {
      toast({ title: "Status is required", variant: "destructive" });
      return;
    }

    // Convert intervalMinutes to number
    const intervalMinutes = parseInt(formData.intervalMinutes, 10);

    // Prepare data for submission
    const sourceData = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      sourceType: formData.sourceType.trim(),
      country: formData.country.trim(),
      category: formData.category.trim(),
      apiKey: formData.apiKey.trim() || null,
      notes: formData.notes.trim() || null,
      isEnabled: formData.status.toLowerCase() === "enabled" || formData.status.toLowerCase() === "true",
      intervalMinutes: intervalMinutes,
    };

    // Determine if we're adding or editing
    if (editSourceId !== null) {
      // Edit mode
      updateMutation.mutate({ id: editSourceId, data: sourceData });
    } else {
      // Add mode
      createMutation.mutate(sourceData);
    }
  };

  // Handle edit click
  const handleEditClick = (source: Source) => {
    setEditSourceId(source.id);
    setFormData({
      name: source.name,
      url: source.url || "",
      sourceType: source.sourceType,
      country: source.country,
      category: source.category,
      intervalMinutes: source.intervalMinutes.toString(),
      status: source.isEnabled ? "enabled" : "disabled",
      apiKey: source.apiKey || "",
      notes: source.notes || "",
    });
    setIsEditOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (id: number) => {
    setDeleteSourceId(id);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (deleteSourceId !== null) {
      deleteMutation.mutate(deleteSourceId);
      setDeleteSourceId(null);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteSourceId(null);
  };

  // Handle enable click
  const handleEnableClick = (id: number) => {
    enableMutation.mutate(id);
  };

  // Handle disable click
  const handleDisableClick = (id: number) => {
    disableMutation.mutate(id);
  };

  // Filter sources based on search and filters
  const filteredSources = sources.filter((source) => {
    // Search by name only (as per Task 8 requirements)
    const matchesSearch = source.name.toLowerCase().includes(search.toLowerCase());

    // Filter by status
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' && source.isEnabled) ||
      (statusFilter === 'disabled' && !source.isEnabled);

    // Filter by source type
    const matchesSourceType =
      sourceTypeFilter === '' ||
      source.sourceType === sourceTypeFilter;

    return matchesSearch && matchesStatus && matchesSourceType;
  });

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Sources Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="select sm-sm"
            >
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Type:</label>
            <select
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value)}
              className="select sm-sm"
            >
              {sourceTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === '' ? 'All Types' : option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <DialogTrigger asChild>
              <button
                onClick={() => {
                  setIsAddOpen(true);
                  setEditSourceId(null);
                  // Reset form for add mode
                  setFormData({
                    name: "",
                    url: "",
                    sourceType: "",
                    country: "",
                    category: "",
                    intervalMinutes: "",
                    status: "",
                    apiKey: "",
                    notes: "",
                  });
                }}
                className="btn btn-primary"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Source
              </button>
            </DialogTrigger>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Error loading sources: {error.message}
        </div>
      )}

      {/* Statistics Section */}
      {!isLoading && sources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium text-muted-foreground">Total Sources</h3>
              <p className="text-2xl font-bold">{sources.length}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium text-muted-foreground">Active Sources</h3>
              <p className="text-2xl font-bold text-green-600">{sources.filter(s => s.isEnabled).length}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium text-muted-foreground">Disabled Sources</h3>
              <p className="text-2xl font-bold text-red-600">{sources.filter(s => !s.isEnabled).length}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium text-muted-foreground">Total Jobs Imported</h3>
              <p className="text-2xl font-bold">{sources.reduce((total, source) => total + (source.jobsImported || 0), 0)}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Website URL</th>
                <th>Source Type</th>
                <th>Status</th>
                <th>Import Interval</th>
                <th>Last Import Time</th>
                <th>Jobs Imported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No sources found.
                  </td>
                </tr>
              ) : (
                filteredSources.map((source) => (
                  <tr
                    key={source.id}
                    className="hover:bg-accent"
                  >
                    <td>{source.name}</td>
                    <td>
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {source.url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td>{source.sourceType}</td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: source.isEnabled ? "green.500" : "red.500" }}></div>
                        <span>{source.isEnabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </td>
                    <td>{source.intervalMinutes} min</td>
                    <td>{formatDate(source.lastRun)}</td>
                    <td>{source.jobsImported ?? 0}</td>
                    <td className="flex items-center space-x-2">
                      {/* Edit button */}
                      <button
                        onClick={() => handleEditClick(source)}
                        className="btn btn-sm btn-primary"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteClick(source.id)}
                        className="btn btn-sm btn-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {/* Enable/Disable buttons */}
                      {!source.isEnabled ? (
                        <button
                          onClick={() => handleEnableClick(source.id)}
                          className="btn btn-sm btn-success"
                        >
                          <Check className="h-3 w-3" /> Enable
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDisableClick(source.id)}
                          className="btn btn-sm btn-warning"
                        >
                          <X className="h-3 w-3" /> Disable
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteSourceId !== null} onOpenChange={(open) => {
        if (!open) {
          setDeleteSourceId(null);
        }
      }}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Delete Source</DialogTitle>
          </DialogHeader>
          <Description>
            Are you sure you want to delete this source? This action cannot be undone.
          </Description>
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="btn btn-destructive"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Source"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Source Dialog */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setIsEditOpen(false);
          setEditSourceId(null);
          // Reset form
          setFormData({
            name: "",
            url: "",
            sourceType: "",
            country: "",
            category: "",
            intervalMinutes: "",
            status: "",
            apiKey: "",
            notes: "",
          });
        }
      }}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>
              {editSourceId !== null ? "Edit Source" : "Add New Source"}
            </DialogTitle>
          </DialogHeader>
          <Description>
            <Form onSubmit={handleSubmit}>
              <form>
                <FormField>
                  <Label>
                    Source Name
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter source name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    Website URL
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter website URL (e.g., https://example.com)"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      required
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    Source Type
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter source type (e.g., Job Board, Company Career)"
                      name="sourceType"
                      value={formData.sourceType}
                      onChange={handleInputChange}
                      required
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    Country
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    Job Category
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter job category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    Import Interval (minutes)
                  </Label>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter interval in minutes"
                      name="intervalMinutes"
                      value={formData.intervalMinutes}
                      onChange={handleInputChange}
                      required
                      min="1"
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    Status
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter status (enabled/disabled)"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      list="status-options"
                    />
                    <datalist id="status-options">
                      <option value="enabled" />
                      <option value="disabled" />
                    </datalist>
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    API Key (Optional)
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter API key if required"
                      name="apiKey"
                      value={formData.apiKey}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <Label>
                    Notes (Optional)
                  </Label>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </FormField>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddOpen(false);
                      setIsEditOpen(false);
                      setEditSourceId(null);
                      // Reset form
                      setFormData({
                        name: "",
                        url: "",
                        sourceType: "",
                        country: "",
                        category: "",
                        intervalMinutes: "",
                        status: "",
                        apiKey: "",
                        notes: "",
                      });
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={(editSourceId !== null ? updateMutation.isPending : createMutation.isPending)}
                    className="btn btn-primary"
                  >
                    {(editSourceId !== null ? updateMutation.isPending : createMutation.isPending)
                      ? (editSourceId !== null ? "Updating..." : "Creating...")
                      : (editSourceId !== null ? "Update Source" : "Create Source")}
                  </button>
                </div>
              </form>
            </Form>
          </Description>
        </DialogContent>
      </Dialog>
    </div>
  );
}

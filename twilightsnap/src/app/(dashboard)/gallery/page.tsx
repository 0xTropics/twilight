"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ImageIcon,
  Loader2,
  ArrowRight,
  Folder,
  Check,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GalleryModal from "@/components/gallery/GalleryModal";
import type { Conversion } from "@/types/database";

type FilterTab = "all" | "completed" | "processing" | "failed";
const PAGE_SIZE = 12;

interface TabCounts {
  all: number;
  completed: number;
  processing: number;
  failed: number;
}

interface Project {
  id: string;
  name: string;
  conversion_count: number;
}

export default function GalleryPage() {
  const searchParams = useSearchParams();
  const activeProject = searchParams.get("project");

  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [counts, setCounts] = useState<TabCounts>({
    all: 0,
    completed: 0,
    processing: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedConversion, setSelectedConversion] =
    useState<Conversion | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState("");

  // Projects (for assign menu)
  const [projects, setProjects] = useState<Project[]>([]);

  // Selection mode for assigning to projects
  const organizeParam = searchParams.get("organize") === "true";
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  // Project name for header
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);

  useEffect(() => {
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    fetchProjects();
  }, []);

  // Auto-enter select mode from URL param
  useEffect(() => {
    if (organizeParam && projects.length > 0) {
      setSelectMode(true);
    }
  }, [organizeParam, projects.length]);

  useEffect(() => {
    if (activeProject && projects.length > 0) {
      const p = projects.find((p) => p.id === activeProject);
      setActiveProjectName(p?.name ?? null);
    } else {
      setActiveProjectName(null);
    }
  }, [activeProject, projects]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch {
      // projects table may not exist yet
    }
  }

  const fetchConversions = useCallback(
    async (filterTab: FilterTab, projectId: string | null, offset: number = 0) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { data: [], count: 0 };

      let query = supabase
        .from("conversions")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (filterTab !== "all") {
        query = query.eq("status", filterTab);
      }

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, count } = await query;
      return { data: data ?? [], count: count ?? 0 };
    },
    []
  );

  const fetchCounts = useCallback(async (projectId: string | null) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const buildQuery = (status?: string) => {
      let q = supabase
        .from("conversions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (status) q = q.eq("status", status);
      if (projectId) q = q.eq("project_id", projectId);
      return q;
    };

    const [allRes, completedRes, processingRes, failedRes] = await Promise.all([
      buildQuery(),
      buildQuery("completed"),
      buildQuery("processing"),
      buildQuery("failed"),
    ]);

    setCounts({
      all: allRes.count ?? 0,
      completed: completedRes.count ?? 0,
      processing: processingRes.count ?? 0,
      failed: failedRes.count ?? 0,
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [result] = await Promise.all([
        fetchConversions(filter, activeProject),
        fetchCounts(activeProject),
      ]);
      setConversions(result.data as Conversion[]);
      setHasMore(result.data.length < (result.count ?? 0));
      setLoading(false);
    }
    load();
  }, [filter, activeProject, fetchConversions, fetchCounts]);

  async function handleLoadMore() {
    setLoadingMore(true);
    const result = await fetchConversions(filter, activeProject, conversions.length);
    const newConversions = [...conversions, ...(result.data as Conversion[])];
    setConversions(newConversions);
    setHasMore(newConversions.length < (result.count ?? 0));
    setLoadingMore(false);
  }

  function handleFilterChange(tab: FilterTab) {
    setFilter(tab);
    setConversions([]);
  }

  async function handleAssignToProject(projectId: string | null) {
    if (selectedIds.size === 0) return;
    const res = await fetch("/api/projects/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversionIds: Array.from(selectedIds),
        projectId,
      }),
    });
    if (res.ok) {
      setSelectMode(false);
      setSelectedIds(new Set());
      setShowAssignMenu(false);
      await fetchProjects();
      const result = await fetchConversions(filter, activeProject);
      setConversions(result.data as Conversion[]);
      setHasMore(result.data.length < (result.count ?? 0));
      await fetchCounts(activeProject);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "processing", label: "Processing" },
    { key: "failed", label: "Failed" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {activeProjectName ?? "My Conversions"}
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {counts.all} {counts.all === 1 ? "photo" : "photos"}
          </p>
        </div>

        {/* Selection controls — only visible in select mode */}
        {selectMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {selectedIds.size} selected
            </span>
            {selectedIds.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAssignMenu(!showAssignMenu)}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-white/[0.1]"
                >
                  Move to...
                </button>
                {showAssignMenu && (
                  <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-white/[0.08] bg-[#121214] p-1.5 shadow-xl">
                    <button
                      onClick={() => handleAssignToProject(null)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                      Remove from project
                    </button>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleAssignToProject(p.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-foreground"
                      >
                        <Folder className="h-3 w-3" strokeWidth={1.5} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setSelectMode(false);
                setSelectedIds(new Set());
                setShowAssignMenu(false);
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:text-foreground"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
              filter === tab.key
                ? "bg-white/[0.06] text-foreground"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}{" "}
            <span className="font-mono text-zinc-600">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-white/[0.06] border-t-[#c8a55c] animate-spin" />
        </div>
      ) : conversions.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 mt-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
            <ImageIcon className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 text-base font-semibold tracking-tight text-foreground">
            {activeProject ? "No photos in this project" : "No conversions yet"}
          </h2>
          <p className="mt-1.5 text-center text-sm text-zinc-500">
            {activeProject
              ? "Use the Organize button to add photos to this project"
              : "Transform your first photo into a twilight shot"}
          </p>
          {!activeProject && (
            <Link
              href="/convert"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c8a55c] px-6 py-2.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.98]"
            >
              Convert Photo
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conversions.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  if (selectMode) {
                    toggleSelect(c.id);
                  } else {
                    setSelectedConversion(c);
                  }
                }}
                className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-500 ${
                  selectMode && selectedIds.has(c.id)
                    ? "border-[#c8a55c]/40 bg-[#c8a55c]/5"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                }`}
              >
                {selectMode && (
                  <div
                    className={`absolute left-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                      selectedIds.has(c.id)
                        ? "border-[#c8a55c] bg-[#c8a55c] text-[#09090b]"
                        : "border-white/20 bg-[#09090b]/60 backdrop-blur-sm"
                    }`}
                  >
                    {selectedIds.has(c.id) && (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    )}
                  </div>
                )}
                <div className="relative aspect-video overflow-hidden bg-white/[0.02]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${supabaseUrl}/storage/v1/object/public/images/${
                      c.status === "completed" && c.result_url
                        ? c.result_url
                        : c.original_url
                    }`}
                    alt={c.original_filename}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  {c.status !== "completed" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]/60 backdrop-blur-[2px]">
                      <span
                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                          c.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-[#c8a55c]/10 text-[#c8a55c]"
                        }`}
                      >
                        {c.status === "failed" ? "Failed" : "Processing"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-3.5 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.original_filename}
                    </p>
                    <span
                      className={`ml-2 flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        c.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : c.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-[#c8a55c]/10 text-[#c8a55c]"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-600">
                    <span>
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {c.status === "completed" && c.processing_time_ms && (
                      <>
                        <span className="text-zinc-700">&middot;</span>
                        <span className="font-mono">
                          {(c.processing_time_ms / 1000).toFixed(1)}s
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-300 hover:border-white/[0.1] hover:text-foreground disabled:opacity-40"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {selectedConversion && supabaseUrl && (
        <GalleryModal
          conversion={selectedConversion}
          supabaseUrl={supabaseUrl}
          onClose={() => setSelectedConversion(null)}
        />
      )}
    </div>
  );
}

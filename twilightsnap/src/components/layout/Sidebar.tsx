"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Repeat, Grid3x3, Folder, FolderPlus, MoreHorizontal, Trash2 } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Convert", href: "/convert", icon: Repeat },
  { label: "Gallery", href: "/gallery", icon: Grid3x3 },
];

interface Project {
  id: string;
  name: string;
  conversion_count: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const isGallery = pathname.startsWith("/gallery");

  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectMenu, setProjectMenu] = useState<string | null>(null);

  useEffect(() => {
    if (isGallery) fetchProjects();
  }, [isGallery, pathname]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch {
      // projects table may not exist yet
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      if (res.ok) {
        setNewProjectName("");
        setShowNewProject(false);
        await fetchProjects();
      }
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    const res = await fetch("/api/projects/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (res.ok) {
      setProjectMenu(null);
      await fetchProjects();
      // Navigate to gallery without project filter
      window.location.href = "/gallery";
    }
  }

  // Get active project from URL search params
  const activeProject = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("project")
    : null;

  return (
    <aside className="flex w-44 flex-col border-r border-white/[0.04] bg-[#09090b] px-2.5 py-4">
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-white/[0.06] text-foreground"
                  : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-[#c8a55c]" : "text-zinc-600 group-hover:text-zinc-400"}`}
                strokeWidth={1.5}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Projects sub-nav — only visible on gallery page */}
      {isGallery && (
        <div className="mt-4 border-t border-white/[0.04] pt-4">
          <div className="flex items-center justify-between px-3">
            <h3 className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Projects
            </h3>
            <button
              onClick={() => setShowNewProject(true)}
              className="rounded p-0.5 text-zinc-600 transition-colors hover:text-[#c8a55c]"
              title="New project"
            >
              <FolderPlus className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>

          {projects.length > 0 && (
            <Link
              href={`/gallery?organize=true${activeProject ? `&project=${activeProject}` : ""}`}
              className="mx-1 mt-2 flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] font-medium text-zinc-500 transition-all hover:border-white/[0.1] hover:text-foreground"
            >
              Organize Photos
            </Link>
          )}

          {showNewProject && (
            <div className="mt-2 px-1">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateProject();
                  if (e.key === "Escape") {
                    setShowNewProject(false);
                    setNewProjectName("");
                  }
                }}
                placeholder="Name..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1.5 text-xs text-foreground placeholder:text-zinc-600 focus:border-[#c8a55c]/30 focus:outline-none focus:ring-1 focus:ring-[#c8a55c]/20"
                autoFocus
              />
              <div className="mt-1.5 flex gap-1">
                <button
                  onClick={handleCreateProject}
                  disabled={creatingProject || !newProjectName.trim()}
                  className="flex-1 rounded-lg bg-[#c8a55c] px-2 py-1 text-[10px] font-medium text-[#09090b] hover:bg-[#b8933f] disabled:opacity-40"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewProject(false);
                    setNewProjectName("");
                  }}
                  className="rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-0.5">
            <Link
              href="/gallery"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                !activeProject
                  ? "bg-white/[0.06] text-foreground"
                  : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
              }`}
            >
              <Grid3x3 className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
              <span>All</span>
            </Link>

            {projects.map((project) => (
              <div key={project.id} className="group relative">
                <Link
                  href={`/gallery?project=${project.id}`}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                    activeProject === project.id
                      ? "bg-white/[0.06] text-foreground"
                      : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                  }`}
                >
                  <Folder
                    className={`h-3 w-3 flex-shrink-0 ${activeProject === project.id ? "text-[#c8a55c]" : ""}`}
                    strokeWidth={1.5}
                  />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  <span className="flex-shrink-0 font-mono text-[10px] text-zinc-700">
                    {project.conversion_count}
                  </span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProjectMenu(projectMenu === project.id ? null : project.id);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-700 opacity-0 transition-all hover:text-zinc-400 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
                {projectMenu === project.id && (
                  <div className="absolute left-0 top-full z-20 mt-0.5 w-full rounded-lg border border-white/[0.08] bg-[#121214] p-1 shadow-xl">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

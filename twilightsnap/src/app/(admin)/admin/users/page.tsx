"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Shield,
  ShieldOff,
  Plus,
  X,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  created_at: string;
  credit_balance: number;
  total_conversions: number;
}

type RoleFilter = "all" | "admin" | "user";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // Add credits modal
  const [creditModal, setCreditModal] = useState<{
    user: AdminUser;
    amount: string;
  } | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);

  // Role confirm modal
  const [roleModal, setRoleModal] = useState<AdminUser | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data: AdminUser[] = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleAddCredits() {
    if (!creditModal) return;
    const amount = parseInt(creditModal.amount, 10);
    if (!amount || amount < 1) return;

    setCreditLoading(true);
    const res = await fetch("/api/admin/users/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: creditModal.user.id, amount }),
    });
    if (res.ok) {
      setCreditModal(null);
      await fetchUsers();
    }
    setCreditLoading(false);
  }

  async function handleToggleRole() {
    if (!roleModal) return;
    setRoleLoading(true);
    const newRole = roleModal.role === "admin" ? "user" : "admin";
    const res = await fetch("/api/admin/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: roleModal.id, role: newRole }),
    });
    if (res.ok) {
      setRoleModal(null);
      await fetchUsers();
    }
    setRoleLoading(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Users
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            <span className="font-mono">{users.length}</span> total user
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-zinc-600 outline-none transition-all duration-300 focus:border-[#c8a55c]/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-[#c8a55c]/20"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="appearance-none rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 pr-10 text-sm text-foreground outline-none transition-all duration-300 focus:border-[#c8a55c]/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-[#c8a55c]/20"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Regular Users</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-white/[0.06] border-t-[#c8a55c] animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Credits
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Conversions
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Joined
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {u.full_name || "\u2014"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {u.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-[#c8a55c]/10 text-[#c8a55c]"
                            : "bg-white/[0.04] text-zinc-500"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-foreground">
                      {u.credit_balance}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-foreground">
                      {u.total_conversions}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setCreditModal({ user: u, amount: "" })
                          }
                          className="rounded-lg bg-white/[0.04] p-1.5 text-zinc-500 transition-colors hover:text-[#c8a55c]"
                          title="Add Credits"
                        >
                          <Plus className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => setRoleModal(u)}
                          className="rounded-lg bg-white/[0.04] p-1.5 text-zinc-500 transition-colors hover:text-[#c8a55c]"
                          title={
                            u.role === "admin"
                              ? "Remove Admin"
                              : "Make Admin"
                          }
                        >
                          {u.role === "admin" ? (
                            <ShieldOff
                              className="h-4 w-4"
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Shield className="h-4 w-4" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Credits Modal */}
      {creditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreditModal(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#121214] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Add Credits
              </h3>
              <button
                onClick={() => setCreditModal(null)}
                className="rounded-lg bg-white/[0.04] p-1.5 text-zinc-500 transition-colors hover:text-[#c8a55c]"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Grant credits to{" "}
              <span className="font-medium text-foreground">
                {creditModal.user.email}
              </span>
            </p>
            <input
              type="number"
              min="1"
              placeholder="Number of credits"
              value={creditModal.amount}
              onChange={(e) =>
                setCreditModal({ ...creditModal, amount: e.target.value })
              }
              className="mt-4 w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-zinc-600 outline-none transition-all duration-300 focus:border-[#c8a55c]/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-[#c8a55c]/20"
              autoFocus
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setCreditModal(null)}
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredits}
                disabled={
                  creditLoading ||
                  !creditModal.amount ||
                  parseInt(creditModal.amount) < 1
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c8a55c] px-4 py-2.5 text-sm font-semibold text-[#09090b] transition-colors hover:bg-[#b8933f] disabled:opacity-50"
              >
                {creditLoading && (
                  <div className="h-4 w-4 rounded-full border-2 border-white/[0.06] border-t-[#c8a55c] animate-spin" />
                )}
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {roleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRoleModal(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#121214] p-6">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {roleModal.role === "admin" ? "Remove Admin" : "Make Admin"}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {roleModal.role === "admin"
                ? "Remove admin privileges from"
                : "Grant admin privileges to"}{" "}
              <span className="font-medium text-foreground">
                {roleModal.email}
              </span>
              ?
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setRoleModal(null)}
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleRole}
                disabled={roleLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c8a55c] px-4 py-2.5 text-sm font-semibold text-[#09090b] transition-colors hover:bg-[#b8933f] disabled:opacity-50"
              >
                {roleLoading && (
                  <div className="h-4 w-4 rounded-full border-2 border-white/[0.06] border-t-[#c8a55c] animate-spin" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

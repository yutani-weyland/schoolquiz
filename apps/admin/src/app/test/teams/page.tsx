"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface Team {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  quizCount: number;
}

export default function TestTeamsPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#3B82F6");

  const fetchTeams = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/user/teams", {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setTeams(data.teams || []);
        setMessage(`✅ Found ${data.count} teams (max: ${data.maxTeams})`);
      } else {
        setMessage(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setMessage(`❌ Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      setMessage("❌ Team name is required");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/user/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newTeamName.trim(),
          color: newTeamColor,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Team "${data.name}" created successfully!`);
        setNewTeamName("");
        fetchTeams(); // Refresh list
      } else {
        setMessage(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setMessage(`❌ Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"?`)) return;

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/user/teams/${teamId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Team "${teamName}" deleted successfully!`);
        fetchTeams(); // Refresh list
      } else {
        setMessage(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setMessage(`❌ Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultTeam = async (teamId: string) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/user/teams/${teamId}/set-default`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Team "${data.name}" set as default!`);
        fetchTeams(); // Refresh list
      } else {
        setMessage(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setMessage(`❌ Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
          <p>Please log in to test the Teams API.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Teams API Test Page</h1>

          {message && (
            <div
              className={`mb-4 p-4 rounded ${
                message.startsWith("✅")
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* Fetch Teams Button */}
            <div>
              <button
                onClick={fetchTeams}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Fetch Teams"}
              </button>
            </div>

            {/* Create Team Form */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name (e.g., Year 7A)"
                  className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  disabled={loading}
                />
                <input
                  type="color"
                  value={newTeamColor}
                  onChange={(e) => setNewTeamColor(e.target.value)}
                  className="w-20 h-10 border rounded"
                  disabled={loading}
                />
                <button
                  onClick={createTeam}
                  disabled={loading || !newTeamName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Teams List */}
            {teams.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-4 border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        {team.color && (
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: team.color }}
                          />
                        )}
                        <div>
                          <div className="font-semibold">
                            {team.name}
                            {team.isDefault && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {team.quizCount} quiz{team.quizCount !== 1 ? "es" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!team.isDefault && (
                          <button
                            onClick={() => setDefaultTeam(team.id)}
                            disabled={loading}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => deleteTeam(team.id, team.name)}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teams.length === 0 && message && message.includes("Found 0") && (
              <div className="border-t pt-6 text-center text-gray-500 dark:text-gray-400">
                No teams yet. Create your first team above!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

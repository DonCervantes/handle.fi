"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  credentials: Array<{ id: string; policyHash: string; active: boolean }>;
}

export default function DashboardPage() {
  const { ready, authenticated, logout, getAccessToken, user } = usePrivy();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [agentName, setAgentName] = useState("");

  useEffect(() => {
    if (ready && !authenticated) router.push("/");
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (authenticated) loadAgents();
  }, [authenticated]);

  async function loadAgents() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const data = await api.get<{ agents: Agent[] }>("/agents", token ?? undefined);
      setAgents(data.agents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createAgent() {
    if (!agentName.trim()) return;
    setCreating(true);
    try {
      const token = await getAccessToken();
      await api.post("/agents", { name: agentName, description: "AI treasury agent" }, token ?? undefined);
      setAgentName("");
      await loadAgents();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  if (!ready || !authenticated) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold">
          Handle<span className="text-green-400">.Fi</span>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user?.email?.address ?? user?.wallet?.address?.slice(0, 8) + "..."}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mis Agentes</h1>
          <a
            href="/demo"
            className="text-sm px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            Ver Demo →
          </a>
        </div>

        {/* Create agent */}
        <div className="border border-white/10 rounded-xl p-5 bg-white/5 space-y-3">
          <div className="text-sm font-medium text-gray-300">Crear nuevo agente</div>
          <div className="flex gap-3">
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAgent()}
              placeholder="Nombre del agente (ej. TreasuryBot)"
              className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50"
            />
            <button
              onClick={createAgent}
              disabled={creating || !agentName.trim()}
              className="px-5 py-2 bg-green-500 hover:bg-green-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {creating ? "..." : "Crear"}
            </button>
          </div>
        </div>

        {/* Agent list */}
        {loading ? (
          <div className="text-gray-500 text-sm">Cargando agentes...</div>
        ) : agents.length === 0 ? (
          <div className="border border-white/5 rounded-xl p-10 text-center text-gray-600">
            Crea tu primer agente financiero.
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border border-white/10 rounded-xl p-5 bg-white/5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    {agent.description && (
                      <div className="text-sm text-gray-500">{agent.description}</div>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      agent.credentials.length > 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {agent.credentials.length > 0 ? "Activo" : "Sin política"}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>ID: {agent.id.slice(0, 12)}...</span>
                  <span>Credenciales: {agent.credentials.length}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

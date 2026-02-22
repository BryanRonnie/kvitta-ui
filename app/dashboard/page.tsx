"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/api/auth.api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout: clearAuth } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.name || user?.email}</span>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome, {user?.name || "User"}!</h1>
          <p className="text-slate-500">Your dashboard is ready to use.</p>
        </Card>
      </main>
    </div>
  );
}

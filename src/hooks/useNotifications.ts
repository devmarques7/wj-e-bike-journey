import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data ?? []) as NotificationRow[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [payload.new as NotificationRow, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((n) => (n.id === (payload.new as any).id ? (payload.new as NotificationRow) : n)),
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((n) => n.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const clearAll = async () => {
    if (!user?.id) return;
    setItems([]);
    await supabase.from("notifications").delete().eq("user_id", user.id);
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return { items, loading, unreadCount, markRead, markAllRead, remove, clearAll, refetch: fetchAll };
}
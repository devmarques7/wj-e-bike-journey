import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function NotificationsBell() {
  const navigate = useNavigate();
  const { items, unreadCount, markRead, markAllRead, remove, clearAll } = useNotifications();

  const handleClick = async (id: string, link: string | null) => {
    await markRead(id);
    if (link) navigate(link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-full hover:bg-muted/50 transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-wj-green text-[10px] font-bold text-white flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 bg-background/95 backdrop-blur-xl border-border/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div>
            <h3 className="text-sm font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={clearAll}
              disabled={items.length === 0}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[420px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[420px] text-center px-6">
              <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You'll see new customers, appointments and updates here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              <AnimatePresence initial={false}>
                {items.map((n) => (
                  <motion.li
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      "group relative px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer",
                      !n.is_read && "bg-wj-green/[0.04]",
                    )}
                    onClick={() => handleClick(n.id, n.link)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full shrink-0",
                          n.is_read ? "bg-muted-foreground/30" : "bg-wj-green",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        aria-label="Dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
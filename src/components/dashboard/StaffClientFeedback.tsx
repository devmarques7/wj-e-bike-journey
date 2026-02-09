import { motion } from "framer-motion";
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

const feedbacks = [
  {
    id: 1,
    customer: "Emma van der Berg",
    rating: 5,
    comment: "Excellent service! My brakes work perfectly now.",
    date: "Today",
    sentiment: "positive",
  },
  {
    id: 2,
    customer: "Lucas de Vries",
    rating: 4,
    comment: "Good work, but took a bit longer than expected.",
    date: "Yesterday",
    sentiment: "positive",
  },
  {
    id: 3,
    customer: "Sophie Jansen",
    rating: 5,
    comment: "Marco is always professional and thorough.",
    date: "2 days ago",
    sentiment: "positive",
  },
  {
    id: 4,
    customer: "Thomas Bakker",
    rating: 3,
    comment: "Service was okay, but communication could improve.",
    date: "3 days ago",
    sentiment: "neutral",
  },
];

export default function StaffClientFeedback() {
  const averageRating = (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1);
  const positiveCount = feedbacks.filter(f => f.sentiment === "positive").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-wj-green" />
          <h3 className="text-lg font-medium text-foreground">Client Feedback</h3>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-wj-green fill-wj-green" />
          <span className="text-sm font-semibold text-foreground">{averageRating}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-wj-green" />
          <span className="text-sm text-foreground">{positiveCount} positive</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{feedbacks.length - positiveCount} other</span>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
        {feedbacks.map((feedback, index) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.05 }}
            className="p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">{feedback.customer}</p>
                <p className="text-[10px] text-muted-foreground">{feedback.date}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < feedback.rating
                        ? "text-wj-green fill-wj-green"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{feedback.comment}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

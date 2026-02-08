import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Loader2, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";

const suggestedQueries = [
  "Schedule maintenance",
  "Brake adjustment",
  "Battery check",
  "Full tune-up",
];

export default function ServiceAIAssistant() {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setAiResponse("Analyzing your service needs...");

    await new Promise(resolve => setTimeout(resolve, 1200));
    
    setAiResponse("Found the right service for you!");
    
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsProcessing(false);
    setAiResponse("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="relative py-8 overflow-hidden rounded-3xl bg-background/60 backdrop-blur-md border border-border/30">
      {/* Minimal glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-wj-green/5 rounded-full blur-[80px] z-0" />

      <div className="relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-wj-green/20 backdrop-blur-sm border border-wj-green/30 flex items-center justify-center mb-4 mx-auto">
            <Wrench className="h-5 w-5 text-wj-green" />
          </div>

          {/* Headline */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            How can we{" "}
            <span className="text-wj-green">help</span>?
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Tell us about your bike's needs and we'll find the right service.
          </p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative"
          >
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-wj-green/40 via-wj-green to-wj-green/40 rounded-full opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-300" />
              
              <div className="relative flex items-center gap-2 px-2 py-2 rounded-full border border-border/60 bg-background/90 backdrop-blur-sm">
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you need..."
                  className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-10 pl-4"
                  disabled={isProcessing}
                />
                
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || isProcessing}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-wj-green text-white transition-all duration-200 hover:bg-wj-green-dark disabled:opacity-40"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Processing State */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 right-0 mt-3 flex items-center justify-center"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex gap-1">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-wj-green"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-wj-green"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-1.5 h-1.5 rounded-full bg-wj-green"
                      />
                    </span>
                    <span>{aiResponse}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mt-8"
          >
            {suggestedQueries.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="group flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-muted-foreground border border-border/40 hover:border-wj-green/40 hover:text-foreground transition-all duration-200"
              >
                {suggestion}
                <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

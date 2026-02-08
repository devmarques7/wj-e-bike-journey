import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const suggestedQueries = [
  "City commute",
  "Carry cargo",
  "Sport & fitness",
  "Long distance",
];

const EIASection = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const analyzeQuery = (searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase();
    
    const categoryKeywords = {
      city: ["city", "urban", "commute", "daily", "work", "routine"],
      commuter: ["commuter", "distance", "long", "travel", "journey"],
      sport: ["sport", "fitness", "exercise", "speed", "fast", "athletic"],
      cargo: ["cargo", "carry", "load", "shopping", "kids", "family", "heavy"],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return { type: "category", value: category };
      }
    }

    return { type: "all", value: "all" };
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setAiResponse("Analyzing your needs...");

    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const analysis = analyzeQuery(query);
    
    setAiResponse("Found the perfect match!");
    
    await new Promise(resolve => setTimeout(resolve, 600));

    const searchParams = new URLSearchParams();
    if (analysis.type === "category") {
      searchParams.set("category", analysis.value);
    }
    searchParams.set("q", query);
    
    navigate(`/gallery?${searchParams.toString()}`);
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
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/eia-background.mp4" type="video/mp4" />
        </video>
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      </div>

      {/* Top gradient for smooth transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-[2] pointer-events-none" />

      {/* Bottom gradient for smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[2] pointer-events-none" />

      {/* Minimal glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-wj-green/5 rounded-full blur-[100px] z-[1]" />

      <div className="container-wj relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            What's your{" "}
            <span className="text-wj-green">ride style</span>?
          </h2>

          <p className="text-muted-foreground mb-8">
            Tell us about your routine and we'll find your perfect e-bike.
          </p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
                  placeholder="Describe your daily commute..."
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
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mt-10"
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
    </section>
  );
};

export default EIASection;

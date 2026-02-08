import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, Bot, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const suggestedQuestions = [
  "Qual bike é ideal para minha rotina urbana?",
  "Preciso carregar bagagens no dia a dia",
  "Quero uma bike esportiva para exercícios",
  "Busco uma opção econômica para cidade",
];

const EIASection = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const analyzeQuery = (searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase();
    
    // Keywords mapping
    const categoryKeywords = {
      city: ["cidade", "urbana", "urbano", "dia a dia", "rotina", "trabalho", "city"],
      commuter: ["commuter", "commute", "trajeto", "distância", "longa", "viagem"],
      sport: ["esporte", "esportiva", "exercício", "fitness", "velocidade", "rápida", "sport"],
      cargo: ["carga", "carregar", "bagagem", "compras", "criança", "família", "cargo"],
    };

    // Find matching category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return { type: "category", value: category, keywords: keywords.filter(k => lowerQuery.includes(k)) };
      }
    }

    // Default to all bikes
    return { type: "all", value: "all", keywords: [] };
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setAiResponse("Analisando sua rotina e necessidades...");

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const analysis = analyzeQuery(query);
    
    setAiResponse("Encontrei as melhores opções para você!");
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate with search params
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
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--wj-green)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--wj-green)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-wj-green/5 rounded-full blur-[120px]" />

      <div className="container-wj relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-wj-green/20 mb-8"
          >
            <Bot className="w-4 h-4 text-wj-green" />
            <span className="text-sm font-medium text-wj-green">E-IA • Guia Inteligente</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-display-sm md:text-display-md font-bold text-foreground mb-4"
          >
            Como é a sua{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-wj-green to-wj-green-light">
              rotina?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto"
          >
            Nosso assistente inteligente analisa seu estilo de vida para sugerir a bike ideal e o plano E-Pass mais adequado.
          </motion.p>

          {/* Search Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative"
          >
            <div className="relative group">
              {/* Glow border on focus */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-wj-green/50 via-wj-green to-wj-green/50 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
              
              <div className="relative flex items-center gap-3 p-2 md:p-3 rounded-2xl glass border border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-wj-green/10">
                  <Sparkles className="w-5 h-5 text-wj-green" />
                </div>
                
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Descreva sua rotina, necessidades ou estilo de vida..."
                  className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-base md:text-lg h-12"
                  disabled={isProcessing}
                />
                
                <Button
                  onClick={handleSearch}
                  disabled={!query.trim() || isProcessing}
                  className="h-12 px-6 rounded-xl gradient-wj text-white font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">Buscar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* AI Response Animation */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-4 flex items-center justify-center gap-3"
                >
                  <div className="flex items-center gap-3 px-5 py-3 rounded-full glass border border-wj-green/30">
                    <div className="flex gap-1">
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 rounded-full bg-wj-green"
                      />
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 rounded-full bg-wj-green"
                      />
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 rounded-full bg-wj-green"
                      />
                    </div>
                    <span className="text-sm text-foreground/80">{aiResponse}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Suggested Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16"
          >
            <p className="text-sm text-muted-foreground mb-4">Sugestões populares:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/50 bg-secondary/30 hover:bg-wj-green/10 hover:border-wj-green/30 transition-all duration-300"
                >
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {suggestion}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-wj-green group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default EIASection;

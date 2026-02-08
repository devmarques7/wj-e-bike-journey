import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MapPin, ArrowRight } from "lucide-react";

const openings = [
  {
    id: 1,
    title: "Senior Product Designer",
    department: "Design",
    location: "Amsterdam",
    type: "Full-time",
  },
  {
    id: 2,
    title: "Full Stack Developer",
    department: "Engineering",
    location: "Amsterdam / Remote",
    type: "Full-time",
  },
  {
    id: 3,
    title: "E-Bike Technician",
    department: "Operations",
    location: "Berlin",
    type: "Full-time",
  },
  {
    id: 4,
    title: "Marketing Manager",
    department: "Marketing",
    location: "Paris",
    type: "Full-time",
  },
  {
    id: 5,
    title: "Customer Experience Lead",
    department: "Support",
    location: "Rotterdam",
    type: "Full-time",
  },
];

const values = [
  { title: "Innovation First", description: "We push boundaries and challenge the status quo." },
  { title: "Sustainability", description: "Every decision considers our environmental impact." },
  { title: "Craftsmanship", description: "We obsess over details and quality." },
  { title: "Community", description: "We build together and grow together." },
];

const Career = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Careers
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Join the Ride
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Help us shape the future of urban mobility. We're looking for 
              passionate people who want to make a difference.
            </p>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20"
          >
            <h2 className="text-xl font-light text-foreground mb-8">Our Values</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="p-5 rounded-2xl border border-border/20 bg-muted/10"
                >
                  <h3 className="text-sm font-medium text-foreground mb-2">{value.title}</h3>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Open Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-xl font-light text-foreground mb-8">Open Positions</h2>
            <div className="space-y-3">
              {openings.map((job, index) => (
                <motion.button
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="w-full group p-5 rounded-2xl border border-border/30 bg-muted/10 hover:border-wj-green/30 transition-all duration-300 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-medium text-foreground group-hover:text-wj-green transition-colors">
                          {job.title}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                          {job.department}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                        <span className="text-border/50">•</span>
                        {job.type}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-wj-green group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Career;

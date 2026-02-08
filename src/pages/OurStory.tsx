import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const milestones = [
  { year: "2018", title: "The Beginning", description: "Founded in Amsterdam with a vision for sustainable urban mobility." },
  { year: "2019", title: "First Prototype", description: "Launched our first e-bike prototype, the Vision Alpha." },
  { year: "2020", title: "Series A", description: "Secured €5M in funding to scale production." },
  { year: "2021", title: "Market Launch", description: "Released Vision X1, our flagship urban e-bike." },
  { year: "2022", title: "European Expansion", description: "Opened stores in Berlin, Paris, and London." },
  { year: "2023", title: "100K Riders", description: "Reached 100,000 riders across Europe." },
];

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              About Us
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6">
              Our Story
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              We believe cities should be designed for people, not cars. 
              WJ Vision was born from a simple idea: make sustainable transportation 
              so beautiful and effortless that everyone wants to ride.
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-12 mb-24"
          >
            <div>
              <h2 className="text-2xl font-light text-foreground mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                A world where every urban journey is emission-free, 
                enjoyable, and effortlessly elegant. We design e-bikes 
                that don't just move you—they move the world forward.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-light text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To create the most refined e-bikes on the planet, 
                combining Dutch design heritage with cutting-edge technology 
                to redefine urban mobility for the modern rider.
              </p>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-light text-foreground mb-12">Our Journey</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border/30 -translate-x-1/2" />
              
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className={`relative flex flex-col md:flex-row gap-8 ${
                      index % 2 === 0 ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div className="md:w-1/2" />
                    <div className="absolute left-0 md:left-1/2 w-3 h-3 rounded-full bg-wj-green -translate-x-1/2 mt-2" />
                    <div className={`md:w-1/2 ${index % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                      <span className="text-wj-green text-sm font-medium">{milestone.year}</span>
                      <h3 className="text-lg font-medium text-foreground mt-1">{milestone.title}</h3>
                      <p className="text-muted-foreground text-sm mt-2">{milestone.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OurStory;

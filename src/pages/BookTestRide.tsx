import { useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Bike } from "lucide-react";

const bikeModels = [
  "Vision X1",
  "Vision X2 Pro",
  "Vision Sport",
  "Vision Cargo",
  "Vision Lite",
  "Vision Commuter+",
];

const timeSlots = [
  "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"
];

const BookTestRide = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    model: "",
    date: "",
    time: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Booking Confirmed",
      description: "We'll send you a confirmation email shortly.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Test Ride
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Book a Test Ride
            </h1>
            <p className="text-lg text-muted-foreground">
              Experience the future of urban mobility.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-muted/20 border-border/30 focus:border-wj-green/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-muted/20 border-border/30 focus:border-wj-green/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-muted-foreground">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-muted/20 border-border/30 focus:border-wj-green/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Select Model
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {bikeModels.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setFormData({ ...formData, model })}
                    className={`p-3 rounded-xl text-sm border transition-all duration-200 ${
                      formData.model === model
                        ? "border-wj-green bg-wj-green/10 text-wj-green"
                        : "border-border/30 text-muted-foreground hover:border-border/60"
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Preferred Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-muted/20 border-border/30 focus:border-wj-green/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Preferred Time
                </Label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({ ...formData, time })}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 ${
                        formData.time === time
                          ? "border-wj-green bg-wj-green/10 text-wj-green"
                          : "border-border/30 text-muted-foreground hover:border-border/60"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-wj-green hover:bg-wj-green/90 text-white py-6 rounded-xl text-sm font-medium"
            >
              Confirm Booking
            </Button>
          </motion.form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookTestRide;

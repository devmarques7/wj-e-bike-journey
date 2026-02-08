import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MapPin, Clock, Phone } from "lucide-react";

const stores = [
  {
    id: 1,
    city: "Amsterdam",
    address: "Prinsengracht 123",
    phone: "+31 20 123 4567",
    hours: "Mon-Sat: 10:00 - 19:00",
    isHeadquarters: true,
  },
  {
    id: 2,
    city: "Rotterdam",
    address: "Coolsingel 45",
    phone: "+31 10 234 5678",
    hours: "Mon-Sat: 10:00 - 18:00",
    isHeadquarters: false,
  },
  {
    id: 3,
    city: "Utrecht",
    address: "Oudegracht 78",
    phone: "+31 30 345 6789",
    hours: "Mon-Sat: 10:00 - 18:00",
    isHeadquarters: false,
  },
  {
    id: 4,
    city: "Berlin",
    address: "Friedrichstraße 200",
    phone: "+49 30 456 7890",
    hours: "Mon-Sat: 10:00 - 19:00",
    isHeadquarters: false,
  },
  {
    id: 5,
    city: "Paris",
    address: "Rue de Rivoli 88",
    phone: "+33 1 567 8901",
    hours: "Mon-Sat: 10:00 - 19:00",
    isHeadquarters: false,
  },
];

const FindStore = () => {
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
              Stores
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Find a Store
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Visit us in person. Experience our e-bikes and get expert advice.
            </p>
          </motion.div>

          {/* Store List */}
          <div className="space-y-4">
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 rounded-2xl border border-border/30 bg-muted/10 hover:border-wj-green/30 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-medium text-foreground">
                        {store.city}
                      </h3>
                      {store.isHeadquarters && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-wj-green/10 text-wj-green border border-wj-green/20">
                          Headquarters
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {store.address}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {store.hours}
                      </span>
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {store.phone}
                      </span>
                    </div>
                  </div>
                  <button className="text-sm text-muted-foreground hover:text-wj-green transition-colors duration-200 whitespace-nowrap">
                    Get Directions →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindStore;

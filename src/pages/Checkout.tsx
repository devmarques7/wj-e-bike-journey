import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Lock, Shield, Truck, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import { useCart } from "@/contexts/CartContext";
import { accessories } from "@/data/accessories";

// Upsell items - popular accessories
const upsellItems = accessories
  .filter((a) => a.isBestseller || a.isNew)
  .slice(0, 3);

const Checkout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [addedUpsells, setAddedUpsells] = useState<string[]>([]);
  const { items, totalPrice, addItem } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };

  const handleAddUpsell = (item: typeof upsellItems[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      color: item.colors[0]?.name,
    });
    setAddedUpsells((prev) => [...prev, item.id]);
    setTimeout(() => {
      setAddedUpsells((prev) => prev.filter((id) => id !== item.id));
    }, 2000);
  };

  const shipping = totalPrice >= 100 ? 0 : 9.95;
  const grandTotal = totalPrice + shipping;

  return (
    <div className="min-h-screen bg-background">
      <Navigation isScrolled={isScrolled} />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-24 md:pt-28 pb-16"
      >
        <div className="container-wj">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to="/accessories">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-light text-foreground">
              Checkout
            </h1>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left - Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3 space-y-8"
            >
              {/* Shipping */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-wj-green/10 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-wj-green" />
                  </div>
                  <h2 className="text-lg font-medium text-foreground">Shipping</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                    <Input id="firstName" placeholder="Jan" className="mt-1 bg-muted/20 border-border/30" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                    <Input id="lastName" placeholder="de Vries" className="mt-1 bg-muted/20 border-border/30" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                  <Input id="email" type="email" placeholder="jan@example.nl" className="mt-1 bg-muted/20 border-border/30" />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+31 6 12345678" className="mt-1 bg-muted/20 border-border/30" />
                </div>

                <div>
                  <Label htmlFor="address" className="text-xs text-muted-foreground">Address</Label>
                  <Input id="address" placeholder="Keizersgracht 123" className="mt-1 bg-muted/20 border-border/30" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="postcode" className="text-xs text-muted-foreground">Postcode</Label>
                    <Input id="postcode" placeholder="1015 CJ" className="mt-1 bg-muted/20 border-border/30" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                    <Input id="city" placeholder="Amsterdam" className="mt-1 bg-muted/20 border-border/30" />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-6 pt-6 border-t border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-wj-green/10 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-wj-green" />
                  </div>
                  <h2 className="text-lg font-medium text-foreground">Payment</h2>
                </div>

                <div className="space-y-2">
                  {["iDEAL", "Credit Card", "PayPal"].map((method, index) => (
                    <motion.button
                      key={method}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        index === 0
                          ? "border-wj-green bg-wj-green/5"
                          : "border-border/30 hover:border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          index === 0 ? "border-wj-green" : "border-muted-foreground/30"
                        }`}>
                          {index === 0 && <div className="w-2 h-2 rounded-full bg-wj-green" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{method}</span>
                        {index === 0 && (
                          <span className="text-[10px] text-muted-foreground ml-auto">Popular</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Upsell Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-6 border-t border-border/20"
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Frequently bought together
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {upsellItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="p-3 rounded-xl border border-border/30 bg-muted/10 hover:border-border/50 transition-all"
                    >
                      <div className="aspect-square rounded-lg bg-muted/20 mb-3 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wj-green/20 to-wj-green/5" />
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{formatPrice(item.price)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 w-7 p-0 ${
                            addedUpsells.includes(item.id)
                              ? "text-wj-green"
                              : "text-muted-foreground hover:text-wj-green"
                          }`}
                          onClick={() => handleAddUpsell(item)}
                          disabled={addedUpsells.includes(item.id)}
                        >
                          <motion.div
                            key={addedUpsells.includes(item.id) ? "check" : "plus"}
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {addedUpsells.includes(item.id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </motion.div>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-28 space-y-4">
                <div className="p-6 rounded-2xl border border-border/30 bg-muted/5">
                  <h2 className="text-sm font-medium text-muted-foreground mb-4">Order Summary</h2>

                  {/* Cart Items */}
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Your cart is empty
                    </p>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {items.map((item) => (
                        <div key={`${item.id}-${item.color}`} className="flex gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-wj-green/20 to-wj-green/5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-2 pt-4 border-t border-border/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={shipping === 0 ? "text-wj-green" : "text-foreground"}>
                        {shipping === 0 ? "Free" : formatPrice(shipping)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 mt-4 border-t border-border/20">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  size="lg"
                  className="w-full gradient-wj text-white hover:opacity-90"
                  disabled={items.length === 0}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Complete Order
                </Button>

                <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-wj-green" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-wj-green" />
                    <span>SSL Encrypted</span>
                  </div>
                </div>

                <p className="text-[10px] text-center text-muted-foreground">
                  By completing this order, you agree to our{" "}
                  <a href="#" className="text-wj-green hover:underline">Terms</a>
                  {" "}and{" "}
                  <a href="#" className="text-wj-green hover:underline">Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Checkout;

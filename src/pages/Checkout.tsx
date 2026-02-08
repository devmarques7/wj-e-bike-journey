import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Lock, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";

const Checkout = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Mock order data - in real app this would come from cart state/context
  const orderData = {
    product: "Vision X1",
    color: "Midnight Black",
    quantity: 1,
    price: 2499,
    ePass: "Silver",
    ePassPrice: 14.99,
    shipping: 0,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isScrolled={isScrolled} />

      <main className="pt-24 md:pt-28 pb-16">
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
              <Link to="/gallery">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-display-sm md:text-display-md font-bold text-foreground mb-2">
              Checkout
            </h1>
            <p className="text-muted-foreground">
              Complete your order in one simple step
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left - Shipping Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-wj-green" />
                  Shipping Information
                </h2>

                <form className="space-y-6">
                  {/* Name Row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Jan"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="de Vries"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jan@example.nl"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+31 6 12345678"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="Keizersgracht 123"
                      className="mt-1.5"
                    />
                  </div>

                  {/* City Row */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        placeholder="1015 CJ"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Amsterdam"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      defaultValue="Netherlands"
                      className="mt-1.5"
                      disabled
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-wj-green" />
                      Payment Method
                    </h3>

                    {/* Payment Options - Placeholder for Shopify */}
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border-2 border-wj-green bg-wj-green/5">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-wj-green flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-wj-green" />
                          </div>
                          <span className="font-medium text-foreground">
                            iDEAL
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            Most popular in NL
                          </span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-border hover:border-wj-green/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                          <span className="font-medium text-foreground">
                            Credit Card
                          </span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-border hover:border-wj-green/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                          <span className="font-medium text-foreground">
                            PayPal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>

            {/* Right - Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-28">
                <div className="glass rounded-2xl p-6 md:p-8 mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Order Summary
                  </h2>

                  {/* Product Item */}
                  <div className="flex gap-4 pb-6 border-b border-border mb-6">
                    <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <svg
                        viewBox="0 0 200 120"
                        className="w-16 h-10"
                        fill="none"
                      >
                        <g stroke="hsl(var(--wj-green))" strokeWidth="2">
                          <circle cx="160" cy="80" r="20" />
                          <circle cx="50" cy="80" r="20" />
                          <path d="M50 80 L90 50 L140 50 L160 80" />
                          <path d="M90 50 L90 80" />
                        </g>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {orderData.product}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {orderData.color}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {orderData.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      {formatPrice(orderData.price)}
                    </p>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">
                        {formatPrice(orderData.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        E-Pass {orderData.ePass}
                      </span>
                      <span className="text-foreground">
                        +{formatPrice(orderData.ePassPrice)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-wj-green">Free</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-foreground">
                        Total
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {formatPrice(orderData.price)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      + {formatPrice(orderData.ePassPrice)}/mo for E-Pass
                    </p>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className="w-full gradient-wj text-white hover:opacity-90"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Complete Order
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By completing this order, you agree to our{" "}
                    <a href="#" className="text-wj-green hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-wj-green hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-wj-green" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-wj-green" />
                    <span>SSL Encrypted</span>
                  </div>
                </div>

                {/* Reserved Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mt-6 p-4 rounded-xl bg-wj-green/10 border border-wj-green/20 text-center"
                >
                  <p className="text-sm text-wj-green font-medium">
                    ✨ Reserved for you for the next 15 minutes
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;

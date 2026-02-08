import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }}
            className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] max-h-[70vh] bg-background/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-wj-green" />
                <span className="text-sm font-medium text-foreground">
                  Cart ({totalItems})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-180px)]">
              {items.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-wj-green hover:text-wj-green"
                    onClick={onClose}
                  >
                    <Link to="/accessories">Browse Accessories</Link>
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.color}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
                    >
                      {/* Product Image Placeholder */}
                      <div className="w-14 h-14 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wj-green/20 to-wj-green/5" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        {item.color && (
                          <p className="text-xs text-muted-foreground">{item.color}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-medium text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <p className="text-sm font-medium text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="self-start p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <Button
                  asChild
                  className="w-full gradient-wj text-white hover:opacity-90"
                  size="lg"
                  onClick={onClose}
                >
                  <Link to="/checkout" className="flex items-center justify-center gap-2">
                    Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-3">
                  Free shipping on orders over €100
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

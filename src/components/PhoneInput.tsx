import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Phone, ShieldCheck } from "lucide-react";
import { COUNTRIES, type Country } from "@/data/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";

interface PhoneInputProps {
  value?: string; // E.164
  defaultCountry?: string; // iso2
  verified?: boolean;
  required?: boolean;
  label?: string;
  onChange?: (e164: string | null, isValid: boolean) => void;
  onVerified?: (e164: string) => void;
  /** When true, show the verification (Send code → enter OTP) flow */
  enableVerification?: boolean;
}

export function PhoneInput({
  value,
  defaultCountry = "NL",
  verified = false,
  required,
  label = "Phone number",
  onChange,
  onVerified,
  enableVerification = true,
}: PhoneInputProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<Country>(
    () =>
      COUNTRIES.find((c) => c.iso2 === defaultCountry) ??
      COUNTRIES.find((c) => c.iso2 === "NL")!
  );
  const [national, setNational] = useState("");
  const [sending, setSending] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [localVerified, setLocalVerified] = useState(verified);

  // Hydrate from value (E.164)
  useEffect(() => {
    if (!value) return;
    const parsed = parsePhoneNumberFromString(value);
    if (parsed && parsed.country) {
      const c = COUNTRIES.find((x) => x.iso2 === parsed.country);
      if (c) setCountry(c);
      setNational(parsed.nationalNumber as string);
    }
  }, [value]);

  useEffect(() => setLocalVerified(verified), [verified]);

  const e164 = useMemo(() => {
    const raw = national.replace(/\D/g, "");
    if (!raw) return "";
    return `+${country.dialCode}${raw}`;
  }, [national, country]);

  const valid = useMemo(() => (e164 ? isValidPhoneNumber(e164) : false), [e164]);

  useEffect(() => {
    onChange?.(e164 || null, valid);
    // Reset verified flag if user edits after verifying
    if (localVerified && value && e164 !== value) setLocalVerified(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e164, valid]);

  const sendCode = async () => {
    if (!valid) {
      toast({ title: "Invalid phone", description: "Check the number format.", variant: "destructive" });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-phone-otp", {
      body: { phone: e164 },
    });
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send code", description: error.message, variant: "destructive" });
      return;
    }
    setOtp("");
    setOtpOpen(true);
    toast({
      title: "Verification code sent",
      description: data?.dev_code
        ? `DEV mode — your code is ${data.dev_code}`
        : "Check your WhatsApp for the 6-digit code.",
    });
  };

  const verify = async (codeArg?: string) => {
    const code = codeArg ?? otp;
    if (code.length !== 6) return;
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("verify-phone-otp", {
      body: { phone: e164, code },
    });
    setVerifying(false);
    if (error || !data?.success) {
      toast({
        title: "Verification failed",
        description: error?.message || data?.error || "Invalid or expired code.",
        variant: "destructive",
      });
      return;
    }
    setLocalVerified(true);
    setOtpOpen(false);
    onVerified?.(e164);
    toast({ title: "Phone verified", description: "Your phone number is now confirmed." });
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" />
          {label}
          {required && <span className="text-wj-green">*</span>}
          {localVerified && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-wj-green">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </Label>
      )}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              className="h-12 px-3 bg-muted/50 border-border/50 hover:border-wj-green min-w-[120px] justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg leading-none">{country.flag}</span>
                <span className="text-sm">+{country.dialCode}</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-60 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[320px] bg-card/95 backdrop-blur border-border/50" align="start">
            <Command>
              <CommandInput placeholder="Search country..." className="h-10" />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {COUNTRIES.map((c) => (
                    <CommandItem
                      key={c.iso2}
                      value={`${c.name} ${c.iso2} ${c.dialCode}`}
                      onSelect={() => {
                        setCountry(c);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-muted-foreground">+{c.dialCode}</span>
                      {c.iso2 === country.iso2 && (
                        <Check className="h-4 w-4 text-wj-green" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input
          type="tel"
          inputMode="tel"
          value={national}
          onChange={(e) => setNational(e.target.value.replace(/[^\d\s-]/g, ""))}
          placeholder="6 12345678"
          className="h-12 flex-1 bg-muted/50 border-border/50 focus:border-wj-green"
          required={required}
        />

        {enableVerification && !localVerified && (
          <Button
            type="button"
            variant="outline"
            disabled={!valid || sending}
            onClick={sendCode}
            className="h-12 border-wj-green/40 text-wj-green hover:bg-wj-green/10"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
          </Button>
        )}
      </div>

      {!valid && national.length > 0 && (
        <p className="text-xs text-destructive">Enter a valid number for {country.name}.</p>
      )}

      {otpOpen && enableVerification && !localVerified && (
        <div className="mt-3 p-4 rounded-2xl border border-border/50 bg-muted/30 space-y-3">
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code sent to <span className="text-foreground">{e164}</span> via WhatsApp.
          </p>
          <div className="flex items-center gap-3">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (v.length === 6) verify(v);
              }}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {verifying && <Loader2 className="h-4 w-4 animate-spin text-wj-green" />}
          </div>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={sendCode}
              disabled={sending}
              className="text-wj-green hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => setOtpOpen(false)}
              className="text-muted-foreground hover:text-foreground ml-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
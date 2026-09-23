import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const closeClasses = "close-invitation fixed right-3 z-[60] grid min-h-11 min-w-11 place-items-center rounded-full border border-gold/35 bg-background text-wine shadow-sm transition-transform duration-200 hover:bg-background hover:rotate-90 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/** Close control for pages other than the invitation: returns to the sealed envelope. */
export function PageClose() {
  return <Link to="/" aria-label="Close and return to the envelope" title="Close" className={closeClasses}>
    <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
  </Link>;
}

export function GateClose({ onClose, buttonRef }: { onClose: () => void; buttonRef: React.RefObject<HTMLButtonElement | null> }) {
  return <Button ref={buttonRef} type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close wedding invitation" aria-controls="invitation-content" aria-expanded="true" title="Close invitation" className={closeClasses}>
    <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
  </Button>;
}

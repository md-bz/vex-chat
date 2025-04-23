import React, { useState } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Check, Copy } from "lucide-react";

interface CopyableProps {
  value: string;
  tooltipCopy?: string;
  tooltipCopied?: string;
  buttonProps?: React.ComponentProps<typeof Button>;
}

const Copyable: React.FC<CopyableProps> = ({
  value,
  tooltipCopy = "Copy",
  tooltipCopied = "Copied!",
  buttonProps = {},
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // Optionally handle error
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            {...buttonProps}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? tooltipCopied : tooltipCopy}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Copyable;

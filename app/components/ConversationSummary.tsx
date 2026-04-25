import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function ConversationSummary({ summary }: { summary: string | null }) {
  return (
    <Card className="glass-panel border-white/80 bg-white/70 py-0">
      <CardHeader className="border-b border-black/5 px-5 pb-4 pt-5">
        <CardTitle className="flex items-center gap-3 font-heading text-2xl font-medium text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dce8ea] text-[#24505a]">
            <FileText className="h-4 w-4" />
          </span>
          AI Call Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generated from the Bolna conversation transcript and qualification flow.
        </p>
      </CardHeader>
      <CardContent className="px-5 py-5">
        {summary ? (
          <p className="text-sm leading-7 text-foreground/90">{summary}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Summary not available for this call.</p>
        )}
      </CardContent>
    </Card>
  );
}

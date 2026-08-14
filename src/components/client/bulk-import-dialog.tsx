"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

export interface BulkPreviewColumn {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

export interface BulkImportActions {
  downloadTemplate: (restaurantId?: string) => Promise<Blob>;
  templateFileName: string;
  validateFile: (file: File, restaurantId?: string) => Promise<any>;
  importFile: (file: File, restaurantId?: string) => Promise<any>;
  downloadErrorReport: (importId: string) => Promise<Blob>;
}

export interface BulkImportConfig {
  title: string;
  description: string;
  columns: BulkPreviewColumn[];
  actions: BulkImportActions;
}

interface ValidateResult {
  totalRows: number;
  summary: { valid: number; invalid: number };
  validRows: any[];
  invalidRows: { rowNumber: number; name: string; errors: string[] }[];
}

interface ImportResult {
  importId: string;
  imported: number;
  skipped: number;
  failed: number;
  createdCount: number;
  errorReportUrl: string;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  restaurantId?: string;
  config: BulkImportConfig;
}

const STEPS: { key: "upload" | "preview" | "result"; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "result", label: "Import" },
];

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function BulkImportDialog({
  open,
  onOpenChange,
  onSuccess,
  restaurantId,
  config,
}: BulkImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setValidateResult(null);
    setImportResult(null);
    setImportError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return;
    const isSpreadsheet = /\.(csv|xlsx|xls)$/i.test(selected.name);
    if (!isSpreadsheet) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Only CSV or Excel (.xlsx/.xls) files are supported.",
      });
      return;
    }
    setFile(selected);
  };

  const handleTemplateDownload = async () => {
    try {
      setDownloadingTemplate(true);
      const blob = await config.actions.downloadTemplate(restaurantId);
      downloadBlob(blob, config.actions.templateFileName);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download the template.",
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    try {
      setValidating(true);
      const res = await config.actions.validateFile(file, restaurantId);
      setValidateResult(res.data);
      setStep("preview");
    } catch {
      // Global interceptor already shows the toast
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setImporting(true);
      setImportError(null);
      const res = await config.actions.importFile(file, restaurantId);
      setImportResult(res.data);
      setStep("result");
      onSuccess();
      toast({ title: "Success", description: res.message });
    } catch (error: any) {
      if (error?.response?.data?.data?.summary) {
        setValidateResult(error.response.data.data);
        setStep("preview");
      }
      setImportError(error?.response?.data?.message || "Import failed. No valid rows to import.");
    } finally {
      setImporting(false);
    }
  };

  const handleErrorReportDownload = async () => {
    if (!importResult) return;
    try {
      const blob = await config.actions.downloadErrorReport(importResult.importId);
      downloadBlob(blob, `bulk-import-error-report-${importResult.importId}.csv`);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download the error report.",
      });
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : i < stepIndex
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
            </div>
          ))}
        </div>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileSelected(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  handleFileSelected(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              <div className="rounded-full bg-primary/10 p-3">
                {file ? (
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                ) : (
                  <UploadCloud className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : "Drag & drop your file here, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB — .csv, .xlsx or .xls`
                    : "CSV or Excel (.csv / .xlsx / .xls) · max 500 rows"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleTemplateDownload} disabled={downloadingTemplate}>
                {downloadingTemplate ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Template
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button onClick={handleValidate} disabled={!file || validating}>
                  {validating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="mr-2 h-4 w-4" />
                  )}
                  Validate &amp; Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "preview" && validateResult && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3.5 w-3.5" />
                {validateResult.totalRows} rows parsed
              </Badge>
              <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {validateResult.summary.valid} valid
              </Badge>
              <Badge
                variant={validateResult.summary.invalid > 0 ? "destructive" : "secondary"}
                className="gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                {validateResult.summary.invalid} invalid
              </Badge>
            </div>

            {validateResult.summary.invalid > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Invalid rows will be skipped</AlertTitle>
                <AlertDescription>
                  Only the {validateResult.summary.valid} valid row(s) will be imported. You can
                  download an error report after importing.
                </AlertDescription>
              </Alert>
            )}

            {importError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Import failed</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="max-h-[320px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    {config.columns.map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validateResult.validRows.map((row) => (
                    <TableRow key={`v-${row.rowNumber}`}>
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      {config.columns.map((col) => (
                        <TableCell key={col.key}>
                          {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {validateResult.invalidRows.map((row) => (
                    <TableRow key={`i-${row.rowNumber}`}>
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      {config.columns.map((col) => (
                        <TableCell key={col.key} className={col.key === "name" ? "font-medium" : ""}>
                          {col.key === "name" ? (row.name || "—") : "—"}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Badge variant="destructive">{row.errors.length} error(s)</Badge>
                        <div className="mt-1 text-xs text-red-600">{row.errors.join("; ")}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")} disabled={importing}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || validateResult.summary.valid === 0}
                >
                  {importing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  Import {validateResult.summary.valid} Item(s)
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Import complete</h3>
              <p className="text-sm text-muted-foreground">
                {importResult.imported} item(s) imported, {importResult.skipped} skipped.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped (duplicates)</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {importResult.failed > 0 && (
              <Button variant="outline" className="w-full" onClick={handleErrorReportDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Error Report
              </Button>
            )}

            <div className="flex justify-end">
              <Button onClick={() => handleClose(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
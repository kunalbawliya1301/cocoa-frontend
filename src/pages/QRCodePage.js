import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, Printer, QrCode } from "lucide-react";

/* ── Build a QR code image URL using Google Charts API ──────────────
   This is a simple <img> tag — no npm package or CDN script needed.
   The URL encodes the content as a GET param and returns a PNG QR code.
   ──────────────────────────────────────────────────────────────────── */
const getQRUrl = (text, size = 180) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=4A3728&bgcolor=FFFFFF&margin=10`;

/* ── Single QR Card ─────────────────────────────────── */
const QRCard = ({ tableNumber, baseUrl }) => {
  const url = `${baseUrl}/menu?table=${tableNumber}`;
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3 border border-border/40 shadow-sm print:shadow-none print:break-inside-avoid">
      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{tableNumber}</span>
      </div>
      <img
        src={getQRUrl(url)}
        alt={`QR Code for Table ${tableNumber}`}
        width={180}
        height={180}
        className="rounded-xl"
        loading="lazy"
      />
      <p className="text-xs font-semibold text-primary">Table {tableNumber}</p>
      <p className="text-[10px] text-muted-foreground text-center break-all">{url}</p>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────── */
export const QRCodePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tableCount, setTableCount] = useState(8);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [generated, setGenerated] = useState(false);
  const [tableNumbers, setTableNumbers] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  const handleGenerate = () => {
    const count = Math.max(1, Math.min(50, Number(tableCount)));
    setTableNumbers(Array.from({ length: count }, (_, i) => i + 1));
    setGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 md:px-12 print:pt-4">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8 print:hidden">
          <Link to="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <QrCode className="w-6 h-6" /> QR Codes — Scan to Order
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Print these QR codes and place them on each table. Customers scan to open the menu directly.
            </p>
          </div>
        </div>

        {/* ── Config Panel ── */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-border/40 shadow-sm print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="tableCount">Number of Tables</Label>
              <Input
                id="tableCount"
                type="number"
                min={1}
                max={50}
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Max 50 tables</p>
            </div>

            <div>
              <Label htmlFor="baseUrl">Your Website URL</Label>
              <Input
                id="baseUrl"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">The deployed URL customers will scan to</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleGenerate} className="flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Generate QR Codes
            </Button>
            {generated && (
              <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print / Download
              </Button>
            )}
          </div>
        </div>

        {/* ── Print header (only when printing) ── */}
        {generated && (
          <div className="hidden print:block mb-6 text-center">
            <h2 className="text-xl font-bold">Table QR Codes</h2>
            <p className="text-sm text-gray-500">Scan to view menu &amp; order</p>
          </div>
        )}

        {/* ── QR Grid ── */}
        {generated && tableNumbers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tableNumbers.map((n) => (
              <QRCard key={n} tableNumber={n} baseUrl={baseUrl} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!generated && (
          <div className="text-center py-20 text-muted-foreground">
            <QrCode className="w-14 h-14 mx-auto mb-4 opacity-30" />
            <p>Enter your table count and click "Generate QR Codes" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

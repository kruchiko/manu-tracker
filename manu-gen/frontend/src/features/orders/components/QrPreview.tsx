import { useQrCode } from "../hooks/useQrCode";
import type { Order } from "../orders.types";

interface QrPreviewProps {
  order: Order;
}

export function QrPreview({ order }: QrPreviewProps) {
  const { data: qrData, isLoading, error } = useQrCode(order.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        Loading QR code…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load QR code: {error.message}
      </div>
    );
  }

  // TanStack Query types data as T | undefined regardless of the state machine;
  // this guard satisfies the type checker and is a defensive fallback.
  if (!qrData) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <img
        src={qrData.qr}
        alt="QR code"
        className="h-48 w-48 print:h-64 print:w-64"
      />

      <div className="text-center">
        <p className="text-2xl font-bold tracking-widest">{order.trayCode}</p>
        <p className="text-sm text-gray-500">{order.orderNumber}</p>
      </div>

      <button
        onClick={() => window.print()}
        className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 print:hidden"
      >
        Print
      </button>
    </div>
  );
}

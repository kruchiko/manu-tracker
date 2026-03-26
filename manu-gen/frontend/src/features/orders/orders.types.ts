export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  productType: string;
  quantity: number;
  notes: string;
  trayCode: string;
  createdAt: string;
  pipelineId: string;
  pipelineName: string;
}

export type OrdersResponse = Order[];

export interface QrCodeResponse {
  qr: string;
}

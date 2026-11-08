export class SaveIntegrationDto {
  type: string;
  name: string;
  apiUrl: string;
  apiKey?: string;
  apiSecret?: string;
  syncInventory?: boolean;
  syncPrices?: boolean;
  autoCreateInvoice?: boolean;
  isActive?: boolean;
}

export class CreateWebhookDto {
  name: string;
  targetUrl: string;
  secret: string;
  events: string[];
}

export class TriggerWebhookTestDto {
  endpointId: string;
  event: string;
  payload?: any;
}
